import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface Expense {
  ID: number;
  Pavadinimas: string;
  Suma: number;
  Data: string;
  MokejimoBudas: string;
  Komentaras?: string;
  PasikartojimoTipas?: string;
  Kategorija?: {
    ID: number;
    Pavadinimas: string;
  };
}

interface Category {
  ID: number;
  Pavadinimas: string;
}

export default function ExpensesPage() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]); // visos išlaidos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & filters
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_URL}/expenses`);
      const data = await res.json();
      if (data.status === "success") {
        setExpenses(data.data || []);
        setAllExpenses(data.data || []); // saugom viską
      } else {
        setError(data.error || "Failed to fetch expenses");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      if (data.status === "success") setCategories(data.data || []);
    } catch {
      console.error("Failed to fetch categories");
    }
  };

  const deleteExpense = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.status === "success") {
        setExpenses((prev) => prev.filter((e) => e.ID !== id));
        setAllExpenses((prev) => prev.filter((e) => e.ID !== id));
      } else {
        alert(data.error || "Failed to delete expense");
      }
    } catch {
      alert("Failed to connect to server");
    }
  };

  const handleGroupConfirm = () => {
    let filtered = allExpenses;

    if (filterStartDate) {
      filtered = filtered.filter(
        (e) => new Date(e.Data) >= new Date(filterStartDate)
      );
    }
    if (filterEndDate) {
      filtered = filtered.filter(
        (e) => new Date(e.Data) <= new Date(filterEndDate)
      );
    }
    if (filterCategoryId) {
      filtered = filtered.filter(
        (e) => e.Kategorija?.ID === filterCategoryId
      );
    }

    setExpenses(filtered);
    setIsGroupModalOpen(false);
  };

  const handleStopGrouping = () => {
    setExpenses(allExpenses);
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCategoryId("");
  };

  if (loading) {
    return (
      <div className="auth-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div style={{ margin: "40px auto", maxWidth: 1000, textAlign: "center" }}>
        <h1>Expenses</h1>

        {error && (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {/* Virš lentelės rodome aktyvius grupavimo filtrus */}
        {(filterStartDate || filterEndDate || filterCategoryId) && (
          <div
            style={{
              marginBottom: "16px",
              padding: "10px",
              backgroundColor: "#e0f7fa",
              borderRadius: "8px",
              color: "#006064",
            }}
          >
            <strong>Grouped by:</strong>{" "}
            {filterStartDate && <span>From {filterStartDate} </span>}
            {filterEndDate && <span>To {filterEndDate} </span>}
            {filterCategoryId && (
              <span>
                Category:{" "}
                {categories.find((cat) => cat.ID === filterCategoryId)?.Pavadinimas ||
                  filterCategoryId}
              </span>
            )}
          </div>
        )}

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            textAlign: "left",
          }}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Payment Type</th>
              <th>Category</th>
              <th>Comment</th>
              <th>Recurrence</th>
              <th></th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.ID}>
                  <td>{exp.Pavadinimas}</td>
                  <td>{exp.Suma.toFixed(2)} €</td>
                  <td>{new Date(exp.Data).toLocaleDateString()}</td>
                  <td>{exp.MokejimoBudas || "-"}</td>
                  <td>{exp.Kategorija?.Pavadinimas || "-"}</td>
                  <td>{exp.Komentaras || "-"}</td>
                  <td>{exp.PasikartojimoTipas || "-"}</td>

                  <td>
                    <span
                      onClick={() => navigate(`/expenses/editexpenses/${exp.ID}`)}
                      style={{ cursor: "pointer", fontSize: "18px" }}
                      title="Edit"
                    >
                      ✏️
                    </span>
                  </td>

                  <td>
                    <span
                      onClick={() => deleteExpense(exp.ID)}
                      style={{ cursor: "pointer", fontSize: "18px" }}
                      title="Delete"
                    >
                      ❌
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ width: "100%" }}>
          <button
            style={{ margin: "10px", height: "70px", width: "400px" }}
            onClick={() => navigate("/expenses/addexpenses")}
          >
            Add
          </button>

          <button
            style={{ margin: "10px", height: "70px", width: "400px" }}
            onClick={() => navigate("/expenses/addperiodicalexpenses")}
          >
            Add recurring expenses
          </button>

          <button
            style={{ margin: "10px", height: "70px", width: "400px" }}
            onClick={() => navigate("/expenses/compareexpenses")}
          >
            Compare
          </button>

          <button
            style={{ margin: "10px", height: "70px", width: "400px" }}
            onClick={() => setIsGroupModalOpen(true)}
          >
            Group
          </button>

          {expenses.length !== allExpenses.length && (
            <button
              style={{ margin: "10px", height: "70px", width: "400px" }}
              onClick={handleStopGrouping}
            >
              Stop Grouping
            </button>
          )}
        </div>

        {/* Grouping Modal */}
        {isGroupModalOpen && (
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
              <h3>Group Expenses</h3>

              <p>Start Date:</p>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                style={{ width: "100%", marginBottom: 8 }}
              />

              <p>End Date:</p>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                style={{ width: "100%", marginBottom: 8 }}
              />

              <p>Category:</p>
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(Number(e.target.value) || "")}
                style={{ width: "100%", marginBottom: 12 }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.ID} value={cat.ID}>
                    {cat.Pavadinimas}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsGroupModalOpen(false)}>Cancel</button>
                <button onClick={handleGroupConfirm}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
