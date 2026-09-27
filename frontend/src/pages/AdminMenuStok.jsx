import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import api from '../api/axios';

export default function AdminMenuStok() {
  const [menu, setMenu] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ id_kategori: '', nama_menu: '', harga: '', stok: '', deskripsi: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const [menuRes, katRes] = await Promise.all([api.get('/menu'), api.get('/menu/kategori')]);
      setMenu(menuRes.data);
      setKategori(katRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data');
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ id_kategori: '', nama_menu: '', harga: '', stok: '', deskripsi: '' });
    setEditing(null);
  };

  const submitMenu = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/menu/${editing}`, {
          id_kategori: form.id_kategori,
          nama_menu: form.nama_menu,
          harga: form.harga,
          stok: Number(form.stok),
          deskripsi: form.deskripsi,
          status_ketersediaan: form.status_ketersediaan || 'Tersedia',
        });
      } else {
        await api.post('/menu', form);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan menu');
    }
  };

  const editMenu = (m) => {
    setEditing(m.id_menu);
    setForm({
      id_kategori: m.id_kategori, nama_menu: m.nama_menu, harga: m.harga,
      stok: m.stok, deskripsi: m.deskripsi || '', status_ketersediaan: m.status_ketersediaan,
    });
  };

  const hapusMenu = async (id) => {
    if (!confirm('Hapus menu ini?')) return;
    try {
      await api.delete(`/menu/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus menu');
    }
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <h1>Dashboard Admin</h1>
        {error && <div className="error-box">{error}</div>}

        <div className="card">
          <h3>{editing ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
          <form onSubmit={submitMenu}>
            <div className="grid cols-3">
              <div>
                <label>Kategori</label>
                <select value={form.id_kategori} onChange={(e) => setForm({ ...form, id_kategori: e.target.value })} required>
                  <option value="">-- pilih --</option>
                  {kategori.map((k) => <option key={k.id_kategori} value={k.id_kategori}>{k.nama_kategori}</option>)}
                </select>
              </div>
              <div>
                <label>Nama Menu</label>
                <input value={form.nama_menu} onChange={(e) => setForm({ ...form, nama_menu: e.target.value })} required />
              </div>
              <div>
                <label>Harga</label>
                <input type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} required />
              </div>
              <div>
                <label>{editing ? 'Stok' : 'Stok Awal'}</label>
                <input type="number" min="0" value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Deskripsi</label>
                <input value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit">{editing ? 'Simpan Perubahan' : 'Tambah Menu'}</button>
            {editing && <button type="button" className="btn secondary" style={{ marginLeft: 8 }} onClick={resetForm}>Batal</button>}
          </form>
        </div>

        <div className="card">
          <h3>Daftar Menu</h3>
          <table>
            <thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {menu.map((m) => (
                <tr key={m.id_menu}>
                  <td>{m.nama_menu}</td>
                  <td>{m.nama_kategori}</td>
                  <td>Rp {Number(m.harga).toLocaleString('id-ID')}</td>
                  <td>{m.stok}</td>
                  <td>
                    <span className={`badge ${m.status_ketersediaan === 'Tersedia' ? 'ok' : 'danger'}`}>
                      {m.status_ketersediaan}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" onClick={() => editMenu(m)}>Edit</button>
                    <button className="btn danger" onClick={() => hapusMenu(m.id_menu)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
