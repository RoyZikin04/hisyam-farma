/**
 * Utilitas pemformatan uang dan tanggal standar Indonesia
 */

/**
 * Memformat angka integer rupiah menjadi format "Rp 1.250.000"
 */
export function formatRupiah(nominal: number | null | undefined): string {
  if (nominal === null || nominal === undefined || isNaN(nominal)) {
    return "Rp 0";
  }
  const bulat = Math.round(nominal);
  const formatted = bulat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}

/**
 * Membersihkan string format rupiah ke integer murni
 */
export function unformatRupiah(str: string): number {
  const clean = str.replace(/[^0-9]/g, "");
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Format tanggal Indonesia lengkap dengan waktu (contoh: 05 Okt 2026, 14:30)
 */
export function formatTanggalWaktu(dateInput: Date | string): string {
  const d = new Date(dateInput);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format tanggal Indonesia singkat (contoh: 05/10/2026)
 */
export function formatTanggalSingkat(dateInput: Date | string): string {
  const d = new Date(dateInput);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
