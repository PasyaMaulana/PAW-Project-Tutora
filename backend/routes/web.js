const express = require('express');
const topicController = require('../controllers/topicController');
const chatController = require('../controllers/chatController');

const router = express.Router();

// Beranda & katalog topik (publik, hanya lihat)
router.get('/', topicController.index);
router.get('/topics', (req, res) => res.redirect('/#katalog'));

// Halaman AI Tutor (chat berbasis Gemini)
router.get('/assistant', chatController.page);

// Halaman Riwayat Belajar (riwayat disimpan di localStorage browser)
router.get('/riwayat', chatController.historyPage);

// Tautan lama form topik dialihkan ke area Admin (F-11)
router.get('/topics/create', (req, res) => res.redirect('/admin/topics/create'));
router.get('/topics/:id/edit', (req, res) => res.redirect(`/admin/topics/${encodeURIComponent(req.params.id)}/edit`));

module.exports = router;
