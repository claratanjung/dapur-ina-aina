import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      navigate(user.role === 'admin' ? '/admin/menu' : '/kasir');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal login, periksa koneksi ke server backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, marginTop: 60 }}>
      <div className="card">
        <h2>🍲 Login Dapur Ina Aina</h2>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
