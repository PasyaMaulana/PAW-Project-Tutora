const Produk = require('../models/produkModel');
const config = require('../config');
const { formatRupiah, formatTanggal } = require('../utils/format');

/**
 * Controller untuk halaman frontend utama (GET /)
 * Mengambil data modul/produk dari database dan merender view EJS
 */
exports.index = async (req, res) => {
  let produkList = [];
  let dbError = null;

  try {
    produkList = await Produk.getAll();
  } catch (err) {
    dbError = 'Database PostgreSQL belum terhubung atau belum di-seed. Jalankan `npm run seed`.';
  }

  res.render('index', {
    judul: `${config.appName} - Belajar Adaptif Berbasis AI untuk Mahasiswa`,
    namaApp: config.appName,
    versiApp: config.appVersion,
    produk: produkList,
    formatRupiah,
    formatTanggal,
    dbError,
  });
};

