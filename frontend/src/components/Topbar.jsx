import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openProfile, setOpenProfile] = useState(false);

  const handleLogout = () => {
    logout();
    setOpenProfile(false);
    navigate('/pesan');
  };

  return (
    <div className="topbar">
      <div className="brand-wrap">
        <span className="brand-icon">◔</span>
        <strong>Dapur Ina Aina</strong>
      </div>

      {user && (
        <>
          <div className="topbar-main-nav">
            {user.role === 'admin' ? (
              <>
                <button className={location.pathname === '/admin/menu' ? 'active' : ''} onClick={() => navigate('/admin/menu')}>Dashboard</button>
                <button className={location.pathname === '/admin/laporan' ? 'active' : ''} onClick={() => navigate('/admin/laporan')}>Laporan Keuangan</button>
              </>
            ) : (
              <>
                <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button className={activeTab === 'menu' ? 'active' : ''} onClick={() => setActiveTab('menu')}>Menu</button>
                <button className={activeTab === 'stok' ? 'active' : ''} onClick={() => setActiveTab('stok')}>Informasi Stok</button>
                <button className={activeTab === 'transaksi' ? 'active' : ''} onClick={() => setActiveTab('transaksi')}>Riwayat Transaksi</button>
              </>
            )}
          </div>

          <div className="profile-box">
            <button className="profile-trigger" onClick={() => setOpenProfile((v) => !v)}>
              <div className="profile-avatar">👤</div>
            </button>

            {openProfile && (
              <div className="profile-dropdown">
                <div className="dropdown-user">
                  <strong>{user.nama_lengkap || user.username || 'Kasir Dapur Ina Aina'}</strong>
                  <span>{user.role || 'Kasir'}</span>
                </div>
                <button className="dropdown-logout" onClick={handleLogout}>Keluar</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
