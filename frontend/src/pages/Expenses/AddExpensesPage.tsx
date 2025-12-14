import React from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function AddExpensesPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = React.useState("");
  const [date, setDate] = React.useState(today);
  const [name, setName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [paymentType, setPaymentType] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<number | "">("");
  const [categories, setCategories] = React.useState<{ ID: number; Pavadinimas: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Load categories for dropdown
  React.useEffect(() => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setCategories(data.data || []);
      })
      .catch(() => console.error("Failed to fetch categories"));
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!name || !amount || !date) {
      setError("Please fill all required fields");
      return;
    }

    if (!paymentType) {
      setError("Please select a payment type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pavadinimas: name,
          suma: parseFloat(amount),
          data: date,
          mokejimo_budas: paymentType,
          komentaras: comment,
          kategorija_id: categoryId || null,
          pasikartojimo_tipas: "",
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        navigate("/expenses"); // Go back to expenses list
      } else {
        setError(data.error || "Failed to add expense");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
        <h1>Add Expense</h1>

        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <p style={{ textAlign: "left" }}>Name of expense *</p>
        <input
          type="text"
          placeholder="Write the name of expense"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <p style={{ textAlign: "left" }}>Payment type *</p>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="">-- Select payment type --</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Bank transfer</option>
        </select>

        <p style={{ textAlign: "left" }}>Category</p>
        <select
          value={categoryId}
          onChange={(e) =>
            setCategoryId(Number(e.target.value) || "")
          }
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.ID} value={cat.ID}>
              {cat.Pavadinimas}
            </option>
          ))}
        </select>

        <p style={{ textAlign: "left" }}>Amount *</p>
        <input
          type="number"
          placeholder="Write the sum of expense"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <p style={{ textAlign: "left" }}>Date *</p>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <p style={{ textAlign: "left" }}>Comment</p>
        <input
          type="text"
          placeholder="Write a comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", marginTop: 25, cursor: "pointer" }}
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </div>
    </div>
  );
}
