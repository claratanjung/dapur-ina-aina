const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transaksiController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('kasir', 'admin'));
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.get('/:id/billing', ctrl.billing);
router.post('/:id/bayar', ctrl.bayar);

module.exports = router;
