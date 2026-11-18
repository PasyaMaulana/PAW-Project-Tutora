const Topic = require('../models/topicModel');
const config = require('../config');
const adminConfig = require('../config/admin');
const { isValidPassword, startSession, endSession } = require('../middlewares/adminAuth');

/** Hanya izinkan redirect ke halaman admin internal (mencegah open redirect). */
function safeNext(next) {
  return typeof next === 'string' && /^\/admin(\/|$)/.test(next) && !next.startsWith('//') ? next : '/admin/topics';
}

function renderLogin(res, { error = null, next = '/admin/topics', status = 200 } = {}) {
  res.status(status).render('admin/login', {
    judul: `Masuk Admin - ${config.appName}`,
    namaApp: config.appName,
    activePage: 'admin',
    error,
    next,
    configured: adminConfig.isConfigured,
  });
}

/**
 * GET /admin/login
 */
exports.loginPage = (req, res) => {
  if (res.locals.isAdmin) return res.redirect(safeNext(req.query.next));
  renderLogin(res, { next: safeNext(req.query.next) });
};

/**
 * POST /admin/login
 * Satu kata sandi admin dari .env, tanpa username & tanpa akun (PRD Non-goal 3).
 */
exports.login = (req, res) => {
  const next = safeNext(req.body.next);
  if (!adminConfig.isConfigured) {
    return renderLogin(res, { error: 'Area admin belum dikonfigurasi.', next, status: 503 });
  }
  if (!isValidPassword(req.body.password)) {
    return renderLogin(res, { error: 'Kata sandi admin salah.', next, status: 401 });
  }
  startSession(req, res);
  return res.redirect(next);
};

/**
 * Dipanggil rate limiter saat percobaan login melebihi batas.
 */
exports.loginLimited = (req, res, retryAfter) => {
  renderLogin(res, {
    error: `Terlalu banyak percobaan login. Silakan coba lagi dalam ${retryAfter} detik.`,
    next: safeNext(req.body && req.body.next),
    status: 429,
  });
};

/**
 * POST /admin/logout
 */
exports.logout = (req, res) => {
  endSession(req, res);
  res.redirect('/?success=' + encodeURIComponent('Kamu sudah keluar dari area admin'));
};

/**
 * GET /admin/topics
 * Daftar katalog topik beserta aksi tambah, edit, dan hapus.
 */
exports.topicsPage = async (req, res) => {
  let topics = [];
  let dbError = null;
  try {
    topics = await Topic.getAll();
  } catch (err) {
    console.error('Gagal memuat katalog topik (admin):', err.message);
    dbError = 'Katalog gagal dimuat. Periksa koneksi database lalu muat ulang halaman.';
  }

  res.render('admin/topics', {
    judul: `Kelola Topik - ${config.appName}`,
    namaApp: config.appName,
    activePage: 'admin',
    topics,
    dbError,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};
