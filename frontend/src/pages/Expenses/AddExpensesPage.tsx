import React from 'react'
import { Link } from 'react-router-dom'

export default function AddExpensesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState(today);
  const [name, setName] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [paymentType, setPaymentType] = React.useState('');

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
        <h1>Pridėti išlaidas</h1>
        <p>Šiuo metu čia rodomas išlaidų pridėjimas.</p>

        <p style={{ textAlign: 'left' }}>Name of expenses</p>
        <input
          type="text"
          placeholder="Write the name of expenses"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />

        <p style={{ textAlign: 'left' }}>Payment type</p>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px',
          }}
        >
          <option value="">Choose payment type</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Bank transfer</option>
        </select>

        <p style={{ textAlign: 'left' }}>Expenses sum</p>
        <input
          type="number"
          placeholder="Write the sum of expenses"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />

        <p style={{ textAlign: 'left' }}>Expenses date</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />

        <p style={{ textAlign: 'left' }}>Comment</p>
        <input
          type="text"
          placeholder="Write a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />

      </div>
    </div>
  )
}