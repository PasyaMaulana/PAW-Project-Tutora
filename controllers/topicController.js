const Topic = require('../models/topicModel');
const config = require('../config');
const { parseLevels, DEFAULT_LEVELS } = require('../utils/format');

/**
 * GET / (atau /topics)
 * Menampilkan halaman utama yang memuat data seluruh topik dari database
 */
exports.index = async (req, res) => {
  let topics = [];
  let dbError = null;

  try {
    topics = await Topic.getAll();
  } catch (err) {
    dbError = 'Gagal terhubung ke database PostgreSQL. Pastikan database aktif dan jalankan npm run seed.';
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

/**
 * GET /topics/create
 * Menampilkan form untuk menambahkan topik baru
 */
exports.createForm = (req, res) => {
  res.render('topics/create', {
    judul: `Tambah Topik Baru - ${config.appName}`,
    namaApp: config.appName,
    error: null,
    old: {},
  });
};

/**
 * POST /topics
 * Memproses penyimpanan data topik baru dari form frontend ke database
 */
exports.store = async (req, res) => {
  try {
    const { nama, kategori, deskripsi, icon, levels } = req.body;

    if (!nama || !deskripsi) {
      return res.render('topics/create', {
        judul: `Tambah Topik Baru - ${config.appName}`,
        namaApp: config.appName,
        error: 'Nama topik dan deskripsi wajib diisi',
        old: req.body,
      });
    }

    // Olah levels (array dari checkbox atau string comma-separated) via helper utils
    const levelsArray = parseLevels(levels) || DEFAULT_LEVELS;

    await Topic.createTopic({
      nama,
      kategori: kategori || 'Umum',
      deskripsi,
      icon: icon || 'lucide:book-open',
      levels: levelsArray,
    });

    return res.redirect('/?success=' + encodeURIComponent(`Topik "${nama}" berhasil ditambahkan ke database`));
  } catch (err) {
    return res.render('topics/create', {
      judul: `Tambah Topik Baru - ${config.appName}`,
      namaApp: config.appName,
      error: 'Terjadi kesalahan: ' + err.message,
      old: req.body,
    });
  }
};

/**
 * GET /topics/:id/edit
 * Menampilkan form edit untuk topik yang dipilih
 */
exports.editForm = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await Topic.getById(id);

    if (!topic) {
      return res.redirect('/?error=' + encodeURIComponent(`Topik dengan ID ${id} tidak ditemukan`));
    }

    res.render('topics/edit', {
      judul: `Edit Topik - ${topic.nama}`,
      namaApp: config.appName,
      topic,
      error: null,
    });
  } catch (err) {
    return res.redirect('/?error=' + encodeURIComponent('Gagal memuat form edit: ' + err.message));
  }
};

/**
 * POST /topics/:id/update
 * Memproses pembaruan data topik dari form edit frontend ke database
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kategori, deskripsi, icon, levels } = req.body;

    if (!nama || !deskripsi) {
      const topic = await Topic.getById(id);
      return res.render('topics/edit', {
        judul: `Edit Topik`,
        namaApp: config.appName,
        topic: { ...topic?.toJSON(), ...req.body, id },
        error: 'Nama topik dan deskripsi wajib diisi',
      });
    }

    const levelsArray = parseLevels(levels);

    const updated = await Topic.updateTopic(id, {
      nama,
      kategori,
      deskripsi,
      icon,
      levels: levelsArray,
    });

    if (!updated) {
      return res.redirect('/?error=' + encodeURIComponent(`Topik dengan ID ${id} tidak ditemukan`));
    }

    return res.redirect('/?success=' + encodeURIComponent(`Topik "${nama}" berhasil diperbarui di database`));
  } catch (err) {
    return res.redirect('/?error=' + encodeURIComponent('Gagal memperbarui topik: ' + err.message));
  }
};

/**
 * POST /topics/:id/delete
 * Menghapus topik dari database via antarmuka frontend
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Topic.deleteTopic(id);

    if (!deleted) {
      return res.redirect('/?error=' + encodeURIComponent(`Topik dengan ID ${id} tidak ditemukan`));
    }

    return res.redirect('/?success=' + encodeURIComponent(`Topik "${deleted.nama}" berhasil dihapus dari database`));
  } catch (err) {
    return res.redirect('/?error=' + encodeURIComponent('Gagal menghapus topik: ' + err.message));
  }
};

