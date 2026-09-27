// Model dasar Pengguna (OOP) - digunakan sebagai superclass untuk Admin & Kasir
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

class Pengguna {
  constructor({ id_pengguna, username, nama_lengkap, role, status }) {
    this.id_pengguna = id_pengguna;
    this.username = username;
    this.nama_lengkap = nama_lengkap;
    this.role = role;
    this.status = status;
  }

  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM pengguna WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id_pengguna, username, nama_lengkap, role, status, dibuat_pada FROM pengguna WHERE id_pengguna = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findAll() {
    const [rows] = await pool.query(
      'SELECT id_pengguna, username, nama_lengkap, role, status, dibuat_pada FROM pengguna ORDER BY id_pengguna DESC'
    );
    return rows;
  }

  static async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }

  static async create({ username, password, nama_lengkap, role }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO pengguna (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)',
      [username, hash, nama_lengkap, role]
    );
    return Pengguna.findById(result.insertId);
  }

  static async update(id, { nama_lengkap, role, status, password }) {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE pengguna SET nama_lengkap = ?, role = ?, status = ?, password = ? WHERE id_pengguna = ?',
        [nama_lengkap, role, status, hash, id]
      );
    } else {
      await pool.query(
        'UPDATE pengguna SET nama_lengkap = ?, role = ?, status = ? WHERE id_pengguna = ?',
        [nama_lengkap, role, status, id]
      );
    }
    return Pengguna.findById(id);
  }

  static async remove(id) {
    await pool.query('DELETE FROM pengguna WHERE id_pengguna = ?', [id]);
    return true;
  }
}

// Subclass Admin - mewarisi Pengguna, menambahkan perilaku khusus admin
class Admin extends Pengguna {
  constructor(data) {
    super(data);
    if (this.role !== 'admin') throw new Error('Data pengguna bukan admin');
  }

  bisaKelolaMenu() {
    return true;
  }

  bisaKelolaPengguna() {
    return true;
  }
}

// Subclass Kasir - mewarisi Pengguna, menambahkan perilaku khusus kasir
class Kasir extends Pengguna {
  constructor(data) {
    super(data);
    if (this.role !== 'kasir') throw new Error('Data pengguna bukan kasir');
  }

  bisaMemprosesTransaksi() {
    return true;
  }
}

module.exports = { Pengguna, Admin, Kasir };
