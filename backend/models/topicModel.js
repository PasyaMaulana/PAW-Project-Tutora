const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database');
const { parseId } = require('../utils/format');

// Data topik pembelajaran adaptif awal (sebagai referensi & seed data)
const dataAwal = [
  {
    nama: 'Pengembangan Aplikasi Web (Express.js & MVC)',
    kategori: 'Web Development',
    deskripsi: 'Bimbingan konsep arsitektur MVC, routing Express.js, REST API CRUD, middleware logger, dan view engine EJS.',
    icon: 'lucide:globe',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    nama: 'Struktur Data & Kompleksitas Algoritma',
    kategori: 'Computer Science',
    deskripsi: 'Bedah tuntas Linked List, Binary Tree, Graph, sorting, serta analisis Big-O secara bertahap.',
    icon: 'lucide:binary',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    nama: 'Perancangan Basis Data Relasional & PostgreSQL',
    kategori: 'Database',
    deskripsi: 'Bimbingan normalisasi basis data, relasi tabel relasional, indexing, dan manipulasi query SQL.',
    icon: 'lucide:database',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    nama: 'Pemrograman Berorientasi Objek (OOP)',
    kategori: 'Software Engineering',
    deskripsi: 'Pahami 4 pilar OOP: Encapsulation, Inheritance, Polymorphism, dan Abstraction dengan studi kasus konkret.',
    icon: 'lucide:code-2',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    nama: 'Jaringan Komputer & Protokol HTTP/HTTPS',
    kategori: 'Networking',
    deskripsi: 'Eksplorasi mendalam model OSI, TCP/IP, DNS, status code HTTP, SSL/TLS, dan arsitektur RESTful API.',
    icon: 'lucide:network',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    nama: 'Kecerdasan Buatan & Prompt Engineering',
    kategori: 'Artificial Intelligence',
    deskripsi: 'Strategi interaksi terarah dengan LLM, adaptasi tingkat pemahaman, dan teknik belajar aktif berbasis AI.',
    icon: 'lucide:bot',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
];

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  kategori: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deskripsi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: 'lucide:book-open',
  },
  levels: {
    type: DataTypes.JSON,
    defaultValue: ['Pemula', 'Menengah', 'Lanjut'],
  },
}, {
  tableName: 'topics',
  timestamps: true,
});

Topic.dataAwal = dataAwal;

// ============================================================================
// Model Database Operations (Memisahkan query database dari Controller)
// ============================================================================

/**
 * Mengambil semua topik dari database PostgreSQL
 */
Topic.getAll = async function () {
  return await Topic.findAll({
    order: [['id', 'ASC']],
  });
};

/**
 * Mengambil satu topik berdasarkan ID
 */
Topic.getById = async function (id) {
  const validId = parseId(id);
  if (!validId) return null;
  return await Topic.findByPk(validId);
};

// Kategori bawaan yang selalu muncul sebagai pilihan di form admin
const KATEGORI_BAWAAN = [
  'Web Development',
  'Computer Science',
  'Database',
  'Software Engineering',
  'Networking',
  'Artificial Intelligence',
  'Cyber Security',
];

/**
 * Daftar kategori untuk dropdown form admin: kategori bawaan + kategori yang sudah dipakai di katalog.
 * @returns {Promise<string[]>}
 */
Topic.getCategories = async function () {
  const rows = await Topic.findAll({ attributes: ['kategori'], group: ['kategori'], raw: true });
  const semua = [...KATEGORI_BAWAAN, ...rows.map((r) => r.kategori).filter(Boolean)];
  const unik = [];
  semua.forEach((k) => {
    if (!unik.some((u) => u.toLowerCase() === k.toLowerCase())) unik.push(k);
  });
  return unik.sort((a, b) => a.localeCompare(b, 'id'));
};

/**
 * Mengecek apakah nama topik sudah dipakai (tidak membedakan huruf besar/kecil).
 * @param {string} nama
 * @param {number|null} excludeId  ID topik yang sedang diedit (diabaikan dari pengecekan)
 */
Topic.isNameTaken = async function (nama, excludeId = null) {
  const where = {
    [Op.and]: [sequelize.where(sequelize.fn('lower', sequelize.col('nama')), String(nama).trim().toLowerCase())],
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return (await Topic.count({ where })) > 0;
};

/**
 * Menambahkan topik baru ke database
 */
Topic.createTopic = async function (data) {
  return await Topic.create({
    nama: data.nama,
    kategori: data.kategori,
    deskripsi: data.deskripsi,
    icon: data.icon || 'lucide:book-open',
    levels: data.levels || ['Pemula', 'Menengah', 'Lanjut'],
  });
};

/**
 * Memperbarui data topik berdasarkan ID
 */
Topic.updateTopic = async function (id, data) {
  const topic = await Topic.getById(id);
  if (!topic) return null;

  topic.nama = data.nama !== undefined ? data.nama : topic.nama;
  topic.kategori = data.kategori !== undefined ? data.kategori : topic.kategori;
  topic.deskripsi = data.deskripsi !== undefined ? data.deskripsi : topic.deskripsi;
  topic.icon = data.icon !== undefined ? data.icon : topic.icon;
  topic.levels = data.levels !== undefined ? data.levels : topic.levels;

  await topic.save();
  return topic;
};

/**
 * Menghapus topik berdasarkan ID
 */
Topic.deleteTopic = async function (id) {
  const topic = await Topic.getById(id);
  if (!topic) return null;

  await topic.destroy();
  return topic;
};

module.exports = Topic;

