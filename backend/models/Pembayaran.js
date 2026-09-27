const pool = require('../config/db');

class Pembayaran {
  // Proses pembayaran tunai atau non-tunai (Debit/Kartu Kredit) untuk sebuah transaksi
  static async proses({ id_transaksi, metode_pembayaran, jumlah_bayar, no_referensi }) {
    const [[trx]] = await pool.query('SELECT * FROM transaksi WHERE id_transaksi = ?', [id_transaksi]);
    if (!trx) throw new Error('Transaksi tidak ditemukan');

    const [existing] = await pool.query('SELECT * FROM pembayaran WHERE id_transaksi = ?', [id_transaksi]);
    if (existing.length > 0) throw new Error('Transaksi ini sudah dibayar');

    let kembalian = 0;
    if (metode_pembayaran === 'Tunai') {
      if (Number(jumlah_bayar) < Number(trx.total_harga)) {
        throw new Error('Jumlah bayar tunai kurang dari total tagihan');
      }
      kembalian = Number(jumlah_bayar) - Number(trx.total_harga);
    } else {
      // Non tunai: nominal bayar otomatis mengikuti total tagihan, wajib ada no referensi EDC
      jumlah_bayar = trx.total_harga;
      if (!no_referensi) throw new Error('Nomor referensi EDC wajib diisi untuk pembayaran non tunai');
    }

    const [result] = await pool.query(
      `INSERT INTO pembayaran (id_transaksi, metode_pembayaran, jumlah_bayar, kembalian, no_referensi, status_pembayaran)
       VALUES (?, ?, ?, ?, ?, 'Lunas')`,
      [id_transaksi, metode_pembayaran, jumlah_bayar, kembalian, no_referensi || null]
    );

    const [[pembayaran]] = await pool.query('SELECT * FROM pembayaran WHERE id_pembayaran = ?', [result.insertId]);
    return pembayaran;
  }

  static async findByTransaksi(id_transaksi) {
    const [[row]] = await pool.query('SELECT * FROM pembayaran WHERE id_transaksi = ?', [id_transaksi]);
    return row || null;
  }
}

module.exports = Pembayaran;
