/**
 * Fungsi pembantu untuk memformat angka menjadi format mata uang Rupiah
 * @param {number} nominal
 * @returns {string} Contoh: "Rp 45.000"
 */
function formatRupiah(nominal) {
  if (nominal === 0 || nominal === null || nominal === undefined) {
    return 'Gratis';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal);
}

/**
 * Fungsi pembantu untuk memformat tanggal ke format lokal Indonesia
 * @param {Date|string} date
 * @returns {string} Contoh: "3 November 2026, 23.50 WIB"
 */
function formatTanggal(date) {
  return new Date(date).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

module.exports = {
  formatRupiah,
  formatTanggal,
};

