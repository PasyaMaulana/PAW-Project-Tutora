/**
 * Kumpulan fungsi bantuan (helper) yang dipakai ulang di controller & view.
 */

const DEFAULT_LEVELS = ['Pemula', 'Menengah', 'Lanjut'];

/**
 * Memformat tanggal ke format lokal Indonesia (WIB)
 * @param {Date|string} date
 * @returns {string} Contoh: "10 Nov 2026, 22.50"
 */
function formatTanggal(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Menormalkan input tingkat pemahaman menjadi array.
 * Menerima array (dari checkbox form / JSON body) atau string "Pemula, Menengah".
 * @param {string|string[]|undefined} levels
 * @returns {string[]|undefined} undefined jika input kosong
 */
function parseLevels(levels) {
  if (Array.isArray(levels)) return levels.map((l) => String(l).trim()).filter(Boolean);
  if (typeof levels === 'string') return levels.split(',').map((l) => l.trim()).filter(Boolean);
  return undefined;
}

/**
 * Memvalidasi ID agar berupa bilangan bulat positif.
 * Mencegah error database ketika ID tidak valid (misal: /api/topics/abc).
 * @param {string|number} id
 * @returns {number|null}
 */
function parseId(id) {
  const angka = Number(id);
  return Number.isInteger(angka) && angka > 0 ? angka : null;
}

module.exports = {
  DEFAULT_LEVELS,
  formatTanggal,
  parseLevels,
  parseId,
};
