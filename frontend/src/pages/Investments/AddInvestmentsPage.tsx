import React, { useEffect, useState } from 'react';

export default function AddInvestmentsPage() {
  const today = new Date().toISOString().split('T')[0];

  const [shares, setShares] = useState('');
  const [sector, setSector] = useState('');
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<{id: number, pavadinimas: string}[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  useEffect(() => {
    fetch(`${API_URL}/sektoriai`)
      .then(res => res.json())
      .then(data => setSectors(data.data || []))
      .catch(console.error);
  }, []);

  const handleAddInvestment = async () => {
    if (!name || !shares || !price || !purchaseDate || !sector) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pavadinimas: name,
          kiekis: Number(shares),
          pirkimo_kaina: Number(price),
          pirkimo_data: purchaseDate,
          sektorius_id: Number(sector),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Investment added successfully!');
        setName('');
        setShares('');
        setPrice('');
        setSector('');
        setPurchaseDate(today);
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
        <h1>Add Investment</h1>

        <p style={{ textAlign: 'left' }}>Investment sector</p>
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">Choose investment sector</option>
          {sectors.map(s => (
            <option key={s.id} value={s.id}>{s.pavadinimas}</option>
          ))}
        </select>

        <p style={{ textAlign: 'left' }}>Name of investment</p>
        <input type="text" placeholder="Write the name of the investment" value={name} onChange={e => setName(e.target.value)} />

        <p style={{ textAlign: 'left' }}>Shares</p>
        <input type="number" placeholder="Number of shares" value={shares} onChange={e => setShares(e.target.value)} />

        <p style={{ textAlign: 'left' }}>Price</p>
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} />

        <p style={{ textAlign: 'left' }}>Purchase date</p>
        <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />

        <button onClick={handleAddInvestment} style={{ width: '100%', marginTop: '25px', cursor: 'pointer' }} disabled={loading}>
          {loading ? 'Adding...' : 'Add Investment'}
        </button>
      </div>
    </div>
  )
}
