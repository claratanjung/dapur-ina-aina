# Dapur Ina Aina — Aplikasi Pengolahan Transaksi Restoran

Tugas Terstruktur Skema Okupasi Associate Programmer (LSP Gunadarma)
Studi kasus: Restoran "Dapur Ina Aina" — Tugas 3

Stack: **React JS** (frontend) + **Node.js/Express (OOP)** (backend) + **MySQL** (database), sesuai skema 12 tabel / 13 kelas pada Tugas 1 & 2.

## Struktur Folder
```
dapur-ina-aina/
├── backend/          Node.js + Express + MySQL (OOP: model, controller, route terpisah)
│   ├── config/db.js          koneksi pool MySQL + test koneksi
│   ├── database/schema.sql   struktur 12 tabel + seed data menu
│   ├── database/seed.js      seed akun admin & kasir
│   ├── models/                class OOP: Pengguna (Admin/Kasir extends), Menu, Pesanan, Transaksi, Pembayaran, LaporanPenjualan, Pelanggan
│   ├── controllers/           logika request/response
│   ├── routes/                definisi endpoint API
│   └── server.js
└── frontend/          React (Vite)
    └── src/
        ├── pages/     Login, MenuPelanggan, StatusPesanan, KasirDashboard, AdminMenuStok, AdminLaporan, AdminPengguna
        ├── context/   AuthContext (JWT)
        └── api/       axios instance
```

## Langkah Menjalankan

### 1. Siapkan Database MySQL
Pastikan MySQL server sudah berjalan di komputer Anda, lalu import schema:
```bash
mysql -u root -p < backend/database/schema.sql
```
Perintah ini otomatis membuat database `dapur_ina_aina`, 12 tabel, dan mengisi data kategori + contoh menu.

### 2. Jalankan Backend
```bash
cd backend
npm install
cp .env.example .env
# edit file .env sesuaikan DB_USER, DB_PASSWORD dengan MySQL Anda
npm run seed     # membuat akun admin1/admin123 dan kasir1/kasir123
npm start        # server berjalan di http://localhost:4000
```
Cek koneksi database: buka `http://localhost:4000/api/health` di browser — harus muncul `{"status":"ok"}`.
Jika muncul error koneksi, pesan error akan menjelaskan penyebabnya (cek `.env`, cek MySQL berjalan, cek database sudah dibuat).

### 3. Jalankan Frontend
Buka terminal baru:
```bash
cd frontend
npm install
cp .env.example .env   # isi VITE_API_URL jika backend tidak di localhost:4000
npm run dev             # aplikasi berjalan di http://localhost:5173
```

### 4. Gunakan Aplikasi
- **Pelanggan** (tanpa login): buka `http://localhost:5173/pesan`, pilih menu, isi nomor meja, kirim pesanan. Setelah itu Anda diarahkan ke halaman status pesanan (`/status/:id`) yang menampilkan progres pesanan → transaksi → billing → pembayaran secara real-time (polling setiap 5 detik).
- **Kasir**: login di `http://localhost:5173/login` dengan `kasir1 / kasir123`. Konfirmasi pesanan masuk (otomatis membuat transaksi, billing, dan mengurangi stok), lalu proses pembayaran (Tunai / Debit / Kartu Kredit).
- **Admin**: login dengan `admin1 / admin123`. Kelola menu & stok (termasuk riwayat mutasi stok), buat laporan penjualan (mingguan/bulanan), kelola akun admin/kasir.

## Alur Bisnis (sesuai Tugas 1 & 2)
1. Pelanggan memesan menu tanpa login → status pesanan `Menunggu`.
2. Kasir mengonfirmasi pesanan → sistem otomatis: kurangi stok menu (dicatat di `mutasi_stok`), buat `transaksi`, buat `billing`.
3. Kasir memproses pembayaran (Tunai dengan hitung kembalian, atau Non-Tunai dengan nomor referensi EDC) → status pembayaran `Lunas`.
4. Admin dapat membuat laporan penjualan mingguan/bulanan yang merangkum seluruh transaksi pada rentang tanggal tertentu.

## Menampilkan Contoh Error Aplikasi
Beberapa contoh error yang bisa didemonstrasikan sesuai kebutuhan tugas (uji coba error handling):
- Matikan MySQL lalu jalankan `npm start` di backend → pesan error koneksi database yang jelas di console & endpoint `/api/health`.
- Coba konfirmasi pesanan yang stok menunya sudah habis dari transaksi lain → error "Stok tidak mencukupi" (HTTP 400).
- Coba bayar transaksi yang sudah lunas → error "Transaksi ini sudah dibayar".
- Coba login dengan password salah → error "Username atau password salah" (HTTP 401).
- Akses endpoint admin (`/api/pengguna`) tanpa token / dengan token kasir → error "Anda tidak memiliki akses untuk aksi ini" (HTTP 403).

## Catatan Teknis
- Password disimpan ter-hash menggunakan bcrypt.
- Autentikasi menggunakan JWT (berlaku 8 jam), disimpan di localStorage pada frontend.
- Semua operasi yang mengubah stok (konfirmasi pesanan, update stok manual) menggunakan **transaction MySQL** (`BEGIN...COMMIT/ROLLBACK`) dan `SELECT ... FOR UPDATE` agar konsisten saat diakses bersamaan.
- Struktur backend mengikuti paradigma OOP: `Pengguna` sebagai superclass, `Admin` dan `Kasir` sebagai subclass yang mewarisi atribut & method (sesuai relasi generalisasi pada class diagram Tugas 1).
"# dapur-ina-aina" 
"# dapur-ina-aina" 
