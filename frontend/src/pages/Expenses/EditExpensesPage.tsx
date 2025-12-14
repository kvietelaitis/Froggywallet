import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface Expense {
  ID: number;
  Pavadinimas: string;
  Suma: number;
  Data: string;
  MokejimoBudas: string;
  Komentaras?: string;
  KategorijaID?: number;
}

interface Category {
  ID: number;
  Pavadinimas: string;
}

export default function EditExpensesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load expense by ID
  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/expenses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          const e: Expense = data.data;
          setExpense(e);
          setName(e.Pavadinimas);
          setAmount(e.Suma.toString());
          setDate(new Date(e.Data).toISOString().split("T")[0]);
          setPaymentType(e.MokejimoBudas);
          setCategoryId(e.KategorijaID || "");
          setComment(e.Komentaras || "");
        } else {
          setError(data.error || "Failed to load expense");
        }
      })
      .catch(() => setError("Failed to connect to server"));
  }, [id]);

  // Load categories
  const fetchCategories = () => {
    fetch(`${API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") setCategories(data.data || []);
      })
      .catch(() => console.error("Failed to fetch categories"));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setModalError("Category name cannot be empty");
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pavadinimas: newCategoryName }),
      });
      const data = await response.json();

      if (data.status === "success") {
        fetchCategories();
        setCategoryId(data.data.ID);
        setNewCategoryName("");
        setIsModalOpen(false);
      } else {
        setModalError(data.error || "Failed to create category");
      }
    } catch {
      setModalError("Failed to connect to server");
    } finally {
      setModalLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !amount || !date || !paymentType) {
      setError("Please fill all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "PUT",
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
        navigate("/expenses");
      } else {
        setError(data.error || "Failed to update expense");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (!expense) {
    return (
      <div className="auth-container">
        <p>Loading expense data...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
        <h1>Edit Expense</h1>

        {error && (
          <div style={{ background: "#f8d7da", color: "#721c24", padding: 12, borderRadius: 8, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <p style={{ textAlign: "left" }}>Name of expense *</p>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

        <p style={{ textAlign: "left" }}>Payment type *</p>
        <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
          <option value="">-- Select payment type --</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Bank transfer</option>
        </select>

        <p style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Category
          <button type="button" onClick={() => setIsModalOpen(true)} style={{ fontSize: 12, padding: "2px 6px" }}>
            + Create New
          </button>
        </p>
        <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}>
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>
          ))}
        </select>

        <p style={{ textAlign: "left" }}>Amount *</p>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

        <p style={{ textAlign: "left" }}>Date *</p>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <p style={{ textAlign: "left" }}>Comment</p>
        <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} />

        <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginTop: 25, cursor: "pointer" }}>
          {loading ? "Updating..." : "Update Expense"}
        </button>

        {/* Modal */}
        {isModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div style={{ background: "black", padding: 20, borderRadius: 8, width: 300 }}>
              <h3>Create New Category</h3>
              {modalError && <div style={{ color: "red", marginBottom: 8 }}>{modalError}</div>}
              <input
                type="text"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ width: "100%", marginBottom: 10 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsModalOpen(false)} disabled={modalLoading}>Cancel</button>
                <button onClick={handleCreateCategory} disabled={modalLoading}>
                  {modalLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
