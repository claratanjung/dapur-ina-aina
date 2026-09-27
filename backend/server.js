require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const penggunaRoutes = require('./routes/penggunaRoutes');
const menuRoutes = require('./routes/menuRoutes');
const pesananRoutes = require('./routes/pesananRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const laporanRoutes = require('./routes/laporanRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Health check + status koneksi database
app.get('/api/health', async (req, res) => {
  const ok = await pool.testConnection();
  res.status(ok ? 200 : 500).json({
    status: ok ? 'ok' : 'error',
    database: ok ? 'terkoneksi' : 'gagal terkoneksi',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/pengguna', penggunaRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/pesanan', pesananRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/laporan', laporanRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Dapur Ina Aina API sedang berjalan' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
});

// Error handler global - contoh error ditampilkan dengan jelas ke client
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Terjadi kesalahan pada server',
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  const dbOk = await pool.testConnection();
  if (!dbOk) {
    console.warn('[WARN] Server tetap dijalankan meskipun koneksi database gagal. Perbaiki .env lalu restart.');
  }
  app.listen(PORT, () => {
    console.log(`Dapur Ina Aina API berjalan di http://localhost:${PORT}`);
  });
}

start();
