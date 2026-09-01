const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "peralatanmwt",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  dateStrings: true,   // ← Kembalikan DATE/DATETIME sebagai string "YYYY-MM-DD"
  timezone: '+07:00',  // ← WIB (UTC+7) — sesuai timezone MySQL server lokal
});

// Test koneksi saat startup
pool
  .getConnection()
  .then((conn) => {
    console.log(
      "✅ MySQL connected to database: peralatanmwt (localhost)",
    );
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL connection failed:", err.message);
  });

module.exports = pool;
