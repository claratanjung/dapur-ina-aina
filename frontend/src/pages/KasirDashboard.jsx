import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import MenuPelanggan from './MenuPelanggan';
import api from '../api/axios';

function formatWaktu(value) {
  if (!value) return '-';
  const raw = String(value);
  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return raw;

  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(',', ' |');
}

export default function KasirDashboard() {
  const [pesananMasuk, setPesananMasuk] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [menuList, setMenuList] = useState([]);
  const [error, setError] = useState('');
  const [bayarModal, setBayarModal] = useState(null);
  const [strukModal, setStrukModal] = useState(null);
  const [metode, setMetode] = useState('Tunai');
  const [jumlahBayar, setJumlahBayar] = useState('');
  const [noReferensi, setNoReferensi] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const load = async () => {
    try {
      const [masuk, trx] = await Promise.all([
        api.get('/pesanan/masuk'),
        api.get('/transaksi'),
      ]);
      const menuRes = await api.get('/menu');

      setPesananMasuk(masuk.data || []);
      setTransaksiList(trx.data || []);
      setMenuList(menuRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  const konfirmasi = async (id_pesanan) => {
    setError('');
    try {
      await api.post(`/pesanan/${id_pesanan}/konfirmasi`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengonfirmasi pesanan');
    }
  };

  const bukaBayar = (trx) => {
    setBayarModal(trx);
    setMetode('Tunai');
    setJumlahBayar(trx.total_harga);
    setNoReferensi('');
  };

  const bukaStruk = (trx) => setStrukModal(trx);

  const checkoutKasir = async ({ namaPelanggan, nomorMeja, catatan, metodePembayaran, items }) => {
    setError('');
    try {
      const { data: pesanan } = await api.post('/pesanan', {
        nama_pelanggan: namaPelanggan,
        nomor_meja: nomorMeja,
        catatan,
        items,
      });
      const { data: transaksi } = await api.post(`/pesanan/${pesanan.id_pesanan}/konfirmasi`);
      const { data: detail } = await api.get(`/transaksi/${transaksi.id_transaksi}`);
      setMetode(metodePembayaran);
      setJumlahBayar(detail.total_harga);
      setNoReferensi('');
      setBayarModal(detail);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat transaksi kasir');
      throw err;
    }
  };

  const prosesBayar = async () => {
    setProcessing(true);
    setError('');
    try {
      await api.post(`/transaksi/${bayarModal.id_transaksi}/bayar`, {
        metode_pembayaran: metode,
        jumlah_bayar: Number(jumlahBayar),
        no_referensi: noReferensi,
      });
      setStrukModal({
        ...bayarModal,
        status_pembayaran: 'Lunas',
        pembayaran: { metode_pembayaran: metode },
      });
      setBayarModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const summary = {
    totalPesanan: pesananMasuk.length,
    totalTransaksi: transaksiList.length,
    totalLunas: transaksiList.filter((t) => t.status_pembayaran === 'Lunas').length,
    totalBelumBayar: transaksiList.filter((t) => t.status_pembayaran !== 'Lunas').length,
  };

  return (
    <div>
      <Topbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="container kasir-page">
        {error && <div className="error-box">{error}</div>}

        {activeTab === 'dashboard' && (
          <>
            <div className="dashboard-grid">
              <div className="mini-card">
                <span>Pesanan Masuk</span>
                <strong>{summary.totalPesanan}</strong>
              </div>
              <div className="mini-card">
                <span>Transaksi</span>
                <strong>{summary.totalTransaksi}</strong>
              </div>
              <div className="mini-card">
                <span>Lunas</span>
                <strong>{summary.totalLunas}</strong>
              </div>
              <div className="mini-card">
                <span>Belum Bayar</span>
                <strong>{summary.totalBelumBayar}</strong>
              </div>
            </div>

            <div className="card">
              <h3>Pesanan Masuk ({pesananMasuk.length})</h3>
              {pesananMasuk.length === 0 && <p style={{ color: 'var(--muted)' }}>Tidak ada pesanan menunggu.</p>}
              <table>
                <thead><tr><th>Meja</th><th>Pelanggan</th><th>Waktu</th><th></th></tr></thead>
                <tbody>
                  {pesananMasuk.map((p) => (
                    <tr key={p.id_pesanan}>
                      <td>{p.nomor_meja}</td>
                      <td>{p.nama_pelanggan}</td>
                      <td>{formatWaktu(p.dibuat_pada)}</td>
                      <td><button className="btn" onClick={() => konfirmasi(p.id_pesanan)}>Konfirmasi</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'menu' && (
          <MenuPelanggan kasirMode onKasirCheckout={checkoutKasir} />
        )}

        {activeTab === 'stok' && (
          <div className="card">
            <h3>Informasi Stok Menu</h3>
            <p style={{ color: 'var(--muted)' }}>Informasi ini hanya dapat dilihat oleh kasir.</p>
            <table>
              <thead><tr><th>Nama Menu</th><th>Kategori</th><th>Stok</th><th>Status</th></tr></thead>
              <tbody>
                {menuList.map((item) => (
                  <tr key={item.id_menu}>
                    <td>{item.nama_menu}</td>
                    <td>{item.nama_kategori}</td>
                    <td>{item.stok}</td>
                    <td>
                      <span className={`badge ${item.status_ketersediaan === 'Tersedia' ? 'ok' : 'danger'}`}>
                        {item.status_ketersediaan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'transaksi' && (
          <div className="card">
            <h3>Riwayat Transaksi</h3>
            <table>
              <thead><tr><th>No. Transaksi</th><th>Meja</th><th>Total</th><th>Billing</th><th>Status Bayar</th><th></th></tr></thead>
              <tbody>
                {transaksiList.map((t) => (
                  <tr key={t.id_transaksi}>
                    <td>{t.no_transaksi}</td>
                    <td>{t.nomor_meja}</td>
                    <td>Rp {Number(t.total_harga).toLocaleString('id-ID')}</td>
                    <td>{t.no_billing || '-'}</td>
                    <td>
                      {t.status_pembayaran === 'Lunas'
                        ? <span className="badge ok">Lunas</span>
                        : <span className="badge warn">Belum Bayar</span>}
                    </td>
                    <td style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {t.status_pembayaran === 'Lunas' && t.no_billing && (
                        <button className="btn secondary" onClick={() => bukaStruk(t)}>Struk</button>
                      )}
                      {t.status_pembayaran !== 'Lunas' && (
                        <button className="btn secondary" onClick={() => bukaBayar(t)}>Bayar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {bayarModal && (
          <div className="modal-overlay">
            <div className="card modal-card" style={{ width: 360 }}>
              <h3>Bayar {bayarModal.no_transaksi}</h3>
              <p>Total: Rp {Number(bayarModal.total_harga).toLocaleString('id-ID')}</p>

              <label>Metode Pembayaran</label>
              <select value={metode} onChange={(e) => setMetode(e.target.value)}>
                <option value="Tunai">Tunai</option>
                <option value="Debit">Debit</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
              </select>

              {metode === 'Tunai' ? (
                <>
                  <label>Jumlah Bayar</label>
                  <input type="number" value={jumlahBayar} onChange={(e) => setJumlahBayar(e.target.value)} />
                </>
              ) : (
                <>
                  <label>No. Referensi EDC</label>
                  <input value={noReferensi} onChange={(e) => setNoReferensi(e.target.value)} placeholder="Contoh: EDC00123" />
                </>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn" onClick={prosesBayar} disabled={processing}>
                  {processing ? 'Memproses...' : 'Konfirmasi Bayar'}
                </button>
                <button className="btn secondary" onClick={() => setBayarModal(null)}>Batal</button>
              </div>
            </div>
          </div>
        )}

        {strukModal && strukModal.status_pembayaran === 'Lunas' && (
          <div className="modal-overlay" onClick={() => setStrukModal(null)}>
            <div className="card modal-card struk-card" onClick={(e) => e.stopPropagation()}>
              <div className="struk-header">
                <h3>Struk Pembayaran</h3>
                <button className="close-btn" onClick={() => setStrukModal(null)}>×</button>
              </div>

              <p><strong>No. Transaksi:</strong> {strukModal.no_transaksi}</p>
              <p><strong>Billing:</strong> {strukModal.no_billing}</p>
              <p><strong>Meja:</strong> {strukModal.nomor_meja}</p>
              <p><strong>Total:</strong> Rp {Number(strukModal.total_harga).toLocaleString('id-ID')}</p>
              <p><strong>Status:</strong> {strukModal.status_pembayaran}</p>
              <p><strong>Metode:</strong> {strukModal.pembayaran?.metode_pembayaran || metode}</p>

              <div className="submit-row">
                <button className="btn secondary" onClick={() => window.print()} disabled={strukModal.status_pembayaran !== 'Lunas'}>
                  Cetak Struk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
