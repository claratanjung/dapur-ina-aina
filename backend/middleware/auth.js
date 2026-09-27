const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan, silakan login' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ubah_secret_ini_di_produksi');
    req.user = decoded; // { id_pengguna, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak memiliki akses untuk aksi ini' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
