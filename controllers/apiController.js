const Produk = require('../models/produkModel');
const config = require('../config');
const sequelize = require('../config/database');

/**
 * Controller for GET /api/status endpoint
 * Returns system health, server uptime, and database connection status
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
 * Controller for GET /api/produk endpoint
 * Returns list of adaptive learning topics in JSON format
 */
exports.produk = async (req, res) => {
  try {
    const data = await Produk.getAll();
    res.json({
      success: true,
      total: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics from database',
      error: err.message,
    });
  }
};
