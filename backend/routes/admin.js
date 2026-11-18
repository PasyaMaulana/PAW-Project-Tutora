const express = require('express');
const adminController = require('../controllers/adminController');
const topicController = require('../controllers/topicController');
const { requireAdmin } = require('../middlewares/adminAuth');
const rateLimiter = require('../middlewares/rateLimiter');
const adminConfig = require('../config/admin');

const router = express.Router();

// ============================================================================
// Area Admin - Kelola Katalog Topik (F-11, US-10)
// ============================================================================
router.get('/', (req, res) => res.redirect('/admin/topics'));

// Login / logout dengan satu kata sandi admin (dibatasi 5 percobaan per menit per IP)
router.get('/login', adminController.loginPage);
router.post('/login', rateLimiter({ ...adminConfig.loginRateLimit, handler: adminController.loginLimited }), adminController.login);
router.post('/logout', adminController.logout);

// Seluruh rute di bawah ini wajib login admin
router.use(requireAdmin);

router.get('/topics', adminController.topicsPage);
router.get('/topics/create', topicController.createForm);
router.post('/topics', topicController.store);
router.get('/topics/:id/edit', topicController.editForm);
router.post('/topics/:id/update', topicController.update);
router.post('/topics/:id/delete', topicController.delete);

module.exports = router;
