const LaporanPenjualan = require('../models/LaporanPenjualan');

exports.list = async (req, res) => {
  try {
    res.json(await LaporanPenjualan.findAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const laporan = await LaporanPenjualan.findById(req.params.id);
    if (!laporan) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    res.json(laporan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.buat = async (req, res) => {
  try {
    const { jenis_laporan, tanggal_awal, tanggal_akhir } = req.body;
    if (!['Mingguan', 'Bulanan'].includes(jenis_laporan) || !tanggal_awal || !tanggal_akhir) {
      return res.status(400).json({ message: 'jenis_laporan, tanggal_awal, tanggal_akhir wajib diisi dengan benar' });
    }
    const laporan = await LaporanPenjualan.buat({
      id_admin: req.user.id_pengguna, jenis_laporan, tanggal_awal, tanggal_akhir,
    });
    res.status(201).json(laporan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
