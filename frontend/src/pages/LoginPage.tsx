import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.status === '2fa_required') {
            // Redirect to the separate AuthPage, passing the userId in state
            navigate('/auth', { state: { userId: data.data.userId } });
        } else {
            // Fallback if 2FA is somehow disabled
            localStorage.setItem('user', JSON.stringify(data.data));
            navigate('/home'); // Go straight to home
        }
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-container'>
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
        <h1 style={{ marginBottom: '50px' }}>Froggywallet</h1>
        <form onSubmit={handleSubmit}>
          {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}
          <div style={{ marginBottom: '15px' }}>
            <label>El. Paštas:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Slaptažodis:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Vyksta prisijungimas' : 'Prisijungti'}
            </button>

            <h3 style={{ marginTop: '20px' }}>Neturite paskyros?</h3>

            <button
              className='reg-button'
              type='button'
              onClick={() => navigate('/register')}
            >
              Registruotis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}