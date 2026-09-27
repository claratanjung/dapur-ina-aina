const Pesanan = require('../models/Pesanan');
const Pelanggan = require('../models/Pelanggan');
const Transaksi = require('../models/Transaksi');

// [Pelanggan - tanpa login] membuat pesanan baru
exports.buatPesanan = async (req, res) => {
  try {
    const { nama_pelanggan, nomor_meja, catatan, items } = req.body;
    if (!nomor_meja || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'nomor_meja dan minimal 1 item wajib diisi' });
    }
    const pelanggan = await Pelanggan.findOrCreateByName(nama_pelanggan);
    const pesanan = await Pesanan.create({ id_pelanggan: pelanggan.id_pelanggan, nomor_meja, catatan, items });
    res.status(201).json(pesanan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// [Pelanggan] melihat detail pesanan + status lengkap (pesanan/transaksi/billing/pembayaran)
exports.statusPesanan = async (req, res) => {
  try {
    const status = await Pesanan.statusLengkap(req.params.id);
    if (!status) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [Pelanggan] membatalkan pesanan yang belum dikonfirmasi
exports.batalkanPesanan = async (req, res) => {
  try {
    const pesanan = await Pesanan.batalkan(req.params.id);
    res.json(pesanan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// [Kasir] melihat daftar pesanan masuk (status Menunggu)
exports.pesananMasuk = async (req, res) => {
  try {
    res.json(await Pesanan.findMasuk());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [Kasir] mengonfirmasi pesanan -> otomatis membuat transaksi + billing + kurangi stok
exports.konfirmasiPesanan = async (req, res) => {
  try {
    const transaksi = await Transaksi.buatDariPesanan(req.params.id, req.user.id_pengguna);
    res.status(201).json(transaksi);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
