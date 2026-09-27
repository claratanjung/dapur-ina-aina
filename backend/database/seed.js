// Seed akun admin & kasir awal (password ter-hash dengan bcrypt)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  try {
    const hashAdmin = await bcrypt.hash('admin123', 10);
    const hashKasir = await bcrypt.hash('kasir123', 10);

    await pool.query(
      `INSERT INTO pengguna (username, password, nama_lengkap, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['admin1', hashAdmin, 'Administrator Dapur Ina Aina']
    );

    await pool.query(
      `INSERT INTO pengguna (username, password, nama_lengkap, role)
       VALUES (?, ?, ?, 'kasir')
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      ['kasir1', hashKasir, 'Kasir Dapur Ina Aina']
    );

    console.log('Seed berhasil!');
    console.log('  admin  -> username: admin1  | password: admin123');
    console.log('  kasir  -> username: kasir1  | password: kasir123');
  } catch (err) {
    console.error('Gagal melakukan seed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
