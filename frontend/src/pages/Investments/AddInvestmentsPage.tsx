import React from 'react'

export default function AddInvestmentsPage() {
  const today = new Date().toISOString().split('T')[0];

  const [shares, setShares] = React.useState('');
  const [sector, setSector] = React.useState('');
  const [name, setName] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState(today);
  const [price, setPrice] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const sectorOptions = [
    { id: 1, name: 'Tech' },
    { id: 2, name: 'Bonds' },
    { id: 3, name: 'Housing' },
    { id: 4, name: 'Stocks' },
    { id: 5, name: 'Other' },
  ];

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

      // Try parsing only if response has JSON
      let data;
      try {
        data = await response.json();
      } catch {
        data = { error: response.statusText || 'Invalid JSON from server' };
      }

      if (response.ok) {
        alert('Investment added successfully!');
      } else {
        alert(data.error || 'Something went wrong');
      }

    }
     catch (err) {
      console.error(err);
      setLoading(false);
      alert('Error adding investment');
    }
  };

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
        <h1>Add Investment</h1>

        <p style={{ textAlign: 'left' }}>Investment sector</p>
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">Choose investment sector</option>
          {sectorOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <p style={{ textAlign: 'left' }}>Name of investment</p>
        <input
          type="text"
          placeholder="Write the name of the investment"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p style={{ textAlign: 'left' }}>Shares</p>
        <input
          type="number"
          placeholder="Write the number of shares"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
        />

        <p style={{ textAlign: 'left' }}>Price</p>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <p style={{ textAlign: 'left' }}>Purchase date</p>
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
        />

        <button
          onClick={handleAddInvestment}
          style={{ width: '100%', marginTop: '25px', cursor: 'pointer' }}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Investment'}
        </button>
      </div>
    </div>
  )
}
