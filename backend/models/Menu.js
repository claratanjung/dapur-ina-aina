const pool = require('../config/db');

class Menu {
  static async findAll({ id_kategori, status } = {}) {
    let sql = `SELECT m.*, k.nama_kategori FROM menu m
                JOIN kategori_menu k ON k.id_kategori = m.id_kategori WHERE 1=1`;
    const params = [];
    if (id_kategori) {
      sql += ' AND m.id_kategori = ?';
      params.push(id_kategori);
    }
    if (status) {
      sql += ' AND m.status_ketersediaan = ?';
      params.push(status);
    }
    sql += ' ORDER BY m.id_kategori, m.nama_menu';
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT m.*, k.nama_kategori FROM menu m
       JOIN kategori_menu k ON k.id_kategori = m.id_kategori
       WHERE m.id_menu = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findKategori() {
    const [rows] = await pool.query('SELECT * FROM kategori_menu ORDER BY id_kategori');
    return rows;
  }

  static async create({ id_kategori, id_admin, nama_menu, harga, stok, deskripsi }) {
    const status = stok > 0 ? 'Tersedia' : 'Habis';
    const [result] = await pool.query(
      `INSERT INTO menu (id_kategori, id_admin, nama_menu, harga, stok, status_ketersediaan, deskripsi)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_kategori, id_admin, nama_menu, harga, stok, status, deskripsi || null]
    );
    if (stok > 0) {
      await pool.query(
        `INSERT INTO mutasi_stok (id_menu, jenis_mutasi, jumlah, stok_akhir, keterangan)
         VALUES (?, 'Masuk', ?, ?, 'Stok awal saat menu dibuat')`,
        [result.insertId, stok, stok]
      );
    }
    return Menu.findById(result.insertId);
  }

  static async update(id, { id_kategori, nama_menu, harga, stok, deskripsi, status_ketersediaan }) {
    const stokBaru = Number(stok);
    const statusBaru = stokBaru > 0 ? 'Tersedia' : 'Habis';
    await pool.query(
      `UPDATE menu SET id_kategori = ?, nama_menu = ?, harga = ?, stok = ?, deskripsi = ?, status_ketersediaan = ?
       WHERE id_menu = ?`,
      [id_kategori, nama_menu, harga, stokBaru, deskripsi || null, statusBaru, id]
    );
    return Menu.findById(id);
  }

  static async remove(id) {
    await pool.query('DELETE FROM menu WHERE id_menu = ?', [id]);
    return true;
  }

  // Update stok secara manual oleh admin (Masuk/Keluar) + catat mutasi
  static async updateStok(id, { jenis_mutasi, jumlah, keterangan }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[menu]] = await conn.query('SELECT * FROM menu WHERE id_menu = ? FOR UPDATE', [id]);
      if (!menu) throw new Error('Menu tidak ditemukan');

      let stokBaru = menu.stok;
      if (jenis_mutasi === 'Masuk') stokBaru += jumlah;
      else {
        if (menu.stok < jumlah) throw new Error('Stok tidak mencukupi untuk mutasi keluar');
        stokBaru -= jumlah;
      }
      const statusBaru = stokBaru > 0 ? 'Tersedia' : 'Habis';

      await conn.query('UPDATE menu SET stok = ?, status_ketersediaan = ? WHERE id_menu = ?', [stokBaru, statusBaru, id]);
      await conn.query(
        `INSERT INTO mutasi_stok (id_menu, jenis_mutasi, jumlah, stok_akhir, keterangan)
         VALUES (?, ?, ?, ?, ?)`,
        [id, jenis_mutasi, jumlah, stokBaru, keterangan || null]
      );
      await conn.commit();
      return Menu.findById(id);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async riwayatMutasi(id_menu) {
    const [rows] = await pool.query(
      'SELECT * FROM mutasi_stok WHERE id_menu = ? ORDER BY dibuat_pada DESC',
      [id_menu]
    );
    return rows;
  }

  // Dipakai internal saat transaksi dibuat: kurangi stok otomatis
  static async kurangiStokUntukTransaksi(conn, id_menu, jumlah, keterangan) {
    const [[menu]] = await conn.query('SELECT * FROM menu WHERE id_menu = ? FOR UPDATE', [id_menu]);
    if (!menu) throw new Error(`Menu id ${id_menu} tidak ditemukan`);
    if (menu.stok < jumlah) throw new Error(`Stok "${menu.nama_menu}" tidak mencukupi (sisa ${menu.stok})`);

    const stokBaru = menu.stok - jumlah;
    const statusBaru = stokBaru > 0 ? 'Tersedia' : 'Habis';
    await conn.query('UPDATE menu SET stok = ?, status_ketersediaan = ? WHERE id_menu = ?', [stokBaru, statusBaru, id_menu]);
    await conn.query(
      `INSERT INTO mutasi_stok (id_menu, jenis_mutasi, jumlah, stok_akhir, keterangan)
       VALUES (?, 'Keluar', ?, ?, ?)`,
      [id_menu, jumlah, stokBaru, keterangan || 'Terjual dari transaksi']
    );
    return menu;
  }
}

module.exports = Menu;
