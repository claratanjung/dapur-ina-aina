const pool = require('../config/db');
const Menu = require('./Menu');

class Transaksi {
  // Kasir mengonfirmasi pesanan -> membuat transaksi + kurangi stok otomatis + buat billing
  static async buatDariPesanan(id_pesanan, id_kasir) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[pesanan]] = await conn.query('SELECT * FROM pesanan WHERE id_pesanan = ? FOR UPDATE', [id_pesanan]);
      if (!pesanan) throw new Error('Pesanan tidak ditemukan');
      if (pesanan.status_pesanan !== 'Menunggu') throw new Error('Pesanan sudah diproses sebelumnya');

      const [items] = await conn.query('SELECT * FROM detail_pesanan WHERE id_pesanan = ?', [id_pesanan]);
      if (items.length === 0) throw new Error('Pesanan tidak memiliki item');

      let total = 0;
      for (const item of items) {
        await Menu.kurangiStokUntukTransaksi(conn, item.id_menu, item.jumlah, `Terjual - pesanan #${id_pesanan}`);
        total += Number(item.subtotal);
      }

      const no_transaksi = 'TRX' + Date.now();
      const [trxResult] = await conn.query(
        `INSERT INTO transaksi (id_pesanan, id_kasir, no_transaksi, total_harga) VALUES (?, ?, ?, ?)`,
        [id_pesanan, id_kasir, no_transaksi, total]
      );
      const id_transaksi = trxResult.insertId;

      const no_billing = 'BIL' + Date.now();
      await conn.query(
        `INSERT INTO billing (id_transaksi, no_billing, total_tagihan) VALUES (?, ?, ?)`,
        [id_transaksi, no_billing, total]
      );

      await conn.query("UPDATE pesanan SET status_pesanan = 'Dikonfirmasi' WHERE id_pesanan = ?", [id_pesanan]);

      await conn.commit();
      return Transaksi.findById(id_transaksi);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async findById(id) {
    const [[trx]] = await pool.query(
      `SELECT t.*, u.nama_lengkap AS nama_kasir FROM transaksi t
       JOIN pengguna u ON u.id_pengguna = t.id_kasir
       WHERE t.id_transaksi = ?`,
      [id]
    );
    return trx || null;
  }

  static async findAll() {
    const [rows] = await pool.query(
      `SELECT t.*, u.nama_lengkap AS nama_kasir, p.nomor_meja, pl.nama_pelanggan,
              b.no_billing, pb.status_pembayaran
       FROM transaksi t
       JOIN pengguna u ON u.id_pengguna = t.id_kasir
       JOIN pesanan p ON p.id_pesanan = t.id_pesanan
       JOIN pelanggan pl ON pl.id_pelanggan = p.id_pelanggan
       LEFT JOIN billing b ON b.id_transaksi = t.id_transaksi
       LEFT JOIN pembayaran pb ON pb.id_transaksi = t.id_transaksi
       ORDER BY t.dibuat_pada DESC`
    );
    return rows;
  }

  static async billingByTransaksi(id_transaksi) {
    const [[billing]] = await pool.query('SELECT * FROM billing WHERE id_transaksi = ?', [id_transaksi]);
    return billing || null;
  }
}

module.exports = Transaksi;
