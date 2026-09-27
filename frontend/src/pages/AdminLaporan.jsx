import { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';
import api from '../api/axios';

export default function AdminLaporan() {
  const [laporan, setLaporan] = useState([]);
  const [detail, setDetail] = useState(null);
  const [jenis, setJenis] = useState('Mingguan');
  const [awal, setAwal] = useState('');
  const [akhir, setAkhir] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/laporan');
      setLaporan(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat laporan');
    }
  };

  useEffect(() => { load(); }, []);

  const buatLaporan = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/laporan', { jenis_laporan: jenis, tanggal_awal: awal, tanggal_akhir: akhir });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat laporan');
    }
  };

  const lihatDetail = async (id) => {
    const { data } = await api.get(`/laporan/${id}`);
    setDetail(data);
  };

  const cetakLaporan = () => {
    window.print();
  };

  return (
    <div>
      <Topbar />
      <div className="container">
        <h1>Laporan Keuangan</h1>
        {error && <div className="error-box">{error}</div>}

        <div className="card">
          <h3>Buat Laporan Baru</h3>
          <form onSubmit={buatLaporan}>
            <div className="grid cols-3">
              <div>
                <label>Jenis</label>
                <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
                  <option value="Mingguan">Mingguan</option>
                  <option value="Bulanan">Bulanan</option>
                </select>
              </div>
              <div>
                <label>Tanggal Awal</label>
                <input type="date" value={awal} onChange={(e) => setAwal(e.target.value)} required />
              </div>
              <div>
                <label>Tanggal Akhir</label>
                <input type="date" value={akhir} onChange={(e) => setAkhir(e.target.value)} required />
              </div>
            </div>
            <button className="btn" type="submit">Buat Laporan</button>
          </form>
        </div>

        <div className="card">
          <h3>Daftar Laporan</h3>
          <table>
            <thead><tr><th>Jenis</th><th>Periode</th><th>Total Pendapatan</th><th></th></tr></thead>
            <tbody>
              {laporan.map((l) => (
                <tr key={l.id_laporan}>
                  <td>{l.jenis_laporan}</td>
                  <td>{l.tanggal_awal} s/d {l.tanggal_akhir}</td>
                  <td>Rp {Number(l.total_pendapatan).toLocaleString('id-ID')}</td>
                  <td><button className="btn secondary" onClick={() => lihatDetail(l.id_laporan)}>Detail</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {detail && (
          <div className="card">
            <div className="report-detail-header">
              <h3>Detail Laporan #{detail.id_laporan} ({detail.jenis_laporan})</h3>
              <button className="btn secondary print-hide" onClick={cetakLaporan}>Cetak Laporan</button>
            </div>
            <table>
              <thead><tr><th>No. Transaksi</th><th>Tanggal</th><th>Total</th></tr></thead>
              <tbody>
                {detail.transaksi.map((t) => (
                  <tr key={t.id_transaksi}>
                    <td>{t.no_transaksi}</td>
                    <td>{new Date(t.dibuat_pada).toLocaleString('id-ID')}</td>
                    <td>Rp {Number(t.total_harga).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
