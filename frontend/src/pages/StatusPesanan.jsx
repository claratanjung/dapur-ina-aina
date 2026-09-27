import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

const LANGKAH = ['Menunggu', 'Dikonfirmasi', 'Dibayar'];

function tentukanLangkah(data) {
  if (!data) return 0;
  if (data.pembayaran?.status_pembayaran === 'Lunas') return 3;
  if (data.transaksi) return 2;
  if (data.pesanan?.status_pesanan === 'Dikonfirmasi') return 2;
  if (data.pesanan?.status_pesanan === 'Batal') return -1;
  return 1;
}

export default function StatusPesanan() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/pesanan/${id}/status`);
      setData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat status pesanan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Polling ringan agar pelanggan bisa melihat perubahan status transaksi/billing secara real-time
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  const batalkan = async () => {
    try {
      await api.patch(`/pesanan/${id}/batal`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan pesanan');
    }
  };

  if (loading) return <div className="container">Memuat...</div>;
  if (error) return <div className="container"><div className="error-box">{error}</div></div>;

  const langkah = tentukanLangkah(data);
  const { pesanan, transaksi, billing, pembayaran } = data;

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h1>🍲 Status Pesanan #{pesanan.id_pesanan}</h1>

      {langkah === -1 ? (
        <div className="card"><span className="badge danger">Pesanan Dibatalkan</span></div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {LANGKAH.map((label, i) => (
              <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px',
                    background: i < langkah ? 'var(--success)' : 'var(--border)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {i < langkah ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Meja {pesanan.nomor_meja}</h3>
        <table>
          <tbody>
            {pesanan.items.map((it) => (
              <tr key={it.id_detail}>
                <td>{it.nama_menu} x{it.jumlah}</td>
                <td style={{ textAlign: 'right' }}>Rp {Number(it.subtotal).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ textAlign: 'right', fontWeight: 700 }}>
          Total: Rp {Number(pesanan.total).toLocaleString('id-ID')}
        </p>
      </div>

      {pesanan.status_pesanan === 'Menunggu' && (
        <button className="btn danger" onClick={batalkan}>Batalkan Pesanan</button>
      )}

      {transaksi && (
        <div className="card">
          <h3>Transaksi</h3>
          <p>No. Transaksi: <b>{transaksi.no_transaksi}</b></p>
          <p>Total: Rp {Number(transaksi.total_harga).toLocaleString('id-ID')}</p>
        </div>
      )}

      {billing && (
        <div className="card">
          <h3>Billing / Tagihan</h3>
          <p>No. Billing: <b>{billing.no_billing}</b></p>
          <p>Total Tagihan: Rp {Number(billing.total_tagihan).toLocaleString('id-ID')}</p>
        </div>
      )}

      {pembayaran ? (
        <div className="card">
          <h3>Pembayaran</h3>
          <span className="badge ok">Lunas</span>
          <p>Metode: {pembayaran.metode_pembayaran}</p>
          {pembayaran.metode_pembayaran === 'Tunai' && (
            <p>Kembalian: Rp {Number(pembayaran.kembalian).toLocaleString('id-ID')}</p>
          )}
        </div>
      ) : transaksi ? (
        <div className="card">
          <span className="badge warn">Menunggu Pembayaran di Kasir</span>
        </div>
      ) : null}

      <p style={{ textAlign: 'center' }}>
        <Link to="/pesan">← Pesan Menu Lagi</Link>
      </p>
    </div>
  );
}
