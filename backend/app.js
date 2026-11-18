const express = require('express');
const path = require('path');
const config = require('./config');
const logger = require('./middlewares/logger');
const routes = require('./routes');
const sequelize = require('./config/database');
const { formatTanggal } = require('./utils/format');
const { loadAdmin } = require('./middlewares/adminAuth');

const app = express();

// Konfigurasi View Engine (EJS)
app.set('view engine', 'ejs');
// Frontend (EJS views & asset statis) berada di folder ../frontend
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.set('views', path.join(FRONTEND_DIR, 'views'));

// Helper yang bisa dipanggil langsung dari template EJS
app.locals.formatTanggal = formatTanggal;

// Konfigurasi Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(FRONTEND_DIR, 'public'))); // File statis (logo, JS, gambar)
app.use(logger); // Middleware Logger Request (Poin 3 Tugas)

// Penanda status admin (dari cookie sesi) & menu aktif pada navbar
app.use(loadAdmin);
app.use((req, res, next) => {
  res.locals.activePage = req.path === '/' ? 'home' : req.path.startsWith('/admin') ? 'admin' : '';
  next();
});

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
  // Body JSON tidak valid (misalnya dari Postman) dianggap kesalahan input, bukan error server
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Format JSON pada request body tidak valid',
    });
  }

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
  console.log(`📚 API Topics   : http://localhost:${config.port}/api/topics`);
  console.log(`🤖 API Chat     : POST http://localhost:${config.port}/api/chat`);
  console.log(`📊 API Metrics  : http://localhost:${config.port}/api/chat/metrics`);
  console.log(`💬 AI Tutor     : http://localhost:${config.port}/assistant`);
  console.log(`🕘 Riwayat      : http://localhost:${config.port}/riwayat`);
  console.log(`🔐 Admin        : http://localhost:${config.port}/admin`);
  console.log(`====================================================`);
});

// Cek status koneksi PostgreSQL dan sinkronisasi tabel
sequelize.authenticate()
  .then(async () => {
    console.log('✅ Koneksi ke database PostgreSQL berhasil.');
    try {
      await sequelize.sync({ alter: true });
      console.log('✅ Sinkronisasi tabel model ke database PostgreSQL selesai.');
    } catch (syncErr) {
      console.warn('⚠️  Peringatan saat sinkronisasi model:', syncErr.message);
    }
  })
  .catch((error) => {
    console.warn('⚠️  Peringatan: Belum dapat terhubung ke database PostgreSQL.');
    console.warn('   Pastikan server PostgreSQL aktif dan cek konfigurasi di file .env.');
    console.warn('   (Aplikasi tetap dapat berjalan untuk pengujian status/routing).');
  });

module.exports = app;
