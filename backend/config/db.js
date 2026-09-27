// Koneksi pool ke MySQL menggunakan mysql2/promise
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dapur_ina_aina',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

// Uji koneksi saat server start, beri pesan error yang jelas jika gagal
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log(`[DB] Terkoneksi ke database "${process.env.DB_NAME || 'dapur_ina_aina'}" di ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    conn.release();
    return true;
  } catch (err) {
    console.error('[DB] Gagal terkoneksi ke database!');
    console.error(`[DB] Pesan error: ${err.code || ''} ${err.message}`);
    console.error('[DB] Periksa: MySQL server sudah jalan? .env sudah diisi benar? Database "dapur_ina_aina" sudah dibuat (import database/schema.sql)?');
    return false;
  }
}

module.exports = pool;
module.exports.testConnection = testConnection;
