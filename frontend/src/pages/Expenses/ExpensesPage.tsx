import React, { useEffect, useState } from "react";

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<number | null>(null);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isHighExpenseModalOpen, setIsHighExpenseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("");

  const [highExpenses, setHighExpenses] = useState<Expense[]>([]);
  const [acknowledgedExpenses, setAcknowledgedExpenses] = useState<Set<number>>(new Set());
  const [deleteExpenseId, setDeleteExpenseId] = useState<number | null>(null);

  const [group1Start, setGroup1Start] = useState("");
  const [group1End, setGroup1End] = useState("");
  const [group1Category, setGroup1Category] = useState<string | number>("all");
  const [group2Start, setGroup2Start] = useState("");
  const [group2End, setGroup2End] = useState("");
  const [group2Category, setGroup2Category] = useState<string | number>("all");
  const [sum1, setSum1] = useState<number | null>(null);
  const [sum2, setSum2] = useState<number | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [paymentType, setPaymentType] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [comment, setComment] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);

  const [summaryPeriod, setSummaryPeriod] = useState<"week" | "month" | "year" | "all">("all");

  useEffect(() => {
    const stored = localStorage.getItem("acknowledgedExpenses");
    if (stored) setAcknowledgedExpenses(new Set(JSON.parse(stored)));
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (allExpenses.length === 0) return;
    const highs = allExpenses.filter((e) => e.Suma >= 5000 && !acknowledgedExpenses.has(e.ID));
    if (highs.length > 0) {
      setHighExpenses(highs);
      setIsHighExpenseModalOpen(true);
    }
  }, [allExpenses, acknowledgedExpenses]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/expenses`);
      const data = await res.json();
      if (data.status === "success") {
        setExpenses(data.data || []);
        setAllExpenses(data.data || []);
      } else setError(data.error || "Failed to fetch expenses");
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

  const openEditModal = (exp: Expense) => {
    setEditExpenseId(exp.ID);
    setName(exp.Pavadinimas);
    setAmount(exp.Suma.toString());
    setDate(new Date(exp.Data).toISOString().split("T")[0]);
    setPaymentType(exp.MokejimoBudas);
    setCategoryId(exp.Kategorija?.ID || "");
    setComment(exp.Komentaras || "");
    setRecurrence(exp.PasikartojimoTipas || "");
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!name || !amount || !date || !paymentType || editExpenseId === null) {
      setModalError("Please fill all required fields");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch(`${API_URL}/expenses/${editExpenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pavadinimas: name,
          suma: parseFloat(amount),
          data: date,
          mokejimo_budas: paymentType,
          komentaras: comment,
          kategorija_id: categoryId || null,
          pasikartojimo_tipas: recurrence,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await fetchExpenses();
        setIsEditModalOpen(false);
      } else setModalError(data.error || "Failed to update expense");
    } catch {
      setModalError("Failed to connect to server");
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!name || !amount || !date || !paymentType) {
      setModalError("Please fill all required fields");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pavadinimas: name,
          suma: parseFloat(amount),
          data: date,
          mokejimo_budas: paymentType,
          komentaras: comment,
          kategorija_id: categoryId || null,
          pasikartojimo_tipas: recurrence,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        await fetchExpenses();
        setIsAddModalOpen(false);
        resetFormFields();
      } else setModalError(data.error || "Failed to add expense");
    } catch {
      setModalError("Failed to connect to server");
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCategoryModalError("Category name cannot be empty");
      return;
    }
    setCategoryModalLoading(true);
    setCategoryModalError(null);
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pavadinimas: newCategoryName }),
      });
      const data = await res.json();
      if (data.status === "success") {
        fetchCategories();
        setCategoryId(data.data.ID);
        setNewCategoryName("");
        setIsNewCategoryModalOpen(false);
      } else setCategoryModalError(data.error || "Failed to create category");
    } catch {
      setCategoryModalError("Failed to connect to server");
    } finally {
      setCategoryModalLoading(false);
    }
  };

  const handleGroupConfirm = () => {
    let filtered = allExpenses;
    if (filterStartDate) filtered = filtered.filter((e) => new Date(e.Data) >= new Date(filterStartDate));
    if (filterEndDate) filtered = filtered.filter((e) => new Date(e.Data) <= new Date(filterEndDate));
    if (filterCategoryId) filtered = filtered.filter((e) => e.Kategorija?.ID === filterCategoryId);
    setExpenses(filtered);
    setIsGroupModalOpen(false);
  };

  const handleStopGrouping = () => {
    setExpenses(allExpenses);
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterCategoryId("");
  };

  const confirmHighExpenses = () => {
    const newSet = new Set(acknowledgedExpenses);
    highExpenses.forEach((e) => newSet.add(e.ID));
    localStorage.setItem("acknowledgedExpenses", JSON.stringify([...newSet]));
    setAcknowledgedExpenses(newSet);
    setIsHighExpenseModalOpen(false);
  };

  const confirmDeleteExpense = async () => {
    if (deleteExpenseId === null) return;
    try {
      const res = await fetch(`${API_URL}/expenses/${deleteExpenseId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.status === "success") {
        setExpenses((prev) => prev.filter((e) => e.ID !== deleteExpenseId));
        setAllExpenses((prev) => prev.filter((e) => e.ID !== deleteExpenseId));
        const newSet = new Set(acknowledgedExpenses);
        newSet.delete(deleteExpenseId);
        localStorage.setItem("acknowledgedExpenses", JSON.stringify([...newSet]));
        setAcknowledgedExpenses(newSet);
      } else alert(data.error || "Failed to delete expense");
    } catch {
      alert("Failed to connect to server");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteExpenseId(null);
    }
  };

  const calculateCompareSums = () => {
    const sumGroup = (start: string, end: string, category: string | number) => {
      const categoryIdNum = category === "no" || category === "all" ? category : Number(category);
      return allExpenses
        .filter((e) => {
          const dateObj = new Date(e.Data);
          const dateCheck = (!start || dateObj >= new Date(start)) && (!end || dateObj <= new Date(end));
          let categoryCheck = true;
          if (categoryIdNum === "no") categoryCheck = !e.Kategorija;
          else if (categoryIdNum === "all") categoryCheck = true;
          else categoryCheck = e.Kategorija?.ID === categoryIdNum;
          return dateCheck && categoryCheck;
        })
        .reduce((acc, e) => acc + e.Suma, 0);
    };
    setSum1(sumGroup(group1Start, group1End, group1Category));
    setSum2(sumGroup(group2Start, group2End, group2Category));
  };

  const resetFormFields = () => {
    setName("");
    setAmount("");
    setDate(today);
    setPaymentType("");
    setCategoryId("");
    setComment("");
    setRecurrence("");
    setModalError(null);
  };

  const calculateSummary = () => {
    const now = new Date();

    return allExpenses
      .filter((e) => {
        const d = new Date(e.Data);

        if (summaryPeriod === "week") {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return d >= startOfWeek;
        }

        if (summaryPeriod === "month") {
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        }

        if (summaryPeriod === "year") {
          return d.getFullYear() === now.getFullYear();
        }

        return true; // all time
      })
      .reduce((sum, e) => sum + e.Suma, 0);
  };

  const periodLabel: Record<typeof summaryPeriod, string> = {
    week: "This week",
    month: "This month",
    year: "This year",
    all: "All time",
  };


  if (loading) return <div className="auth-container"><p>Loading...</p></div>;

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 900, margin: "20px auto", width: "100%", textAlign: "center" }}>
        <h1>Expenses</h1>
        {error && <div style={{ background: "#f8d7da", color: "#721c24", padding: 12, borderRadius: 8, marginBottom: 16 }}>{error}</div>}
        

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "10px",
            margin: "0 auto 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <div style={{ flex: 1 }}></div>
          <div style={{ flex: 30 }}>
            <h3 style={{ margin: 0, opacity: 0.8, height: "20px", lineHeight: "10px" }}>{periodLabel[summaryPeriod]}</h3>
            <div style={{ fontSize: "32px", fontWeight: "bold" }}>
              {calculateSummary().toFixed(2)} €
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flexDirection: "column", marginLeft: "auto" }}>
            <button
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                height: "28px",
                borderRadius: "8px",
                width: "90px",
              }}
              onClick={() => setSummaryPeriod("week")}
            >
              This week
            </button>

            <button
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                height: "28px",
                borderRadius: "8px",
                width: "90px",
              }}
              onClick={() => setSummaryPeriod("month")}
            >
              This month
            </button>

            <button
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                height: "28px",
                borderRadius: "8px",
                width: "90px",
              }}
              onClick={() => setSummaryPeriod("year")}
            >
              This year
            </button>

            <button
              style={{
                padding: "4px 10px",
                fontSize: "12px",
                height: "28px",
                borderRadius: "8px",
                width: "90px",
              }}
              onClick={() => setSummaryPeriod("all")}
            >
              All time
            </button>
          </div>
        </div>

        {/* --- Grouping Info --- */}
        {expenses.length !== allExpenses.length && (
          <div style={{ margin: "10px 0", fontWeight: "bold" }}>
            Filtered by:
            {filterStartDate && <> |date from {filterStartDate}</>}
            {filterEndDate && <> to {filterEndDate}|</>}
            {filterCategoryId && <> |category: {categories.find(c => c.ID === filterCategoryId)?.Pavadinimas || "N/A"}|</>}
          </div>
        )}


        <table style={{ whiteSpace: "nowrap", width: "100%", marginBottom: "20px", textAlign: "left", borderCollapse: "separate", borderSpacing: "30px 8px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
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
              <tr><td colSpan={9} style={{ textAlign: "center", padding: "20px" }}>No expenses found</td></tr>
            ) : expenses.map((exp) => (
              <tr key={exp.ID}>
                <td>{exp.Pavadinimas}</td>
                <td>{exp.Suma.toFixed(2)} €</td>
                <td>{new Date(exp.Data).toLocaleDateString()}</td>
                <td>{exp.MokejimoBudas || "-"}</td>
                <td>{exp.Kategorija?.Pavadinimas || "-"}</td>
                <td>{exp.Komentaras || "-"}</td>
                <td>{exp.PasikartojimoTipas || "-"}</td>
                <td><span onClick={() => openEditModal(exp)} style={{ cursor: "pointer", fontSize: "18px" }}>✏️</span></td>
                <td><span onClick={() => { setDeleteExpenseId(exp.ID); setIsDeleteModalOpen(true); }} style={{ cursor: "pointer", fontSize: "18px" }}>❌</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginTop: "20px",
            gap: "20px",
          }}
        >
          {/* Kairė pusė */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <button
              style={{ marginBottom: "10px", height: "50px", width: "200px", fontSize: "16px" }}
              onClick={() => setIsCompareModalOpen(true)}
            >
              Compare expenses
            </button>

            <button
              style={{ marginBottom: "10px", height: "50px", width: "200px", fontSize: "16px" }}
              onClick={() => setIsGroupModalOpen(true)}
            >
              Filter expenses
            </button>

            {expenses.length !== allExpenses.length && (
              <button
                style={{ height: "50px", width: "200px", fontSize: "16px" }}
                onClick={handleStopGrouping}
              >
                Stop filtering
              </button>
            )}
          </div>

          {/* Dešinė pusė */}
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <button
              style={{ height: "50px", width: "200px", fontSize: "16px" }}
              onClick={() => {
                resetFormFields();
                setIsAddModalOpen(true);
              }}
            >
              Add new expenses
            </button>
          </div>
        </div>


        {/* --- Add Expense Modal --- */}
        {isAddModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5000 }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 400, maxHeight: "90vh", overflowY: "auto" }}>
              <h2>Add Expense</h2>
              {modalError && <div style={{ color: "red" }}>{modalError}</div>}
              <p>Name *</p><input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              <p>Amount *</p><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p>Date *</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <p>Payment Type *</p>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank transfer</option>
              </select>
              <p>Category <button type="button" onClick={() => setIsNewCategoryModalOpen(true)} style={{ fontSize: 12 }}>+ Create</button></p>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}>
                <option value="">No category</option>
                {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
              </select>
              <p>Recurrence</p>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <p>Comment</p><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button onClick={handleAddExpense}>{modalLoading ? "Adding..." : "Add"}</button>
              </div>

              {/* --- Create Category Modal inside Add --- */}
              {isNewCategoryModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 6000 }}>
                  <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 300 }}>
                    <h3>Create Category</h3>
                    {categoryModalError && <div style={{ color: "red" }}>{categoryModalError}</div>}
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                      <button onClick={() => setIsNewCategoryModalOpen(false)}>Cancel</button>
                      <button onClick={handleCreateCategory}>{categoryModalLoading ? "Creating..." : "Create"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Edit Expense Modal --- */}
        {isEditModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5000 }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 400, maxHeight: "90vh", overflowY: "auto" }}>
              <h2>Edit Expense</h2>
              {modalError && <div style={{ color: "red" }}>{modalError}</div>}
              <p>Name *</p><input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              <p>Amount *</p><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p>Date *</p><input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <p>Payment Type *</p>
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="">-- Select --</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank transfer</option>
              </select>
              <p>Category</p>
              <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")}>
                <option value="">No category</option>
                {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
              </select>
              <p>Recurrence</p>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <p>Comment</p><input type="text" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button onClick={handleSaveEdit}>{modalLoading ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Group Modal --- */}
        {isGroupModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 300 }}>
              <h3>Filter Expenses</h3>
              <p>Start Date:</p><input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
              <p>End Date:</p><input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
              <p>Category:</p>
              <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(Number(e.target.value) || "")} style={{ width: "100%", marginBottom: 8 }}>
                <option value="">All categories</option>
                {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsGroupModalOpen(false)}>Cancel</button>
                <button onClick={handleGroupConfirm}>Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* --- High Expense Modal --- */}
        {isHighExpenseModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 400 }}>
              <h3>High Expenses Alert!</h3>
              <p>Following expenses exceed 5000€:</p>
              <ul style={{ maxHeight: 200, overflowY: "auto" }}>
                {highExpenses.map((e) => <li key={e.ID}>{e.Pavadinimas}: {e.Suma} €</li>)}
              </ul>
              <button onClick={confirmHighExpenses}>OK</button>
            </div>
          </div>
        )}

        {/* --- Delete Modal --- */}
        {isDeleteModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 300 }}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this expense?</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button onClick={confirmDeleteExpense}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Compare Modal --- */}
        {isCompareModalOpen && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 400, maxHeight: "90vh", overflowY: "auto" }}>
              <h3>Compare Expenses</h3>
              <p>Group 1</p>
              <input type="date" value={group1Start} onChange={(e) => setGroup1Start(e.target.value)} />
              <input type="date" value={group1End} onChange={(e) => setGroup1End(e.target.value)} />
              <select value={group1Category} onChange={(e) => setGroup1Category(e.target.value)}>
                <option value="all">All</option>
                <option value="no">No category</option>
                {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
              </select>
              <p>Group 2</p>
              <input type="date" value={group2Start} onChange={(e) => setGroup2Start(e.target.value)} />
              <input type="date" value={group2End} onChange={(e) => setGroup2End(e.target.value)} />
              <select value={group2Category} onChange={(e) => setGroup2Category(e.target.value)}>
                <option value="all">All</option>
                <option value="no">No category</option>
                {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button onClick={() => setIsCompareModalOpen(false)}>Cancel</button>
                <button onClick={calculateCompareSums}>Compare</button>
              </div>
              {sum1 !== null && sum2 !== null && (
                <p style={{ marginTop: 10, fontWeight: "bold", fontSize: "30px" }}>
                  Group 1: {sum1} €<br />
                  Group 2: {sum2} €<br />
                  Difference: {sum1 - sum2} €
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}