import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MenuPelanggan from './pages/MenuPelanggan';
import StatusPesanan from './pages/StatusPesanan';
import KasirDashboard from './pages/KasirDashboard';
import AdminMenuStok from './pages/AdminMenuStok';
import AdminLaporan from './pages/AdminLaporan';
import AdminPengguna from './pages/AdminPengguna';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pesan" replace />} />
      <Route path="/pesan" element={<MenuPelanggan />} />
      <Route path="/status/:id" element={<StatusPesanan />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<Navigate to="/admin/menu" replace />} />

      <Route
        path="/kasir"
        element={
          <ProtectedRoute roles={['kasir']}>
            <KasirDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/menu"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminMenuStok />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/laporan"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminLaporan />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/pengguna"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminPengguna />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/pesan" replace />} />
    </Routes>
  );
}
