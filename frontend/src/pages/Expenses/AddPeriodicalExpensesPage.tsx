import React from 'react'
import { Link } from 'react-router-dom'

export default function AddPeriodicalExpensesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = React.useState('');
  const [date, setDate] = React.useState(today);
  const [name, setName] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [paymentType, setPaymentType] = React.useState('');

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: '40px auto', textAlign: 'center' }}>
        <h1>Add periodical expenses</h1>

        <p style={{ textAlign: 'left' }}>Name of expenses</p>
        <input
          type="text"
          placeholder="Write the name of expenses"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p style={{ textAlign: 'left' }}>Payment type</p>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
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
        />

        <p style={{ textAlign: 'left' }}>Expenses payment start date</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <p style={{ textAlign: 'left' }}>Payment frequency</p>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="">Choose payment frequency</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="annually">Annually</option>
        </select>

        <p style={{ textAlign: 'left' }}>Comment</p>
        <input
          type="text"
          placeholder="Write a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={() => {
            console.log('Amount:', amount);
            console.log('Date:', date);
            console.log('Payment type:', paymentType);
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