const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Initial adaptive learning topics (pure AI learning topics, no pricing/stock)
const dataAwal = [
  {
    id: 1,
    nama: 'Pengembangan Aplikasi Web (Express.js & MVC)',
    kategori: 'Web Development',
    deskripsi: 'Bimbingan konsep arsitektur MVC, routing Express.js, custom middleware logger, dan view engine EJS.',
    icon: 'lucide:globe',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    id: 2,
    nama: 'Struktur Data & Kompleksitas Algoritma',
    kategori: 'Computer Science',
    deskripsi: 'Bedah tuntas Linked List, Binary Tree, Graph, sorting, serta analisis Big-O secara bertahap.',
    icon: 'lucide:binary',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    id: 3,
    nama: 'Perancangan Basis Data Relasional & PostgreSQL',
    kategori: 'Database',
    deskripsi: 'Bimbingan normalisasi basis data, relasi tabel relasional, indexing, dan manipulasi query SQL.',
    icon: 'lucide:database',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    id: 4,
    nama: 'Pemrograman Berorientasi Objek (OOP)',
    kategori: 'Software Engineering',
    deskripsi: 'Pahami 4 pilar OOP: Encapsulation, Inheritance, Polymorphism, dan Abstraction dengan studi kasus konkret.',
    icon: 'lucide:code-2',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    id: 5,
    nama: 'Jaringan Komputer & Protokol HTTP/HTTPS',
    kategori: 'Networking',
    deskripsi: 'Eksplorasi mendalam model OSI, TCP/IP, DNS, status code HTTP, SSL/TLS, dan arsitektur RESTful API.',
    icon: 'lucide:network',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
  {
    id: 6,
    nama: 'Kecerdasan Buatan & Prompt Engineering',
    kategori: 'Artificial Intelligence',
    deskripsi: 'Strategi interaksi terarah dengan LLM, adaptasi tingkat pemahaman, dan teknik belajar aktif berbasis AI.',
    icon: 'lucide:bot',
    levels: ['Pemula', 'Menengah', 'Lanjut'],
  },
];

const Produk = sequelize.define('Produk', {
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
  tableName: 'produks',
  timestamps: true,
});

Produk.dataAwal = dataAwal;

/**
 * Retrieve all learning topics
 */
Produk.getAll = async function () {
  try {
    const data = await Produk.findAll({
      order: [['id', 'ASC']],
    });
    if (data && data.length > 0) {
      return data;
    }
    return dataAwal;
  } catch (err) {
    return dataAwal;
  }
};

module.exports = Produk;
