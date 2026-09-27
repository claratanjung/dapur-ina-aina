const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/laporanController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.post('/', ctrl.buat);

module.exports = router;
