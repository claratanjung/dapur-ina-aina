const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pesananController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Publik (pelanggan tanpa login)
router.post('/', ctrl.buatPesanan);
router.get('/:id/status', ctrl.statusPesanan);
router.patch('/:id/batal', ctrl.batalkanPesanan);

// Kasir
router.get('/masuk', verifyToken, requireRole('kasir', 'admin'), ctrl.pesananMasuk);
router.post('/:id/konfirmasi', verifyToken, requireRole('kasir'), ctrl.konfirmasiPesanan);

module.exports = router;
