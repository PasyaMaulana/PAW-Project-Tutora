const express = require('express');
const topicController = require('../controllers/topicController');

const router = express.Router();

// Halaman utama (Menampilkan seluruh data dari database)
router.get('/', topicController.index);
router.get('/topics', (req, res) => res.redirect('/#katalog'));

// Operasi Create (Tambah Data)
router.get('/topics/create', topicController.createForm);
router.post('/topics', topicController.store);

// Operasi Update (Ubah Data)
router.get('/topics/:id/edit', topicController.editForm);
router.post('/topics/:id/update', topicController.update);

// Operasi Delete (Hapus Data)
router.post('/topics/:id/delete', topicController.delete);

module.exports = router;
