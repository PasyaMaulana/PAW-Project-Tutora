const sequelize = require('../config/database');
const Produk = require('../models/produkModel');

/**
 * Script untuk mengisi (seed) data awal topik pembelajaran ke database PostgreSQL.
 * Prasyarat: Database (contoh: tutora_db) sudah dibuat manual oleh pengguna.
 */
async function seedDatabase() {
  try {
    console.log('====================================================');
    console.log('🌱 Menjalankan Seeder Data Topik Tutora...');
    console.log('====================================================');

    console.log('🔄 1. Menguji koneksi ke database PostgreSQL...');
    await sequelize.authenticate();
    console.log('   ✅ Koneksi database berhasil.');

    console.log('🔄 2. Menyiapkan tabel "produks"...');
    // Sinkronisasi skema tabel di dalam database yang sudah ada
    await Produk.sync({ force: true });
    console.log('   ✅ Tabel "produks" berhasil disiapkan.');

    console.log('🔄 3. Menginput daftar topik pembelajaran adaptif...');
    const dataTanpaId = Produk.dataAwal.map(({ id, ...rest }) => rest);
    await Produk.bulkCreate(dataTanpaId);

    console.log(`   ✨ Berhasil memasukkan ${dataTanpaId.length} topik pembelajaran ke PostgreSQL!`);
    console.log('====================================================');
    console.log('🎉 Seeding selesai! Jalankan `npm run dev` untuk membuka aplikasi.');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal melakukan seed database:');
    console.error('   Pesan error:', error.message);
    console.error('\n💡 Petunjuk:');
    console.error('   1. Pastikan server PostgreSQL sudah aktif.');
    console.error('   2. Pastikan database sudah dibuat manual di pgAdmin/psql (CREATE DATABASE tutora_db;).');
    console.error('   3. Cek file .env untuk memastikan DB_NAME, DB_USER, dan DB_PASSWORD sudah sesuai.');
    process.exit(1);
  }
}

seedDatabase();
