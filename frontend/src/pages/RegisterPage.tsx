import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const [vardas, setVardas] = useState('')
  const [pavarde, setPavarde] = useState('')
  const [el_pastas, setEmail] = useState('')
  const [slaptazodis, setPassword] = useState('')
  const [vartotojo_vardas, setVartotojoVardas] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vardas, pavarde, el_pastas, slaptazodis, vartotojo_vardas }),
    })

    const data = await res.json()
    if (res.ok) {
      navigate('/setup-2fa', {
        state: {
          userId: data.data.id,
          qrUrl: data.data.qr_url,
          secret: data.data.secret
        }
      });
    } else {
      setError(data.error || data.message || 'Registration failed')
    }
  }

  return (
     <div className='auth-container'>
      <div style={{ maxWidth: 420, margin: '40px auto' }}>
        <h1>Registracija</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px', width: '100%' }}>
            <label>Vartotojo vardas:</label>
            <input 
              value={vartotojo_vardas} 
              onChange={e=>setVartotojoVardas(e.target.value)} 
              required 
            />
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', width: '100%' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label>Vardas:</label>
              <input 
                value={vardas} 
                onChange={e=>setVardas(e.target.value)} 
                required />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label>Pavardė:</label>
              <input 
                value={pavarde} 
                onChange={e=>setPavarde(e.target.value)} 
                required />
            </div>
          </div>
          
          <div style={{ marginBottom: '15px', width: '100%' }}>
            <label>El. paštas:</label>
            <input 
              type="email"
              value={el_pastas} 
              onChange={e=>setEmail(e.target.value)} 
              required 
            />
          </div>

          <div style={{ marginBottom: '15px', width: '100%' }}>
            <label>Slaptažodis:</label>
            <input
              type="password"
              value={slaptazodis} 
              onChange={e=>setPassword(e.target.value)} 
              required 
            />
          </div>

          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit">Registruotis</button>
        </form>
      </div>
    </div>
  )
}