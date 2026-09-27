const pool = require('../config/db');
const Menu = require('./Menu');

class Pesanan {
  // Pelanggan membuat pesanan baru (belum login, cukup nomor meja + item)
  static async create({ id_pelanggan, nomor_meja, catatan, items }) {
    // items: [{ id_menu, jumlah }]
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO pesanan (id_pelanggan, nomor_meja, catatan, status_pesanan)
         VALUES (?, ?, ?, 'Menunggu')`,
        [id_pelanggan, nomor_meja, catatan || null]
      );
      const id_pesanan = result.insertId;

      for (const item of items) {
        const [[menu]] = await conn.query('SELECT * FROM menu WHERE id_menu = ?', [item.id_menu]);
        if (!menu) throw new Error(`Menu id ${item.id_menu} tidak ditemukan`);
        if (menu.status_ketersediaan === 'Habis') throw new Error(`Menu "${menu.nama_menu}" sedang habis`);

        const subtotal = Number(menu.harga) * item.jumlah;
        await conn.query(
          `INSERT INTO detail_pesanan (id_pesanan, id_menu, jumlah, harga_satuan, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [id_pesanan, item.id_menu, item.jumlah, menu.harga, subtotal]
        );
      }

      await conn.commit();
      return Pesanan.findById(id_pesanan);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async findById(id) {
    const [[pesanan]] = await pool.query(
      `SELECT p.*, pl.nama_pelanggan, pl.kode_pelanggan FROM pesanan p
       JOIN pelanggan pl ON pl.id_pelanggan = p.id_pelanggan
       WHERE p.id_pesanan = ?`,
      [id]
    );
    if (!pesanan) return null;
    const [items] = await pool.query(
      `SELECT dp.*, m.nama_menu FROM detail_pesanan dp
       JOIN menu m ON m.id_menu = dp.id_menu
       WHERE dp.id_pesanan = ?`,
      [id]
    );
    pesanan.items = items;
    pesanan.total = items.reduce((s, i) => s + Number(i.subtotal), 0);
    return pesanan;
  }

  static async findMasuk() {
    // Pesanan yang menunggu konfirmasi kasir
    const [rows] = await pool.query(
      `SELECT p.*, pl.nama_pelanggan FROM pesanan p
       JOIN pelanggan pl ON pl.id_pelanggan = p.id_pelanggan
       WHERE p.status_pesanan = 'Menunggu' ORDER BY p.dibuat_pada ASC`
    );
    return rows;
  }

  static async batalkan(id) {
    const [[pesanan]] = await pool.query('SELECT * FROM pesanan WHERE id_pesanan = ?', [id]);
    if (!pesanan) throw new Error('Pesanan tidak ditemukan');
    if (pesanan.status_pesanan !== 'Menunggu') throw new Error('Pesanan yang sudah dikonfirmasi tidak dapat dibatalkan');
    await pool.query("UPDATE pesanan SET status_pesanan = 'Batal' WHERE id_pesanan = ?", [id]);
    return Pesanan.findById(id);
  }

  // Status gabungan untuk dilihat pelanggan (pesanan -> transaksi -> billing -> pembayaran)
  static async statusLengkap(id) {
    const pesanan = await Pesanan.findById(id);
    if (!pesanan) return null;

    const [transaksiRows] = await pool.query('SELECT * FROM transaksi WHERE id_pesanan = ?', [id]);
    const transaksi = transaksiRows[0] || null;
    let billing = null;
    let pembayaran = null;
    if (transaksi) {
      const [billingRows] = await pool.query('SELECT * FROM billing WHERE id_transaksi = ?', [transaksi.id_transaksi]);
      billing = billingRows[0] || null;
      const [pembayaranRows] = await pool.query('SELECT * FROM pembayaran WHERE id_transaksi = ?', [transaksi.id_transaksi]);
      pembayaran = pembayaranRows[0] || null;
    }

    return {
      pesanan,
      transaksi: transaksi || null,
      billing: billing || null,
      pembayaran: pembayaran || null,
    };
  }
}

module.exports = Pesanan;
