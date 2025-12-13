import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthPage(){
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const userId = location.state?.userId;

        useEffect(() => {
        // If someone tries to go to /auth directly without logging in first, kick them back
        if (!userId) {
            navigate('/login');
        }
    }, [userId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // TODO:
        // Authentication logic here

        navigate('/home'); // Redirect to home page after successful 2FA
    }

    return (
        <div className='auth-container'>
            <main className="2fa-page">
                <h1>Two-Factor Authentication</h1>

                <div style={{ maxWidth: '300px', margin: '50px auto', padding: '20px' }}>
                    <form onSubmit={handleSubmit}>
                        {error && <p style={{ color: 'var(--color-error)' }}>{error}</p>}

                        <div style={{ marginBottom: '15px' }}>
                            <label>Authentication Code:</label>
                            <input
                                type="text"
                                maxLength={6} 
                                pattern="\d{6}"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}