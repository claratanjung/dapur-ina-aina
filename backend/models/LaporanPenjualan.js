const pool = require('../config/db');

class LaporanPenjualan {
  static async buat({ id_admin, jenis_laporan, tanggal_awal, tanggal_akhir }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [transaksiRows] = await conn.query(
        `SELECT id_transaksi, total_harga FROM transaksi
         WHERE DATE(dibuat_pada) BETWEEN ? AND ?`,
        [tanggal_awal, tanggal_akhir]
      );
      const total_pendapatan = transaksiRows.reduce((s, t) => s + Number(t.total_harga), 0);

      const [result] = await conn.query(
        `INSERT INTO laporan_penjualan (id_admin, jenis_laporan, tanggal_awal, tanggal_akhir, total_pendapatan)
         VALUES (?, ?, ?, ?, ?)`,
        [id_admin, jenis_laporan, tanggal_awal, tanggal_akhir, total_pendapatan]
      );
      const id_laporan = result.insertId;

      for (const t of transaksiRows) {
        await conn.query(
          'INSERT INTO laporan_transaksi (id_laporan, id_transaksi) VALUES (?, ?)',
          [id_laporan, t.id_transaksi]
        );
      }

      await conn.commit();
      return LaporanPenjualan.findById(id_laporan);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async findById(id) {
    const [[laporan]] = await pool.query('SELECT * FROM laporan_penjualan WHERE id_laporan = ?', [id]);
    if (!laporan) return null;
    const [transaksi] = await pool.query(
      `SELECT t.* FROM laporan_transaksi lt
       JOIN transaksi t ON t.id_transaksi = lt.id_transaksi
       WHERE lt.id_laporan = ? ORDER BY t.dibuat_pada`,
      [id]
    );
    laporan.transaksi = transaksi;
    return laporan;
  }

  static async findAll() {
    const [rows] = await pool.query(
      `SELECT l.*, u.nama_lengkap AS nama_admin FROM laporan_penjualan l
       JOIN pengguna u ON u.id_pengguna = l.id_admin
       ORDER BY l.dibuat_pada DESC`
    );
    return rows;
  }
}

module.exports = LaporanPenjualan;
