import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import api from '../api/axios';

export default function AdminPengguna() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', nama_lengkap: '', role: 'kasir' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/pengguna');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat data pengguna');
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/pengguna', form);
      setForm({ username: '', password: '', nama_lengkap: '', role: 'kasir' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambah pengguna');
    }
  };

  const toggleStatus = async (u) => {
    try {
      await api.put(`/pengguna/${u.id_pengguna}`, {
        nama_lengkap: u.nama_lengkap, role: u.role,
        status: u.status === 'aktif' ? 'nonaktif' : 'aktif',
      });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal update status');
    }
  };

  const hapus = async (id) => {
    if (!confirm('Hapus pengguna ini?')) return;
    try {
      await api.delete(`/pengguna/${id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <h1>Kelola Pengguna (Admin & Kasir)</h1>
        {error && <div className="error-box">{error}</div>}

        <div className="card">
          <h3>Tambah Pengguna</h3>
          <form onSubmit={submit}>
            <div className="grid cols-3">
              <div>
                <label>Username</label>
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label>Nama Lengkap</label>
                <input value={form.nama_lengkap} onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })} required />
              </div>
              <div>
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button className="btn" type="submit">Tambah Pengguna</button>
          </form>
        </div>

        <div className="card">
          <table>
            <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id_pengguna}>
                  <td>{u.username}</td>
                  <td>{u.nama_lengkap}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`badge ${u.status === 'aktif' ? 'ok' : 'danger'}`}>{u.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn secondary" onClick={() => toggleStatus(u)}>
                      {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button className="btn danger" onClick={() => hapus(u.id_pengguna)}>Hapus</button>
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
