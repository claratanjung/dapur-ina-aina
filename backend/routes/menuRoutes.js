const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menuController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Publik: pelanggan & kasir bisa melihat menu tanpa login khusus (menu untuk display)
router.get('/', ctrl.list);
router.get('/kategori', ctrl.kategori);
router.get('/:id', ctrl.detail);
router.get('/:id/riwayat-stok', verifyToken, requireRole('admin'), ctrl.riwayatStok);

// Admin only
router.post('/', verifyToken, requireRole('admin'), ctrl.create);
router.put('/:id', verifyToken, requireRole('admin'), ctrl.update);
router.delete('/:id', verifyToken, requireRole('admin'), ctrl.remove);
router.patch('/:id/stok', verifyToken, requireRole('admin'), ctrl.updateStok);

module.exports = router;
