require('./index'); // Memastikan variabel .env sudah dimuat
const crypto = require('crypto');

/**
 * Konfigurasi area Admin (F-11 Kelola Katalog Topik).
 * Sesuai PRD: tidak ada sistem akun; admin cukup memakai SATU kata sandi bersama
 * yang disimpan di .env dan tidak pernah dikirim ke frontend.
 */
const password = process.env.ADMIN_PASSWORD || '';

// Kunci penandatangan cookie sesi. Jika belum diset, dibuat acak setiap server menyala
// (aman, tetapi admin perlu login ulang setelah server restart).
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

if (!password) {
  console.warn('⚠️  ADMIN_PASSWORD belum diset di file .env, halaman Kelola Topik tidak dapat diakses.');
}
if (!process.env.SESSION_SECRET) {
  console.warn('⚠️  SESSION_SECRET belum diset di file .env, sesi admin akan hilang setiap server restart.');
}

module.exports = {
  isConfigured: password.length > 0,
  password,
  sessionSecret,
  cookieName: 'tutora_admin',
  sessionMaxAgeMs: 2 * 60 * 60 * 1000, // 2 jam
  loginRateLimit: { windowMs: 60 * 1000, max: 5, message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 1 menit.' },
};
