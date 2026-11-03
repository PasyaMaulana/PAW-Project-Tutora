const sequelize = require('../config/database');
const Produk = require('./produkModel');

const db = {
  sequelize,
  Produk,
};

module.exports = db;

