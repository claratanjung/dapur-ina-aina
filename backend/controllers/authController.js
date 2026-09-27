const jwt = require('jsonwebtoken');
const { Pengguna } = require('../models/Pengguna');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const user = await Pengguna.findByUsername(username);
    if (!user) return res.status(401).json({ message: 'Username atau password salah' });
    if (user.status !== 'aktif') return res.status(403).json({ message: 'Akun tidak aktif, hubungi admin' });

    const cocok = await Pengguna.verifyPassword(password, user.password);
    if (!cocok) return res.status(401).json({ message: 'Username atau password salah' });

    const token = jwt.sign(
      { id_pengguna: user.id_pengguna, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap },
      process.env.JWT_SECRET || 'ubah_secret_ini_di_produksi',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id_pengguna: user.id_pengguna, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap },
    });
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server saat login', error: err.message });
  }
};

exports.me = async (req, res) => {
  const user = await Pengguna.findById(req.user.id_pengguna);
  if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
  res.json(user);
};
