const Topic = require('../models/topicModel');
const config = require('../config');
const sequelize = require('../config/database');
const { validateTopic } = require('../utils/topicValidator');

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
    });
  }
};

/**
 * POST /api/topics  (khusus admin: header X-Admin-Key)
 * Menambahkan topik baru ke katalog
 */
exports.create = async (req, res) => {
  try {
    const { errors, data } = validateTopic(req.body || {});
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. '), errors });
    }
    if (await Topic.isNameTaken(data.nama)) {
      return res.status(409).json({ success: false, message: `Topik dengan nama "${data.nama}" sudah ada` });
    }

    const newTopic = await Topic.createTopic(data);
    res.status(201).json({
      success: true,
      message: 'Data topik berhasil ditambahkan ke database',
      data: newTopic,
    });
  } catch (err) {
    console.error('API create topic error:', err.message);
    res.status(500).json({ success: false, message: 'Gagal menambahkan data ke database' });
  }
};

/**
 * PUT /api/topics/:id  (khusus admin: header X-Admin-Key)
 * Memperbarui sebagian atau seluruh data topik berdasarkan ID
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { errors, data } = validateTopic(req.body || {}, { partial: true });
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. '), errors });
    }

    const topic = await Topic.getById(id);
    if (!topic) {
      return res.status(404).json({ success: false, message: `Topik dengan ID ${id} tidak ditemukan` });
    }
    if (data.nama && (await Topic.isNameTaken(data.nama, topic.id))) {
      return res.status(409).json({ success: false, message: `Topik dengan nama "${data.nama}" sudah ada` });
    }

    const updated = await Topic.updateTopic(topic.id, data);
    res.json({
      success: true,
      message: 'Data topik berhasil diperbarui di database',
      data: updated,
    });
  } catch (err) {
    console.error('API update topic error:', err.message);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data di database' });
  }
};

/**
 * DELETE /api/topics/:id  (khusus admin: header X-Admin-Key)
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
    });
  }
};
