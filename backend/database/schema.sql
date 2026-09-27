-- ============================================================
-- Dapur Ina Aina - Database Schema
-- Sesuai Tugas 1 & 2 (13 kelas -> 12 tabel, hasil normalisasi
-- Pengguna+Admin+Kasir digabung menjadi 1 tabel `pengguna`)
-- ============================================================

CREATE DATABASE IF NOT EXISTS dapur_ina_aina
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dapur_ina_aina;

-- 1. pengguna (gabungan Pengguna, Admin, Kasir)
CREATE TABLE pengguna (
  id_pengguna INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  role ENUM('admin','kasir') NOT NULL,
  status ENUM('aktif','nonaktif') NOT NULL DEFAULT 'aktif',
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. pelanggan
CREATE TABLE pelanggan (
  id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
  kode_pelanggan VARCHAR(20) NOT NULL UNIQUE,
  nama_pelanggan VARCHAR(100) NOT NULL,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. kategori_menu
CREATE TABLE kategori_menu (
  id_kategori INT AUTO_INCREMENT PRIMARY KEY,
  nama_kategori ENUM('Makanan Utama','Appetizer','Minuman') NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 4. menu
CREATE TABLE menu (
  id_menu INT AUTO_INCREMENT PRIMARY KEY,
  id_kategori INT NOT NULL,
  id_admin INT NULL,
  nama_menu VARCHAR(100) NOT NULL,
  harga DECIMAL(12,2) NOT NULL CHECK (harga >= 0),
  stok INT NOT NULL DEFAULT 0 CHECK (stok >= 0),
  status_ketersediaan ENUM('Tersedia','Habis') NOT NULL DEFAULT 'Tersedia',
  deskripsi VARCHAR(255) NULL,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_kategori) REFERENCES kategori_menu(id_kategori)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_admin) REFERENCES pengguna(id_pengguna)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. mutasi_stok
CREATE TABLE mutasi_stok (
  id_mutasi INT AUTO_INCREMENT PRIMARY KEY,
  id_menu INT NOT NULL,
  jenis_mutasi ENUM('Masuk','Keluar') NOT NULL,
  jumlah INT NOT NULL CHECK (jumlah > 0),
  stok_akhir INT NOT NULL,
  keterangan VARCHAR(255) NULL,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_menu) REFERENCES menu(id_menu)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. pesanan
CREATE TABLE pesanan (
  id_pesanan INT AUTO_INCREMENT PRIMARY KEY,
  id_pelanggan INT NOT NULL,
  nomor_meja VARCHAR(10) NOT NULL,
  status_pesanan ENUM('Menunggu','Dikonfirmasi','Batal') NOT NULL DEFAULT 'Menunggu',
  catatan VARCHAR(255) NULL,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 7. detail_pesanan
CREATE TABLE detail_pesanan (
  id_detail INT AUTO_INCREMENT PRIMARY KEY,
  id_pesanan INT NOT NULL,
  id_menu INT NOT NULL,
  jumlah INT NOT NULL CHECK (jumlah > 0),
  harga_satuan DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  UNIQUE KEY uq_pesanan_menu (id_pesanan, id_menu),
  FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_menu) REFERENCES menu(id_menu)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 8. transaksi
CREATE TABLE transaksi (
  id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
  id_pesanan INT NOT NULL UNIQUE,
  id_kasir INT NOT NULL,
  no_transaksi VARCHAR(30) NOT NULL UNIQUE,
  total_harga DECIMAL(12,2) NOT NULL,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (id_kasir) REFERENCES pengguna(id_pengguna)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 9. billing
CREATE TABLE billing (
  id_billing INT AUTO_INCREMENT PRIMARY KEY,
  id_transaksi INT NOT NULL UNIQUE,
  no_billing VARCHAR(30) NOT NULL UNIQUE,
  total_tagihan DECIMAL(12,2) NOT NULL,
  dicetak_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 10. pembayaran
CREATE TABLE pembayaran (
  id_pembayaran INT AUTO_INCREMENT PRIMARY KEY,
  id_transaksi INT NOT NULL UNIQUE,
  metode_pembayaran ENUM('Tunai','Debit','Kartu Kredit') NOT NULL,
  jumlah_bayar DECIMAL(12,2) NOT NULL,
  kembalian DECIMAL(12,2) NOT NULL DEFAULT 0,
  no_referensi VARCHAR(50) NULL,
  status_pembayaran ENUM('Lunas','Menunggu') NOT NULL DEFAULT 'Menunggu',
  dibayar_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 11. laporan_penjualan
CREATE TABLE laporan_penjualan (
  id_laporan INT AUTO_INCREMENT PRIMARY KEY,
  id_admin INT NOT NULL,
  jenis_laporan ENUM('Mingguan','Bulanan') NOT NULL,
  tanggal_awal DATE NOT NULL,
  tanggal_akhir DATE NOT NULL,
  total_pendapatan DECIMAL(14,2) NOT NULL DEFAULT 0,
  dibuat_pada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_admin) REFERENCES pengguna(id_pengguna)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (tanggal_akhir >= tanggal_awal)
) ENGINE=InnoDB;

-- 12. laporan_transaksi (tabel penghubung many-to-many)
CREATE TABLE laporan_transaksi (
  id_laporan INT NOT NULL,
  id_transaksi INT NOT NULL,
  PRIMARY KEY (id_laporan, id_transaksi),
  FOREIGN KEY (id_laporan) REFERENCES laporan_penjualan(id_laporan)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Seed kategori menu
INSERT INTO kategori_menu (nama_kategori) VALUES
  ('Makanan Utama'), ('Appetizer'), ('Minuman');

-- Seed data menu contoh
INSERT INTO menu (id_kategori, nama_menu, harga, stok, status_ketersediaan, deskripsi) VALUES
  (1, 'Nasi Goreng Ina Aina', 28000, 20, 'Tersedia', 'Nasi goreng spesial dengan telur dan ayam suwir'),
  (1, 'Ayam Bakar Bumbu Rempah', 32000, 15, 'Tersedia', 'Ayam bakar bumbu khas dapur'),
  (1, 'Soto Ayam Kampung', 25000, 10, 'Tersedia', 'Soto ayam kuah bening'),
  (2, 'Tahu Crispy', 15000, 25, 'Tersedia', 'Tahu goreng tepung renyah'),
  (2, 'Pisang Goreng Keju', 17000, 20, 'Tersedia', 'Pisang goreng topping keju & cokelat'),
  (3, 'Es Teh Manis', 6000, 50, 'Tersedia', 'Teh manis dingin'),
  (3, 'Es Jeruk Peras', 9000, 30, 'Tersedia', 'Jeruk peras segar'),
  (3, 'Kopi Susu Gula Aren', 15000, 0, 'Habis', 'Kopi susu kekinian');
