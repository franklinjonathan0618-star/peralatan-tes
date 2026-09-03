require("dotenv").config();

const { Resend } = require("resend");

const requiredVars = ["RESEND_API_KEY", "RESEND_FROM_EMAIL"];
const missingVars = requiredVars.filter((key) => !process.env[key]);
const isConfigured = missingVars.length === 0;

if (!isConfigured) {
  console.warn(
    `[EmailService] Resend belum dikonfigurasi (${missingVars.join(", ")}). Notifikasi email dinonaktifkan.`,
  );
}

const resend = isConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Mengirim email notifikasi persetujuan baru ke daftar penerima
 * @param {string} type - Tipe permohonan ('PPA' | 'RPA')
 * @param {object} data - Detail data permohonan
 * @param {string[]} recipients - Daftar email penerima
 */
async function sendApprovalNotification(type, data, recipients) {
  if (!resend) {
    console.warn(
      "[EmailService] Email tidak dikirim — Resend belum dikonfigurasi.",
    );
    return { success: false, error: "Resend not configured" };
  }

  if (!recipients || recipients.length === 0) {
    console.warn("[EmailService] Tidak ada penerima email yang valid.");
    return { success: false, error: "No recipients" };
  }

  const cleanData = {};
  for (const [key, val] of Object.entries(data)) {
    cleanData[key] = val || "-";
  }

  const isPPA = type === "PPA";
  const title = isPPA
    ? "Permohonan Perbaikan Alat (PPA) Baru"
    : "Rencana Penggunaan Alat (RPA) Baru";
  const subject = `[Permohonan Baru] ${type} - ${cleanData.nama_alat || cleanData.item_pekerjaan} (${isPPA ? cleanData.no_ppa : cleanData.rpa_id})`;

  let detailRowsHTML = "";
  if (isPPA) {
    detailRowsHTML = `
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 150px;">No. PPA</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.no_ppa}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Tanggal</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.tanggal}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Nama Alat</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.nama_alat}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">No. Lambung</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.no_lambung}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Kerusakan</td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #d9534f; font-weight: 500;">${cleanData.kerusakan}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Keterangan</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.keterangan}</td></tr>
    `;
  } else {
    detailRowsHTML = `
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee; width: 150px;">No. RPA</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.rpa_id}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Tanggal</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.tanggal}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Item Pekerjaan</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.item_pekerjaan}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Lokasi Proyek</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${cleanData.lokasi_proyek}</td></tr>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e8ed;">
          <div style="background-color: #1e3a8a; padding: 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 12px; letter-spacing: 2px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; opacity: 0.8;">Cabang Papua</div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${title}</h2>
          </div>

          <div style="padding: 24px;">
            <p style="margin-top: 0; line-height: 1.6; font-size: 15px;">Halo,</p>
            <p style="line-height: 1.6; font-size: 15px;">Telah diajukan permohonan baru yang memerlukan persetujuan (approval) Anda. Berikut adalah rincian data permohonan:</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; text-align: left; background-color: #fafbfc; border-radius: 6px; overflow: hidden; border: 1px solid #eaedf0;">
              <tbody>
                ${detailRowsHTML}
              </tbody>
            </table>

            <div style="text-align: center; margin: 30px 0 20px 0;">
              <a href="https://peralatan.intanciptaperdana.id" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 6px; display: inline-block; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                Buka Sistem Peralatan
              </a>
            </div>

            <p style="font-size: 12px; color: #7f8c8d; line-height: 1.6; border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px;">
              Email ini dikirim secara otomatis oleh Divisi Peralatan Cabang Papua. Mohon tidak membalas email ini secara langsung.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: `Sistem Peralatan <${process.env.RESEND_FROM_EMAIL}>`,
      to: recipients,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error(
        `[EmailService] Gagal mengirim email notifikasi ${type}:`,
        error,
      );
      return { success: false, error: error.message || String(error) };
    }

    console.log(
      `[EmailService] Email notifikasi ${type} berhasil dikirim ke: ${recipients.join(", ")} | MessageId: ${result?.id}`,
    );
    return { success: true, messageId: result?.id };
  } catch (error) {
    console.error(
      `[EmailService] Gagal mengirim email notifikasi ${type}:`,
      error,
    );
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendApprovalNotification,
};
