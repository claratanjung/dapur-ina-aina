const Menu = require('../models/Menu');

exports.list = async (req, res) => {
  try {
    const { id_kategori, status } = req.query;
    const menu = await Menu.findAll({ id_kategori, status });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.kategori = async (req, res) => {
  try {
    res.json(await Menu.findKategori());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) return res.status(404).json({ message: 'Menu tidak ditemukan' });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_kategori, nama_menu, harga, stok, deskripsi } = req.body;
    if (!id_kategori || !nama_menu || harga == null) {
      return res.status(400).json({ message: 'id_kategori, nama_menu, dan harga wajib diisi' });
    }
    const menu = await Menu.create({
      id_kategori, nama_menu, harga, stok: stok || 0, deskripsi, id_admin: req.user.id_pengguna,
    });
    res.status(201).json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id_kategori, nama_menu, harga, stok, deskripsi, status_ketersediaan } = req.body;
    const menu = await Menu.update(req.params.id, { id_kategori, nama_menu, harga, stok, deskripsi, status_ketersediaan });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Menu.remove(req.params.id);
    res.json({ message: 'Menu berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStok = async (req, res) => {
  try {
    const { jenis_mutasi, jumlah, keterangan } = req.body;
    if (!['Masuk', 'Keluar'].includes(jenis_mutasi) || !jumlah || jumlah <= 0) {
      return res.status(400).json({ message: 'jenis_mutasi (Masuk/Keluar) dan jumlah (>0) wajib diisi dengan benar' });
    }
    const menu = await Menu.updateStok(req.params.id, { jenis_mutasi, jumlah: Number(jumlah), keterangan });
    res.json(menu);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.riwayatStok = async (req, res) => {
  try {
    res.json(await Menu.riwayatMutasi(req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
