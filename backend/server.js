require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const db = require("./db");
const emailService = require("./emailService");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "100mb" }));

// Static folder untuk file uploads (PDF SILO, dll)
const uploadsSiloDir = path.join(__dirname, "uploads", "silo");
if (!fs.existsSync(uploadsSiloDir)) {
  fs.mkdirSync(uploadsSiloDir, { recursive: true });
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint khusus upload file SILO (Base64 PDF)
app.post("/api/upload-silo", (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res
        .status(400)
        .json({
          data: null,
          error: { message: "fileName and fileData (base64) are required" },
        });
    }

    const base64Data = fileData.replace(/^data:.*?;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const cleanName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const savedName = `${Date.now()}_${cleanName}`;
    const targetPath = path.join(uploadsSiloDir, savedName);

    fs.writeFileSync(targetPath, buffer);

    const relativeUrl = `/uploads/silo/${savedName}`;
    res.json({
      data: {
        fileName: cleanName,
        filePath: relativeUrl,
        fileSize: buffer.length,
        fileMime: "application/pdf",
      },
      error: null,
    });
  } catch (err) {
    console.error("POST /api/upload-silo error:", err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── Health check ──────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── Helper: parse JSON param dari query string ────────────
function parseParam(val) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

// ── Helper: process row, parse JSON fields, and convert Buffer to string ──
function processRow(row) {
  if (!row) return row;
  // Parse JSON fields for perbaikan.items
  if (row.items && typeof row.items === "string") {
    try {
      row.items = JSON.parse(row.items);
    } catch {}
  }
  // Convert any Buffer columns to string (useful for BLOB/LONGBLOB storing base64/strings)
  for (const key of Object.keys(row)) {
    if (Buffer.isBuffer(row[key])) {
      row[key] = row[key].toString("utf-8");
    }
    // Convert BigInt values (e.g. AUTO_INCREMENT id) to regular Number
    if (typeof row[key] === "bigint") {
      row[key] = Number(row[key]);
    }
  }
  return row;
}

// ── Helper: build SELECT query dengan filter ──────────────
function buildSelect(table, params) {
  const { select, order, ascending, maybeSingle, single, limit } = params;
  // Parse semua filter params dari JSON string
  const eq = parseParam(params.eq);
  const gte = parseParam(params.gte);
  const lte = parseParam(params.lte);
  const ilike = parseParam(params.ilike);

  const cols = !select || select === "*" ? "*" : select;
  let sql = `SELECT ${cols} FROM \`${table}\``;
  const values = [];
  const conditions = [];

  // Tabel yang tidak memiliki project_id (profiles, projects, permissions, dll)
  const TABLES_WITHOUT_PROJECT_ID = [
    "profiles",
    "projects",
    "permissions",
    "user_permissions",
  ];

  // Auto-filter by project_id jika parameter project_id ada dan tabel memiliki kolom project_id
  if (params.project_id && !TABLES_WITHOUT_PROJECT_ID.includes(table)) {
    conditions.push(`\`project_id\` = ?`);
    values.push(params.project_id);
  }

  if (eq && typeof eq === "object") {
    for (const [col, val] of Object.entries(eq)) {
      conditions.push(`\`${col}\` = ?`);
      values.push(val);
    }
  }
  if (gte && typeof gte === "object") {
    for (const [col, val] of Object.entries(gte)) {
      conditions.push(`\`${col}\` >= ?`);
      values.push(val);
    }
  }
  if (lte && typeof lte === "object") {
    for (const [col, val] of Object.entries(lte)) {
      conditions.push(`\`${col}\` <= ?`);
      values.push(val);
    }
  }
  if (ilike && typeof ilike === "object") {
    // MySQL LIKE sudah case-insensitive secara default (utf8mb4_general_ci)
    for (const [col, val] of Object.entries(ilike)) {
      conditions.push(`\`${col}\` LIKE ?`);
      values.push(val);
    }
  }

  if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;
  if (order)
    sql += ` ORDER BY \`${order}\` ${ascending === "false" || ascending === false ? "DESC" : "ASC"}`;
  if (limit) sql += ` LIMIT ${parseInt(limit)}`;

  return {
    sql,
    values,
    maybeSingle: maybeSingle === "true",
    single: single === "true",
  };
}

// ── Khusus: GET login_histories dengan username dari profiles ──
// Route ini harus didefinisikan SEBELUM generic loop agar lebih prioritas
app.get("/api/login_histories", async (req, res) => {
  try {
    console.log("\n[GET /login_histories] query:", JSON.stringify(req.query));
    const {
      order = "login_at",
      ascending = "false",
      limit,
      ilike: ilikeStr,
    } = req.query;
    const ilike = ilikeStr ? JSON.parse(ilikeStr) : null;
    const limitVal = limit ? parseInt(limit) : 500;
    const orderDir = ascending === "true" ? "ASC" : "DESC";

    const conditions = [];
    const values = [];

    if (ilike && ilike.username) {
      // Filter berdasarkan username di profiles ATAU di kolom username jika ada
      conditions.push(
        "(p.username LIKE ? OR lh.user_id IN (SELECT id FROM `profiles` WHERE username LIKE ?))",
      );
      values.push(ilike.username, ilike.username);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        lh.id,
        lh.user_id,
        COALESCE(lh.username, p.username) AS username,
        lh.login_at,
        lh.logout_at,
        lh.ip_address,
        lh.user_agent
      FROM \`login_histories\` lh
      LEFT JOIN \`profiles\` p ON p.id = lh.user_id
      ${whereClause}
      ORDER BY lh.\`${order}\` ${orderDir}
      LIMIT ${limitVal}
    `;

    console.log("[GET /login_histories] SQL:", sql.trim(), "| values:", values);
    const [rows] = await db.query(sql, values);
    res.json({ data: rows, error: null });
  } catch (err) {
    console.error("GET /login_histories error:", err.message);
    res
      .status(500)
      .json({ data: null, error: { message: err.message, code: err.code } });
  }
});

app.post("/api/send-notification", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: "type and data are required" });
    }

    const pageName = type.toLowerCase(); // 'ppa' or 'rpa'

    // Query: email semua user aktif yang punya can_approve=1 di halaman ini,
    // ATAU semua user admin aktif (admin selalu bisa approve)
    // user_permissions -> permissions (page_name) via permission_id FK
    const query = `
      SELECT DISTINCT p.email
      FROM \`profiles\` p
      LEFT JOIN \`user_permissions\` up ON up.user_id = p.id
      LEFT JOIN \`permissions\` perm ON perm.id = up.permission_id AND perm.page_name = ?
      WHERE p.is_active = 1
        AND p.email IS NOT NULL
        AND p.email != ''
        AND (
          (up.can_approve = 1 AND perm.id IS NOT NULL)
          OR (p.role = 'admin')
        )
    `;

    const [users] = await db.query(query, [pageName]);
    const recipients = users
      .map((u) => u.email)
      .filter((email) => email && email.includes("@"));

    console.log(
      `[Notification] Menemukan ${recipients.length} penerima untuk ${type}:`,
      recipients,
    );

    if (recipients.length > 0) {
      // Jalankan pengiriman email secara async (tidak memblokir response HTTP client)
      emailService
        .sendApprovalNotification(type, data, recipients)
        .catch((err) =>
          console.error("[Notification] Error async email:", err),
        );
    }

    res.json({ success: true, recipientsCount: recipients.length });
  } catch (err) {
    console.error("POST /api/send-notification error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Generic CRUD Routes ───────────────────────────────────
const TABLES = [
  "alat_berat",
  "alat_pendukung",
  "bbm_transactions",
  "bbm_stocks",
  "kegiatan_mekanik",
  "oli_transactions",
  "oli_stocks",
  "perbaikan",
  "ppa",
  "pemutihan",
  "profiles",
  "projects", // Tambahkan projects ke generic CRUD
  "rpa",
  "rpa_details",
  "sewa_alat",
  "sewa_alat_eksternal",
  "sparepart",
  "sparepart_transactions",
  "timesheet",
  "audit_logs",
  "login_histories",
  "user_permissions",
  "silo_dokumen",
  "v_silo_dokumen",
];

for (const table of TABLES) {
  // GET - select
  app.get(`/api/${table}`, async (req, res) => {
    try {
      // DEBUG: log raw query params
      console.log(`\n[GET /${table}] raw query:`, JSON.stringify(req.query));
      const built = buildSelect(table, req.query);
      console.log(`[GET /${table}] SQL:`, built.sql, "| values:", built.values);
      const { sql, values, maybeSingle, single } = built;
      const [rows] = await db.query(sql, values);

      // Parse JSON and decode Buffer fields
      const parsed = rows.map(processRow);

      if (maybeSingle || single) {
        if (parsed.length === 0) {
          if (single)
            return res
              .status(406)
              .json({
                data: null,
                error: { message: "No rows found", code: "PGRST116" },
              });
          return res.json({ data: null, error: null });
        }
        return res.json({ data: parsed[0], error: null });
      }
      res.json({ data: parsed, error: null });
    } catch (err) {
      console.error(`GET /${table} error:`, err.message);
      res
        .status(500)
        .json({ data: null, error: { message: err.message, code: err.code } });
    }
  });

  // POST - insert
  app.post(`/api/${table}`, async (req, res) => {
    try {
      const body = req.body;
      const single = req.query.single === "true" || req.query.select;
      const items = Array.isArray(body) ? body : [body];
      const results = [];

      // Tabel yang menggunakan int/bigint AUTO_INCREMENT / GENERATED AS IDENTITY (bukan UUID)
      const INT_ID_TABLES = [
        "rpa",
        "rpa_details",
        "kegiatan_mekanik",
        "silo_dokumen",
      ];
      const useIntId = INT_ID_TABLES.includes(table);

      // Tabel yang tidak memiliki project_id
      const TABLES_WITHOUT_PROJECT_ID = [
        "profiles",
        "projects",
        "permissions",
        "user_permissions",
      ];

      for (const item of items) {
        // Serialize JSON fields
        const row = { ...item };
        if (row.items && typeof row.items === "object")
          row.items = JSON.stringify(row.items);

        // Auto-add project_id jika ada di query dan tabel memiliki kolom project_id
        if (
          req.query.project_id &&
          !TABLES_WITHOUT_PROJECT_ID.includes(table) &&
          !row.project_id
        ) {
          row.project_id = req.query.project_id;
        }

        if (!useIntId) {
          // Generate UUID jika id tidak ada (untuk tabel UUID)
          if (!row.id) {
            const { v4: uuidv4 } = require("uuid");
            row.id = uuidv4();
          }
        } else {
          // Untuk tabel int AUTO_INCREMENT: hapus id agar MySQL generate otomatis
          delete row.id;
        }

        const cols = Object.keys(row)
          .map((c) => `\`${c}\``)
          .join(", ");
        const placeholders = Object.keys(row)
          .map(() => "?")
          .join(", ");
        const vals = Object.values(row);
        const [insertResult] = await db.query(
          `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders})`,
          vals,
        );

        // Fetch inserted row
        let insertedRow;
        if (useIntId) {
          // Gunakan insertId dari hasil INSERT (AUTO_INCREMENT)
          // Konversi BigInt ke Number agar tidak jadi 0 atau error saat dipakai di query
          const insertedId = Number(insertResult.insertId);
          if (!insertedId)
            throw new Error(
              `insertId tidak valid setelah INSERT ke ${table}: ${insertResult.insertId}`,
            );
          const [inserted] = await db.query(
            `SELECT * FROM \`${table}\` WHERE id = ?`,
            [insertedId],
          );
          insertedRow = inserted[0];
        } else {
          const [inserted] = await db.query(
            `SELECT * FROM \`${table}\` WHERE id = ?`,
            [row.id],
          );
          insertedRow = inserted[0];
        }

        results.push(processRow(insertedRow));
      }

      if (single || !Array.isArray(body)) {
        res.json({ data: results[0], error: null });
      } else {
        res.json({ data: results, error: null });
      }
    } catch (err) {
      console.error(`POST /${table} error:`, err.message);
      res
        .status(500)
        .json({ data: null, error: { message: err.message, code: err.code } });
    }
  });

  // PATCH - update by id (dengan query params eq)
  app.patch(`/api/${table}`, async (req, res) => {
    try {
      const { eq, select, single } = req.query;
      const body = { ...req.body };
      if (body.items && typeof body.items === "object")
        body.items = JSON.stringify(body.items);

      if (!eq)
        return res
          .status(400)
          .json({ data: null, error: { message: "eq parameter required" } });

      const eqParsed = JSON.parse(eq);
      const setCols = Object.keys(body)
        .map((c) => `\`${c}\` = ?`)
        .join(", ");
      const setVals = Object.values(body);
      const whereCols = Object.keys(eqParsed)
        .map((c) => `\`${c}\` = ?`)
        .join(" AND ");
      const whereVals = Object.values(eqParsed);

      await db.query(`UPDATE \`${table}\` SET ${setCols} WHERE ${whereCols}`, [
        ...setVals,
        ...whereVals,
      ]);

      if (select || single === "true") {
        const [rows] = await db.query(
          `SELECT * FROM \`${table}\` WHERE ${whereCols}`,
          whereVals,
        );
        const row = processRow(rows[0] || null);
        return res.json({ data: row, error: null });
      }

      res.json({ data: null, error: null });
    } catch (err) {
      console.error(`PATCH /${table} error:`, err.message);
      res
        .status(500)
        .json({ data: null, error: { message: err.message, code: err.code } });
    }
  });

  // DELETE - delete by eq
  app.delete(`/api/${table}`, async (req, res) => {
    try {
      const { eq, select, single } = req.query;
      if (!eq)
        return res
          .status(400)
          .json({ data: null, error: { message: "eq parameter required" } });

      const eqParsed = JSON.parse(eq);
      const whereCols = Object.keys(eqParsed)
        .map((c) => `\`${c}\` = ?`)
        .join(" AND ");
      const whereVals = Object.values(eqParsed);

      let returnData = null;
      if (select || single === "true") {
        const [rows] = await db.query(
          `SELECT * FROM \`${table}\` WHERE ${whereCols}`,
          whereVals,
        );
        returnData = processRow(rows[0] || null);
      }

      await db.query(`DELETE FROM \`${table}\` WHERE ${whereCols}`, whereVals);

      res.json({ data: returnData, error: null });
    } catch (err) {
      console.error(`DELETE /${table} error:`, err.message);
      res
        .status(500)
        .json({ data: null, error: { message: err.message, code: err.code } });
    }
  });
}

// ── System: Get user stats (total & online count) ────────
app.get("/api/system/user-stats", async (req, res) => {
  try {
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM `profiles` WHERE `is_active` = 1",
    );
    const [[{ online }]] = await db.query(
      "SELECT COUNT(*) as online FROM `profiles` WHERE `is_active` = 1 AND `last_activity` IS NOT NULL AND `last_activity` >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)",
    );
    res.json({ data: { total, online }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Update last_activity ─────────────────────────
app.post("/api/system/update-activity", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    await db.query(
      "UPDATE `profiles` SET `last_activity` = NOW() WHERE `id` = ?",
      [user_id],
    );
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Update last_login ──────────────────────────────
app.post("/api/system/update-login", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    await db.query(
      "UPDATE `profiles` SET `last_login` = NOW(), `last_activity` = NOW() WHERE `id` = ?",
      [user_id],
    );
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Delete user and all their activities (hard delete) ──
app.delete("/api/system/delete-user-complete", async (req, res) => {
  const { user_id, username } = req.query;
  if (!user_id || !username) {
    return res.status(400).json({ error: "user_id and username are required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Delete user permissions
    await conn.query("DELETE FROM `user_permissions` WHERE `user_id` = ?", [
      user_id,
    ]);

    // 2. Delete login histories
    await conn.query(
      "DELETE FROM `login_histories` WHERE `user_id` = ? OR `username` = ?",
      [user_id, username],
    );

    // 3. Delete activity logs
    await conn.query("DELETE FROM `activity_logs` WHERE `user_id` = ?", [
      user_id,
    ]);

    // 4. Delete audit logs
    await conn.query(
      "DELETE FROM `audit_logs` WHERE `user_id` = ? OR `username` = ?",
      [user_id, username],
    );

    // 5. Delete kegiatan mekanik
    await conn.query("DELETE FROM `kegiatan_mekanik` WHERE `user_id` = ?", [
      user_id,
    ]);

    // 6. Finally delete the user profile
    await conn.query("DELETE FROM `profiles` WHERE `id` = ?", [user_id]);

    await conn.commit();
    res.json({
      data: { message: "User and all activities deleted successfully" },
      error: null,
    });
  } catch (err) {
    await conn.rollback();
    console.error("Delete user error:", err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  } finally {
    conn.release();
  }
});

// ── System: Hash password (SHA-256 via MySQL / Node) ───────
const crypto = require("crypto");
app.post("/api/system/hash-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "password required" });
    const hash = crypto.createHash("sha256").update(password).digest("hex");
    res.json({ data: { hash }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Clear last_activity on logout (set user offline) ──
app.post("/api/system/clear-activity", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    await db.query(
      "UPDATE `profiles` SET `last_activity` = NULL WHERE `id` = ?",
      [user_id],
    );
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Update login_histories (set logout time) ───────
app.post("/api/system/logout-history", async (req, res) => {
  try {
    const { history_id, ip_address } = req.body;
    if (!history_id)
      return res.status(400).json({ error: "history_id required" });
    await db.query(
      "UPDATE `login_histories` SET `logout_at` = NOW() WHERE `id` = ?",
      [history_id],
    );
    res.json({ data: null, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── ALL_PAGES master list (harus sinkron dengan frontend) ──
const ALL_PAGES = [
  { key: "dashboard", name: "Dashboard" },
  { key: "dataAlatBerat", name: "Data Alat Berat" },
  { key: "dataAlatPendukung", name: "Data Alat Pendukung" },
  { key: "sewaAlatEksternal", name: "Sewa Alat" },
  { key: "rpa", name: "RPA" },
  { key: "riwayatPenggunaanAlat", name: "Riwayat Penggunaan Alat" },
  { key: "kegiatanMekanik", name: "Kegiatan Mekanik" },
  { key: "stockSparepart", name: "Stock Sparepart" },
  { key: "ppa", name: "PPA" },
  { key: "formPerbaikan", name: "Form Perbaikan" },
  { key: "stockBBM", name: "Stock BBM" },
  { key: "stockOli", name: "Stock Oli" },
  { key: "timeSheet", name: "Time Sheet" },
  { key: "system", name: "System" },
];

/**
 * Pastikan semua halaman sudah ada di tabel `permissions`.
 * Jika belum ada, insert otomatis (idempotent / safe to call multiple times).
 */
async function ensurePermissionsMasterData() {
  const { v4: uuidv4 } = require("uuid");
  for (const page of ALL_PAGES) {
    const [rows] = await db.query(
      "SELECT id FROM `permissions` WHERE `page_name` = ? LIMIT 1",
      [page.key],
    );
    if (rows.length === 0) {
      await db.query(
        "INSERT INTO `permissions` (id, page_name, page_route) VALUES (?, ?, ?)",
        [uuidv4(), page.key, `/${page.key}`],
      );
      console.log(`[permissions] Seeded: ${page.key}`);
    }
  }
}

/**
 * Ambil map { page_key -> permission_id } dari tabel permissions.
 */
async function getPermissionIdMap() {
  const [rows] = await db.query("SELECT id, page_name FROM `permissions`");
  const map = {};
  for (const row of rows) map[row.page_name] = row.id;
  return map;
}

// ── System: Bulk upsert user_permissions ───────────────────
app.post("/api/system/save-permissions", async (req, res) => {
  try {
    const { user_id, permissions } = req.body;
    if (!user_id || !permissions)
      return res
        .status(400)
        .json({ error: "user_id and permissions required" });

    // Pastikan master data halaman sudah ada di tabel permissions
    await ensurePermissionsMasterData();

    // Ambil mapping page_key -> permission_id
    const permIdMap = await getPermissionIdMap();

    // Hapus permission lama user ini
    await db.query("DELETE FROM `user_permissions` WHERE `user_id` = ?", [
      user_id,
    ]);

    if (permissions.length > 0) {
      const { v4: uuidv4 } = require("uuid");
      for (const perm of permissions) {
        const permissionId = permIdMap[perm.page_key];
        if (!permissionId) {
          console.warn(
            `[save-permissions] Tidak ditemukan permission_id untuk page_key: ${perm.page_key}`,
          );
          continue;
        }
        await db.query(
          `INSERT INTO \`user_permissions\`
             (id, user_id, permission_id, can_view, can_create, can_edit, can_delete,
              can_export_excel, can_export_pdf, can_import, can_approve, can_print)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            user_id,
            permissionId,
            perm.can_view ? 1 : 0,
            perm.can_create ? 1 : 0,
            perm.can_edit ? 1 : 0,
            perm.can_delete ? 1 : 0,
            perm.can_export_excel ? 1 : 0,
            perm.can_export_pdf ? 1 : 0,
            perm.can_import ? 1 : 0,
            perm.can_approve ? 1 : 0,
            perm.can_print ? 1 : 0,
          ],
        );
      }
    }

    res.json({ data: { success: true }, error: null });
  } catch (err) {
    console.error("save-permissions error:", err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Fetch user_permissions dengan page_key (JOIN) ───
app.get("/api/system/user-permissions/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) return res.status(400).json({ error: "user_id required" });

    const [rows] = await db.query(
      `SELECT
         up.id, up.user_id, p.page_name AS page_key,
         up.can_view, up.can_create, up.can_edit, up.can_delete,
         up.can_export_excel, up.can_export_pdf, up.can_import,
         up.can_approve, up.can_print
       FROM \`user_permissions\` up
       JOIN \`permissions\` p ON p.id = up.permission_id
       WHERE up.user_id = ?`,
      [user_id],
    );

    res.json({ data: rows, error: null });
  } catch (err) {
    console.error("user-permissions fetch error:", err.message);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Cleanup audit_logs yang lebih lama dari N hari ─
app.post("/api/system/cleanup-audit-logs", async (req, res) => {
  try {
    const { older_than_days = 90 } = req.body;
    const days = Math.max(1, parseInt(older_than_days) || 90);
    const [result] = await db.query(
      "DELETE FROM `audit_logs` WHERE `created_at` < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [days],
    );
    res.json({ data: { deleted: result.affectedRows }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// ── System: Cleanup login_histories yang lebih lama dari N hari ─
app.post("/api/system/cleanup-login-histories", async (req, res) => {
  try {
    const { older_than_days = 90 } = req.body;
    const days = Math.max(1, parseInt(older_than_days) || 90);
    const [result] = await db.query(
      "DELETE FROM `login_histories` WHERE `login_at` < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [days],
    );
    res.json({ data: { deleted: result.affectedRows }, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API berjalan di http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
