const { Sequelize } = require('sequelize');
require('./index'); // Memastikan variabel .env sudah dimuat

// Kredensial database diambil dari file .env (tidak di-upload ke GitHub)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'tutora_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // ubah jadi console.log jika ingin melihat raw query SQL
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;

