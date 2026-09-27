const pool = require('../config/db');

class Pelanggan {
  static async findOrCreateByName(nama_pelanggan) {
    // Pelanggan tidak login: kita buat/ambil berdasarkan nama sederhana + kode acak
    const kode = 'PLG' + Date.now().toString().slice(-8);
    const [result] = await pool.query(
      'INSERT INTO pelanggan (kode_pelanggan, nama_pelanggan) VALUES (?, ?)',
      [kode, nama_pelanggan || 'Pelanggan']
    );
    const [rows] = await pool.query('SELECT * FROM pelanggan WHERE id_pelanggan = ?', [result.insertId]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM pelanggan WHERE id_pelanggan = ?', [id]);
    return rows[0] || null;
  }
}

module.exports = Pelanggan;
