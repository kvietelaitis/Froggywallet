import React from 'react'

export default function AddInvestmentsPage() {
  const today = new Date().toISOString().split('T')[0];
    const [shares, setShares] = React.useState('');
    const [sector, setSector] = React.useState(today);
    const [name, setName] = React.useState('');
    const [purchaseDate, setPurchaseDate] = React.useState('');
    const [price, setPrice] = React.useState('');
  
    return (
      <div className="auth-container">
        <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>

          
          <h1>Add expenses</h1>
          
          <p style={{ textAlign: 'left' }}>Investment sector</p>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">Choose investment sector</option>
            <option value="Tech">Tech</option>
            <option value="Bonds">Bonds</option>
            <option value="Housing">Housing</option>
            <option value="Stocks">Stocks</option>
            <option value="Other">Stocks</option>
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
            onClick={() => {
              console.log('Shares:', shares);
              console.log('Date:', purchaseDate);
              console.log('Price:', price);
            }}
            style={{
              width: '100%',
              marginTop: '25px',
              cursor: 'pointer'
            }}
          >
            Add expenses
          </button>
  
        </div>
      </div>
    )
}