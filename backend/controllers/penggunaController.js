const { Pengguna } = require('../models/Pengguna');

exports.list = async (req, res) => {
  try {
    const users = await Pengguna.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, password, nama_lengkap, role } = req.body;
    if (!username || !password || !nama_lengkap || !role) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }
    if (!['admin', 'kasir'].includes(role)) {
      return res.status(400).json({ message: 'Role harus admin atau kasir' });
    }
    const existing = await Pengguna.findByUsername(username);
    if (existing) return res.status(409).json({ message: 'Username sudah digunakan' });

    const user = await Pengguna.create({ username, password, nama_lengkap, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nama_lengkap, role, status, password } = req.body;
    const user = await Pengguna.update(req.params.id, { nama_lengkap, role, status, password });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Pengguna.remove(req.params.id);
    res.json({ message: 'Pengguna berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
