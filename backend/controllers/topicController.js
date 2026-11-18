const Topic = require('../models/topicModel');
const config = require('../config');
const { DEFAULT_LEVELS } = require('../utils/format');
const { validateTopic } = require('../utils/topicValidator');

const ADMIN_LIST = '/admin/topics';
const redirectWith = (res, type, message) => res.redirect(`${ADMIN_LIST}?${type}=${encodeURIComponent(message)}`);

/**
 * GET /
 * Beranda publik: katalog topik (hanya lihat). Pengelolaan topik ada di area Admin.
 */
exports.index = async (req, res) => {
  let topics = [];
  let dbError = null;

  try {
    topics = await Topic.getAll();
  } catch (err) {
    console.error('Gagal memuat katalog topik:', err.message);
    dbError = 'Silakan muat ulang halaman beberapa saat lagi.';
  }

  res.render('index', {
    judul: `${config.appName} - Pembelajaran Adaptif Berbasis AI untuk Mahasiswa`,
    namaApp: config.appName,
    versiApp: config.appVersion,
    topics,
    dbError,
    success: req.query.success || null,
    error: req.query.error || null,
  });
};

// ============================================================================
// Area Admin: Kelola Katalog Topik (F-11, US-10) - semua rute dilindungi requireAdmin
// ============================================================================

/** Pilihan kategori untuk dropdown form; jika database bermasalah, form tetap tampil tanpa daftar. */
async function loadCategories() {
  try {
    return await Topic.getCategories();
  } catch (err) {
    console.error('Gagal memuat daftar kategori:', err.message);
    return [];
  }
}

async function renderCreate(res, { error = null, old = {} } = {}) {
  res.render('topics/create', {
    judul: `Tambah Topik Baru - ${config.appName}`,
    namaApp: config.appName,
    activePage: 'admin',
    levels: DEFAULT_LEVELS,
    categories: await loadCategories(),
    error,
    old,
  });
}

async function renderEdit(res, topic, error = null) {
  res.render('topics/edit', {
    judul: `Edit Topik - ${config.appName}`,
    namaApp: config.appName,
    activePage: 'admin',
    levels: DEFAULT_LEVELS,
    categories: await loadCategories(),
    topic,
    error,
  });
}

/**
 * GET /admin/topics/create
 */
exports.createForm = (req, res) => renderCreate(res);

/**
 * POST /admin/topics
 */
exports.store = async (req, res) => {
  try {
    const { errors, data } = validateTopic(req.body);
    if (!errors.length && (await Topic.isNameTaken(data.nama))) {
      errors.push(`Topik dengan nama "${data.nama}" sudah ada di katalog`);
    }
    if (errors.length) return renderCreate(res, { error: errors.join('. '), old: req.body });

    await Topic.createTopic(data);
    return redirectWith(res, 'success', `Topik "${data.nama}" berhasil ditambahkan ke katalog`);
  } catch (err) {
    console.error('Gagal menyimpan topik:', err.message);
    return renderCreate(res, { error: 'Topik gagal disimpan. Silakan coba lagi.', old: req.body });
  }
};

/**
 * GET /admin/topics/:id/edit
 */
exports.editForm = async (req, res) => {
  try {
    const topic = await Topic.getById(req.params.id);
    if (!topic) return redirectWith(res, 'error', 'Topik tidak ditemukan');
    return renderEdit(res, topic);
  } catch (err) {
    console.error('Gagal memuat form edit:', err.message);
    return redirectWith(res, 'error', 'Halaman edit topik gagal dimuat. Silakan coba lagi.');
  }
};

/**
 * POST /admin/topics/:id/update
 */
exports.update = async (req, res) => {
  try {
    const topic = await Topic.getById(req.params.id);
    if (!topic) return redirectWith(res, 'error', 'Topik tidak ditemukan');

    const { errors, data } = validateTopic(req.body);
    if (!errors.length && (await Topic.isNameTaken(data.nama, topic.id))) {
      errors.push(`Topik dengan nama "${data.nama}" sudah ada di katalog`);
    }
    if (errors.length) {
      // Tampilkan kembali isian terakhir agar admin tidak perlu mengetik ulang
      const levels = Array.isArray(req.body.levels) ? req.body.levels : req.body.levels ? [req.body.levels] : [];
      return renderEdit(res, { ...topic.toJSON(), ...req.body, levels, id: topic.id }, errors.join('. '));
    }

    await Topic.updateTopic(topic.id, data);
    return redirectWith(res, 'success', `Topik "${data.nama}" berhasil diperbarui`);
  } catch (err) {
    console.error('Gagal memperbarui topik:', err.message);
    return redirectWith(res, 'error', 'Topik gagal diperbarui. Silakan coba lagi.');
  }
};

/**
 * POST /admin/topics/:id/delete
 */
exports.delete = async (req, res) => {
  try {
    const deleted = await Topic.deleteTopic(req.params.id);
    if (!deleted) return redirectWith(res, 'error', 'Topik tidak ditemukan');
    return redirectWith(res, 'success', `Topik "${deleted.nama}" berhasil dihapus dari katalog`);
  } catch (err) {
    console.error('Gagal menghapus topik:', err.message);
    return redirectWith(res, 'error', 'Topik gagal dihapus. Silakan coba lagi.');
  }
};
