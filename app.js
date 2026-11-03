const express = require('express');
const path = require('path');
const config = require('./config');
const logger = require('./middlewares/logger');
const routes = require('./routes');
const sequelize = require('./config/database');

const app = express();

// Konfigurasi View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Konfigurasi Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // File statis (logo, gambar, asset)
app.use(logger); // Middleware Logger Request (Poin 3 Tugas)

// Routing Aplikasi
app.use('/', routes);

// Penanganan 404 (Route tidak ditemukan)
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found',
    });
  }
  res.status(404).send('404 Not Found - Halaman tidak ditemukan');
});

// Penanganan Global Error
app.use((err, req, res, next) => {
  console.error('Internal server error:', err);
  if (req.originalUrl.startsWith('/api')) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
  res.status(500).send('500 - Terjadi kesalahan internal pada server');
});

// Jalankan server Express
const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 ${config.appName} berjalan di port ${config.port}`);
  console.log(`🌐 Frontend     : http://localhost:${config.port}`);
  console.log(`📡 API Status   : http://localhost:${config.port}/api/status`);
  console.log(`📦 API Produk   : http://localhost:${config.port}/api/produk`);
  console.log(`====================================================`);
});

// Cek status koneksi PostgreSQL di latar belakang
sequelize.authenticate()
  .then(() => {
    console.log('✅ Koneksi ke database PostgreSQL berhasil.');
  })
  .catch((error) => {
    console.warn('⚠️  Peringatan: Belum dapat terhubung ke database PostgreSQL.');
    console.warn('   Pastikan server PostgreSQL aktif dan cek konfigurasi di file .env.');
    console.warn('   (Aplikasi tetap dapat berjalan untuk pengujian status/routing).');
  });

module.exports = app;
