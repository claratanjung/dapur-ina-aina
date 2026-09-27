import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function MenuPelanggan({ kasirMode = false, onKasirCheckout }) {
  const [menu, setMenu] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [filterKategori, setFilterKategori] = useState('');
  const [cart, setCart] = useState({}); // { id_menu: jumlah }
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [nomorMeja, setNomorMeja] = useState('');
  const [catatan, setCatatan] = useState('');
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadMenu = async () => {
    try {
      const [menuRes, katRes] = await Promise.all([api.get('/menu'), api.get('/menu/kategori')]);
      setMenu(menuRes.data);
      setKategori(katRes.data);
    } catch (err) {
      setError('Gagal memuat menu. Pastikan backend & database sudah berjalan.');
    }
  };

  useEffect(() => { loadMenu(); }, []);

  const tampil = filterKategori
    ? menu.filter((m) => String(m.id_kategori) === String(filterKategori))
    : menu;

  const selectedItems = Object.entries(cart)
    .map(([id, jumlah]) => {
      const item = menu.find((x) => String(x.id_menu) === String(id));
      if (!item) return null;
      return { ...item, jumlah };
    })
    .filter(Boolean);

  const addToCart = (id_menu, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[id_menu] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) delete next[id_menu];
      else next[id_menu] = updated;
      return next;
    });
  };

  const updateQty = (id_menu, nextQty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (nextQty <= 0) delete next[id_menu];
      else next[id_menu] = nextQty;
      return next;
    });
  };

  const removeFromCart = (id_menu) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id_menu];
      return next;
    });
  };

  const total = selectedItems.reduce((sum, item) => sum + Number(item.harga) * item.jumlah, 0);

  const submitPesanan = async () => {
    setError('');
    if (!namaPelanggan.trim()) return setError('Nama wajib diisi');
    if (!nomorMeja) return setError('Nomor meja wajib diisi');
    const items = selectedItems.map(({ id_menu, jumlah }) => ({ id_menu: Number(id_menu), jumlah }));
    if (items.length === 0) return setError('Pilih minimal satu menu');

    setLoading(true);
    try {
      if (kasirMode) {
        await onKasirCheckout({
          namaPelanggan: namaPelanggan.trim(),
          nomorMeja,
          catatan,
          metodePembayaran,
          items,
        });
        setShowReview(false);
        return;
      }

      const { data } = await api.post('/pesanan', {
        nama_pelanggan: namaPelanggan.trim(),
        nomor_meja: nomorMeja,
        catatan,
        metode_pembayaran: metodePembayaran,
        items,
      });
      localStorage.setItem('pesananTerakhir', String(data.id_pesanan));
      navigate(`/status/${data.id_pesanan}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="customer-page-heading">
        <h1>🍲 Dapur Ina Aina</h1>
        {!kasirMode && localStorage.getItem('pesananTerakhir') && (
          <button className="btn secondary" onClick={() => navigate(`/status/${localStorage.getItem('pesananTerakhir')}`)}>
            Cek Status Pesanan
          </button>
        )}
      </div>
      {error && <div className="error-box">{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <button className={`btn ${filterKategori === '' ? '' : 'secondary'}`} onClick={() => setFilterKategori('')}>
          Semua
        </button>{' '}
        {kategori.map((k) => (
          <button
            key={k.id_kategori}
            className={`btn ${String(filterKategori) === String(k.id_kategori) ? '' : 'secondary'}`}
            onClick={() => setFilterKategori(k.id_kategori)}
            style={{ marginLeft: 8 }}
          >
            {k.nama_kategori}
          </button>
        ))}
      </div>

      <div className="grid cols-3">
        {tampil.map((m) => (
          <div className="card menu-card" key={m.id_menu}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{m.nama_menu}</strong>
              <span className={`badge ${m.status_ketersediaan === 'Tersedia' ? 'ok' : 'danger'}`}>
                {m.status_ketersediaan}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', minHeight: 36 }}>{m.deskripsi}</p>
            <p style={{ fontWeight: 700 }}>Rp {Number(m.harga).toLocaleString('id-ID')}</p>
            {m.status_ketersediaan === 'Tersedia' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="btn secondary" onClick={() => addToCart(m.id_menu, -1)}>-</button>
                <span>{cart[m.id_menu] || 0}</span>
                <button className="btn secondary" onClick={() => addToCart(m.id_menu, 1)}>+</button>
              </div>
            ) : (
              <button className="btn" disabled>Stok Habis</button>
            )}
          </div>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="cart-summary-wrap">
          <button className="cart-summary-btn" onClick={() => setShowReview(true)}>
            <span>Keranjang</span>
            <strong>{selectedItems.length} item</strong>
            <span>Rp {total.toLocaleString('id-ID')}</span>
          </button>
        </div>
      )}

      {showReview && (
        <div className="review-overlay" onClick={() => setShowReview(false)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>Review Pesanan</h3>
              <button className="close-btn" onClick={() => setShowReview(false)}>×</button>
            </div>

            <div className="review-list">
              {selectedItems.map((item) => (
                <div className="review-item" key={item.id_menu}>
                  <div className="review-main">
                    <div>
                      <strong>{item.nama_menu}</strong>
                      <p>{item.deskripsi}</p>
                    </div>
                    <div className="price-box">Rp {Number(item.harga * item.jumlah).toLocaleString('id-ID')}</div>
                  </div>

                  <div className="review-actions">
                    <div className="qty-box">
                      <button className="btn secondary" onClick={() => updateQty(item.id_menu, item.jumlah - 1)}>-</button>
                      <span>{item.jumlah}</span>
                      <button className="btn secondary" onClick={() => updateQty(item.id_menu, item.jumlah + 1)}>+</button>
                    </div>
                    <button className="link-btn" onClick={() => removeFromCart(item.id_menu)}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="customer-form-box">
              <div className="grid cols-2">
                <div>
                  <label>Nama *</label>
                  <input value={namaPelanggan} onChange={(e) => setNamaPelanggan(e.target.value)} placeholder="Nama Anda" required />
                </div>
                <div>
                  <label>Nomor Meja *</label>
                  <input value={nomorMeja} onChange={(e) => setNomorMeja(e.target.value)} placeholder="Contoh: 12" />
                </div>
              </div>
            </div>

            <div className="note-box">
              <label>Catatan untuk dapur</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: tidak pedas, tanpa bawang, tambahan sendok"
                rows={3}
              />
            </div>

            <div className="payment-method-box">
              <label>Metode pembayaran *</label>
              <select value={metodePembayaran} onChange={(e) => setMetodePembayaran(e.target.value)}>
                <option value="Tunai">Tunai</option>
                <option value="Debit">Debit</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
              </select>
              {kasirMode && <small>Pembayaran diproses sekarang dan struk langsung dibuka.</small>}
            </div>

            <div className="summary-total">
              <span>Total belanja</span>
              <strong>Rp {total.toLocaleString('id-ID')}</strong>
            </div>

            <div className="summary-meta">
              <span>{selectedItems.reduce((sum, item) => sum + item.jumlah, 0)} produk</span>
            </div>

            <div className="submit-row">
              <button className="btn" onClick={submitPesanan} disabled={loading}>
                {loading ? (kasirMode ? 'Memproses...' : 'Mengirim...') : (kasirMode ? 'Bayar & Cetak Struk' : 'Kirim Pesanan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {!kasirMode && (
        <p style={{ textAlign: 'center', marginTop: 30 }}>
          <a href="/login" style={{ color: 'var(--muted)', fontSize: 13 }}>Login sebagai Kasir / Admin</a>
        </p>
      )}
    </div>
  );
}
