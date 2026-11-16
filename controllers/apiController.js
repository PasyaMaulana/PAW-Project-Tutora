const Topic = require('../models/topicModel');
const config = require('../config');
const sequelize = require('../config/database');
const { parseLevels, DEFAULT_LEVELS } = require('../utils/format');

/**
 * GET /api/status
 * Memeriksa status kesehatan server dan koneksi database
 */
exports.status = async (req, res) => {
  let dbStatus = 'connected';
  try {
    await sequelize.authenticate();
  } catch (err) {
    dbStatus = 'disconnected';
  }

  res.json({
    status: 'ok',
    app: config.appName,
    version: config.appVersion,
    serverTime: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    database: {
      dialect: 'postgresql',
      status: dbStatus,
    },
  });
};

/**
 * GET /api/topics
 * Mengambil seluruh data topik pembelajaran dari database
 */
exports.getAll = async (req, res) => {
  try {
    const data = await Topic.getAll();
    res.json({
      success: true,
      total: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data dari database',
      error: err.message,
    });
  }
};

/**
 * GET /api/topics/:id
 * Mengambil detail satu data berdasarkan ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await Topic.getById(id);

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: `Topik dengan ID ${id} tidak ditemukan`,
      });
    }

    res.json({
      success: true,
      data: topic,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail data dari database',
      error: err.message,
    });
  }
};

/**
 * POST /api/topics
 * Menambahkan data baru ke dalam database
 */
exports.create = async (req, res) => {
  try {
    const nama = req.body.nama || req.body.title || req.body.name;
    const kategori = req.body.kategori || req.body.category || 'Umum';
    const deskripsi = req.body.deskripsi || req.body.description;
    const icon = req.body.icon || 'lucide:book-open';
    const levels = parseLevels(req.body.levels) || DEFAULT_LEVELS;

    if (!nama || !deskripsi) {
      return res.status(400).json({
        success: false,
        message: 'Nama topik dan deskripsi wajib diisi',
      });
    }

    const newTopic = await Topic.createTopic({
      nama,
      kategori,
      deskripsi,
      icon,
      levels,
    });

    res.status(201).json({
      success: true,
      message: 'Data topik berhasil ditambahkan ke database',
      data: newTopic,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data ke database',
      error: err.message,
    });
  }
};

/**
 * PUT /api/topics/:id
 * Memperbarui data berdasarkan ID
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {
      nama: req.body.nama || req.body.title || req.body.name,
      kategori: req.body.kategori || req.body.category,
      deskripsi: req.body.deskripsi || req.body.description,
      icon: req.body.icon,
      levels: parseLevels(req.body.levels),
    };

    // Field wajib tidak boleh dikosongkan saat update
    if (
      (typeof req.body.nama === 'string' && !req.body.nama.trim()) ||
      (typeof req.body.deskripsi === 'string' && !req.body.deskripsi.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nama topik dan deskripsi tidak boleh kosong',
      });
    }

    const updated = await Topic.updateTopic(id, payload);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Topik dengan ID ${id} tidak ditemukan`,
      });
    }

    res.json({
      success: true,
      message: 'Data topik berhasil diperbarui di database',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data di database',
      error: err.message,
    });
  }
};

/**
 * DELETE /api/topics/:id
 * Menghapus data berdasarkan ID dari database
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Topic.deleteTopic(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Topik dengan ID ${id} tidak ditemukan`,
      });
    }

    res.json({
      success: true,
      message: `Topik dengan ID ${id} berhasil dihapus dari database`,
      data: deleted,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data dari database',
      error: err.message,
    });
  }
};
