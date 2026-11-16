const sequelize = require('../config/database');
const Topic = require('../models/topicModel');

/**
 * Script seeder untuk menginisialisasi tabel topics dan mengisi data awal.
 * Jalankan dengan perintah: npm run seed
 */
async function seedDatabase() {
  try {
    console.log('====================================================');
    console.log('🌱 Menjalankan Seeder Data Topik Tutora...');
    console.log('====================================================');

    console.log('🔄 1. Menguji koneksi ke database PostgreSQL...');
    await sequelize.authenticate();
    console.log('   ✅ Koneksi database berhasil.');

    console.log('🔄 2. Menyiapkan tabel "topics" di PostgreSQL...');
    await Topic.sync({ force: true });
    console.log('   ✅ Tabel "topics" berhasil disinkronkan.');

    console.log('🔄 3. Menginput daftar topik pembelajaran awal...');
    await Topic.bulkCreate(Topic.dataAwal);

    console.log(`   ✨ Berhasil menambahkan ${Topic.dataAwal.length} topik pembelajaran ke PostgreSQL!`);
    console.log('====================================================');
    console.log('🎉 Seeding database selesai! Database siap diuji.');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal melakukan seed database:');
    console.error('   Pesan error:', error.message);
    console.error('\n💡 Petunjuk:');
    console.error('   1. Pastikan server PostgreSQL sudah aktif.');
    console.error('   2. Pastikan database tutora_db sudah dibuat di PostgreSQL.');
    console.error('   3. Cek file .env untuk username dan password database.');
    process.exit(1);
  }
}

seedDatabase();
