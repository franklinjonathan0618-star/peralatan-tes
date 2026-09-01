/**
 * Utility untuk menangani konversi DATE dari MySQL
 * MySQL DATE type tidak memiliki timezone info, jadi harus di-parse sebagai local date
 */

/**
 * Konversi string date dari MySQL (format YYYY-MM-DD) ke objek Date dengan benar
 * PENTING: MySQL DATE tidak memiliki timezone, harus diperlakukan sebagai local date
 * @param dateString - String dari MySQL (format YYYY-MM-DD)
 * @returns Date object yang sudah di-adjust untuk timezone lokal
 */
export function parseMySQLDate(
  dateString: string | null | undefined,
): Date | null {
  if (!dateString) return null;

  const cleanStr = dateString.trim();

  // 1. Format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [year, month, day] = cleanStr.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // 2. Format: dd/MM/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
    const [day, month, year] = cleanStr.split("/").map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // 3. Format: dd-MM-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(cleanStr)) {
    const [day, month, year] = cleanStr.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // 4. ISO Datetime string (mis. 2026-06-14T17:00:00.000Z dari database UTC)
  // PENTING: jangan pakai substring(0,10) karena itu ambil tanggal UTC, bukan lokal!
  // Gunakan local time getters agar tanggal sesuai timezone pengguna (WIB +7).
  if (/^\d{4}-\d{2}-\d{2}T/.test(cleanStr)) {
    const d = new Date(cleanStr);
    if (!Number.isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
  }

  // Fallback
  const parsed = new Date(cleanStr);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

/**
 * Format tanggal untuk display di UI (format: DD MMM YYYY, misal "07 Apr 2026")
 * @param date - Date object atau string dari database
 * @returns Formatted string
 */
export function formatDateDisplay(
  date: Date | string | null | undefined,
): string {
  if (!date) return "-";

  let dateObj: Date | null = null;
  if (typeof date === "string") {
    dateObj = parseMySQLDate(date);

    // Fallback untuk datetime string non DATE-only
    if (!dateObj) {
      const parsed = new Date(date);
      dateObj = Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  } else {
    dateObj = Number.isNaN(date.getTime()) ? null : date;
  }

  if (!dateObj) return "-";

  return dateObj.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format tanggal untuk input HTML (format: YYYY-MM-DD)
 * @param date - Date object atau string dari database
 * @returns Format YYYY-MM-DD untuk input[type="date"]
 */
export function formatDateForInput(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";
  return normalizeDateOnly(date);
}

/**
 * Konversi Date object ke format yang aman dikirim ke MySQL (YYYY-MM-DD)
 * @param date - Date object
 * @returns String format YYYY-MM-DD
 */
export function formatDateForMySQL(date: Date | null | undefined): string {
  if (!date) return "";
  if (Number.isNaN(date.getTime())) return "";

  // Selalu gunakan local time agar hasil selalu YYYY-MM-DD sesuai timezone pengguna
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Ambil tanggal hari ini dalam timezone lokal dengan format YYYY-MM-DD
 * Hindari toISOString().split('T')[0] karena berbasis UTC dan bisa geser tanggal.
 */
export function getTodayLocalDateString(): string {
  return formatDateForMySQL(new Date());
}

/**
 * Normalisasi nilai tanggal apa pun menjadi format YYYY-MM-DD untuk kolom DATE.
 * Mendukung input berupa YYYY-MM-DD, ISO datetime, atau Date object.
 */
export function normalizeDateOnly(
  date: Date | string | null | undefined,
): string {
  if (!date) return "";

  if (typeof date === "string") {
    const cleanStr = date.trim();
    if (!cleanStr) return "";

    // 1. Format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      return cleanStr;
    }

    // 2. Format: dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanStr)) {
      const [d, m, y] = cleanStr.split("/");
      return `${y}-${m}-${d}`;
    }

    // 3. Format: dd-MM-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleanStr)) {
      const [d, m, y] = cleanStr.split("-");
      return `${y}-${m}-${d}`;
    }

    // 4. ISO Datetime string (mis. 2026-06-14T17:00:00.000Z dari database UTC)
    // PENTING: gunakan local time getters, bukan substring(0,10) yang mengambil tanggal UTC
    if (/^\d{4}-\d{2}-\d{2}T/.test(cleanStr)) {
      const d = new Date(cleanStr);
      if (!Number.isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      return "";
    }

    // 5. Fallback ke generic Date parsing
    const parsed = new Date(cleanStr);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDateForMySQL(parsed);
    }

    return "";
  }

  return formatDateForMySQL(date);
}

/**
 * Sesuaikan Date object dari parsing YYYY-MM-DD string agar setara dengan timezone lokal
 * Gunakan untuk comparison dengan date-fns functions (startOfMonth, endOfMonth, dll)
 * @param dateString - String format YYYY-MM-DD dari database
 * @param hours - Jam tambahan (default 0)
 * @returns Date object dalam timezone lokal
 */
export function adjustMySQLDateForComparison(
  dateString: string | null | undefined,
  hours: number = 0,
): Date {
  if (!dateString) return new Date();

  const date = parseMySQLDate(dateString);
  if (!date) return new Date();

  // Set hours untuk precision comparison jika diperlukan
  if (hours !== 0) {
    date.setHours(date.getHours() + hours);
  }

  return date;
}
