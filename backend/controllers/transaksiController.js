const Transaksi = require('../models/Transaksi');
const Pembayaran = require('../models/Pembayaran');

exports.list = async (req, res) => {
  try {
    res.json(await Transaksi.findAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.detail = async (req, res) => {
  try {
    const trx = await Transaksi.findById(req.params.id);
    if (!trx) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    const billing = await Transaksi.billingByTransaksi(req.params.id);
    const pembayaran = await Pembayaran.findByTransaksi(req.params.id);
    res.json({ ...trx, billing, pembayaran });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.billing = async (req, res) => {
  try {
    const billing = await Transaksi.billingByTransaksi(req.params.id);
    if (!billing) return res.status(404).json({ message: 'Billing tidak ditemukan' });
    res.json(billing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [Kasir] proses pembayaran tunai / non-tunai
exports.bayar = async (req, res) => {
  try {
    const { metode_pembayaran, jumlah_bayar, no_referensi } = req.body;
    if (!['Tunai', 'Debit', 'Kartu Kredit'].includes(metode_pembayaran)) {
      return res.status(400).json({ message: 'metode_pembayaran harus Tunai, Debit, atau Kartu Kredit' });
    }
    const pembayaran = await Pembayaran.proses({
      id_transaksi: req.params.id,
      metode_pembayaran,
      jumlah_bayar,
      no_referensi,
    });
    res.status(201).json(pembayaran);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
