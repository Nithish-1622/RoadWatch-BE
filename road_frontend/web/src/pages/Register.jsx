import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CITIZEN');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register({ name, email, password, role });
      navigate('/login');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Network Error: Make sure backend is running');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel card animate-fade-in" style={{ width: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <UserPlus size={48} />
          </div>
          <h2 className="text-gradient">Create Account</h2>
          <p className="card-subtitle">Join RoadWatch</p>
        </div>
        
        {error && <div className="badge badge-warning" style={{ marginBottom: '1rem', width: '100%', textAlign: 'center', padding: '0.5rem' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Role</label>
            <select 
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
            >
              <option value="CITIZEN" style={{ color: 'black' }}>Citizen</option>
              <option value="GOVERNMENT" style={{ color: 'black' }}>Government Official</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Register
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>Already have an account? Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
