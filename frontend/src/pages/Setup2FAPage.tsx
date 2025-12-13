import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

export default function Setup2FAPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const { userId, qrUrl, secret } = location.state || {}

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        // If someone tries to go to /auth directly without registering in first, kick them back
        if (!userId || !qrUrl) {
            navigate('/register');
        }
    }, [userId, qrUrl, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code }),
            });

            const data = await res.json();

            if (res.ok) {
                navigate('/')
            } else {
                setError(data.message || 'Invalid Code');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
            <div className='auth-container'>
                <div style={{ maxWidth: '400px', margin: '40px auto', textAlign: 'center' }}>
                    <h1>2FA Setup</h1>
                    <p style={{ marginBottom: '20px' }}>
                        Scan this QR code with a 2FA app.
                    </p>

                    <div style={{ background: 'white', padding: '20px', display: 'inline-block', borderRadius: '10px', marginBottom: '20px' }}>
                        <QRCodeSVG value={qrUrl} size={200} />
                    </div>

                    <p style={{ fontSize: '0.9em', color: '#888', marginBottom: '30px' }}>
                        Secret Key: <span style={{ fontFamily: 'monospace' }}>{secret}</span>
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Enter 2FA code:</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="000 000"
                                maxLength={6}
                                required
                                style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.2em' }}
                            />
                        </div>

                        {error && <p style={{ color: 'var(--color-error)', marginBottom: '10px' }}>{error}</p>}

                        <button type="submit" disabled={loading}>
                            {loading ? 'Checking...' : 'Confirm'}
                        </button>
                    </form>
                </div>
            </div>
        );
}
