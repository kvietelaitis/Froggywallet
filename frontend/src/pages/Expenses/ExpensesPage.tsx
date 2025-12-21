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
  // --- State Management (Kept exactly as is) ---
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

  // --- Effects (Kept exactly as is) ---
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

  // --- API Functions (Kept exactly as is) ---
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const groupId = localStorage.getItem('selectedGroupId');
      const url = groupId ? `${API_URL}/expenses?group_id=${groupId}` : `${API_URL}/expenses`;

      const res = await fetch(url, { credentials: "include" }); // <--- Add credentials
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

    const groupId = localStorage.getItem('selectedGroupId');

    try {
      const res = await fetch(`${API_URL}/expenses/${editExpenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // <--- Add credentials
        body: JSON.stringify({
          pavadinimas: name,
          suma: parseFloat(amount),
          data: date,
          mokejimo_budas: paymentType,
          komentaras: comment,
          kategorija_id: categoryId || null,
          pasikartojimo_tipas: recurrence,
          group_id: groupId ? parseInt(groupId) : null,
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

    const groupId = localStorage.getItem('selectedGroupId');

    try {
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // <--- Add credentials
        body: JSON.stringify({
          pavadinimas: name,
          suma: parseFloat(amount),
          data: date,
          mokejimo_budas: paymentType,
          komentaras: comment,
          kategorija_id: categoryId || null,
          pasikartojimo_tipas: recurrence,
          group_id: groupId ? parseInt(groupId) : null,
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
      const res = await fetch(`${API_URL}/expenses/${deleteExpenseId}`, { 
        method: "DELETE",
        credentials: "include" // <--- Add credentials
      });
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
        if (summaryPeriod === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (summaryPeriod === "year") return d.getFullYear() === now.getFullYear();
        return true;
      })
      .reduce((sum, e) => sum + e.Suma, 0);
  };

  const periodLabel: Record<typeof summaryPeriod, string> = {
    week: "This week",
    month: "This month",
    year: "This year",
    all: "All time",
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);

  if (loading) return <div className="auth-container"><p>Loading...</p></div>;

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 900, margin: "20px auto", width: "100%" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Expenses</h1>
        
        {error && (
            <div style={{ background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                {error}
            </div>
        )}

        {/* --- Summary Card --- */}
        <div className="card" style={{ padding: "20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
                <h3 style={{ margin: "0 0 8px 0", color: "var(--text-secondary)", fontSize: "1rem" }}>{periodLabel[summaryPeriod]}</h3>
                <div style={{ fontSize: "32px", fontWeight: "bold", color: "#dc3545" }}>
                    {formatCurrency(calculateSummary())}
                </div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["week", "month", "year", "all"].map((p) => (
                    <button 
                        key={p}
                        onClick={() => setSummaryPeriod(p as any)}
                        style={{ 
                            padding: "6px 12px", 
                            fontSize: "12px", 
                            backgroundColor: summaryPeriod === p ? "var(--accent)" : "transparent",
                            color: summaryPeriod === p ? "white" : "var(--text-primary)",
                            border: "1px solid var(--border)"
                        }}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>
        </div>

        {/* --- Action Buttons --- */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
            <button 
                style={{ flex: 2, minWidth: "150px", height: "50px" }} 
                onClick={() => { resetFormFields(); setIsAddModalOpen(true); }}
            >
                + Add Expense
            </button>
            <button 
                style={{ flex: 1, minWidth: "100px", height: "50px", backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }} 
                onClick={() => setIsGroupModalOpen(true)}
            >
                Filter
            </button>
            <button 
                style={{ flex: 1, minWidth: "100px", height: "50px", backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }} 
                onClick={() => setIsCompareModalOpen(true)}
            >
                Compare
            </button>
            {expenses.length !== allExpenses.length && (
                <button 
                    style={{ flex: 1, minWidth: "100px", height: "50px", backgroundColor: "#6c757d", color: "white" }} 
                    onClick={handleStopGrouping}
                >
                    Clear Filter
                </button>
            )}
        </div>

        {/* --- Filter Info --- */}
        {expenses.length !== allExpenses.length && (
          <div style={{ marginBottom: "16px", fontSize: "0.9rem", color: "var(--text-secondary)", textAlign: "center" }}>
            Showing filtered results: 
            {filterStartDate && ` From ${filterStartDate}`}
            {filterEndDate && ` To ${filterEndDate}`}
            {filterCategoryId && ` Category: ${categories.find(c => c.ID === filterCategoryId)?.Pavadinimas || "N/A"}`}
          </div>
        )}

        {/* --- Expenses List (Cards) --- */}
        {expenses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>No expenses found.</p>
            </div>
        ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {expenses.map((exp) => (
                    <div key={exp.ID} className="card" style={{ padding: "20px" }}>
                        
                        {/* Card Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: "0 0 8px 0" }}>{exp.Pavadinimas}</h3>
                                {exp.Kategorija && (
                                    <span style={{ background: "#e9ecef", color: "#495057", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
                                        {exp.Kategorija.Pavadinimas}
                                    </span>
                                )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#dc3545" }}>
                                    -{formatCurrency(exp.Suma)}
                                </div>
                            </div>
                        </div>

                        {/* Card Details Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Date</div>
                                <div style={{ fontWeight: "500" }}>{new Date(exp.Data).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Payment</div>
                                <div style={{ fontWeight: "500", textTransform: "capitalize" }}>{exp.MokejimoBudas || "-"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Recurrence</div>
                                <div style={{ fontWeight: "500", textTransform: "capitalize" }}>{exp.PasikartojimoTipas || "None"}</div>
                            </div>
                            {exp.Komentaras && (
                                <div style={{ gridColumn: "1 / -1" }}>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Comment</div>
                                    <div style={{ fontWeight: "500" }}>{exp.Komentaras}</div>
                                </div>
                            )}
                        </div>

                        {/* Card Actions */}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                            <button 
                                style={{ flex: 1, minWidth: "100px", padding: "10px" }} 
                                onClick={() => openEditModal(exp)}
                            >
                                Edit
                            </button>
                            <button 
                                style={{ flex: 1, minWidth: "100px", padding: "10px", backgroundColor: "#dc3545", color: "white" }} 
                                onClick={() => { setDeleteExpenseId(exp.ID); setIsDeleteModalOpen(true); }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- Modals (Styled to match theme) --- */}
        
        {/* Add Expense Modal */}
        {isAddModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5000 }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "450px", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ marginTop: 0 }}>Add Expense</h2>
              {modalError && <div style={{ color: "#dc3545", marginBottom: "10px" }}>{modalError}</div>}
              
              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "8px" }} />
              </div>
              
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Amount *</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "8px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Date *</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "8px" }} />
                  </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Payment Type *</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{ width: "100%", padding: "8px" }}>
                    <option value="">-- Select --</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank transfer</option>
                  </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Category</label>
                    <button type="button" onClick={() => setIsNewCategoryModalOpen(true)} style={{ fontSize: "0.8rem", padding: "2px 6px", height: "auto" }}>+ New</button>
                  </div>
                  <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")} style={{ width: "100%", padding: "8px" }}>
                    <option value="">No category</option>
                    {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
                  </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Recurrence</label>
                  <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} style={{ width: "100%", padding: "8px" }}>
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Comment</label>
                  <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%", padding: "8px" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsAddModalOpen(false)} style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}>Cancel</button>
                <button onClick={handleAddExpense}>{modalLoading ? "Adding..." : "Add Expense"}</button>
              </div>

              {/* Nested Category Modal */}
              {isNewCategoryModalOpen && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 6000 }}>
                  <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 300, border: "1px solid var(--border)" }}>
                    <h3>Create Category</h3>
                    {categoryModalError && <div style={{ color: "red" }}>{categoryModalError}</div>}
                    <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name" style={{ width: "100%", padding: "8px", marginBottom: "16px" }} />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button onClick={() => setIsNewCategoryModalOpen(false)} style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}>Cancel</button>
                      <button onClick={handleCreateCategory}>{categoryModalLoading ? "Creating..." : "Create"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {isEditModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5000 }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "450px", maxHeight: "90vh", overflowY: "auto" }}>
              <h2 style={{ marginTop: 0 }}>Edit Expense</h2>
              {modalError && <div style={{ color: "#dc3545", marginBottom: "10px" }}>{modalError}</div>}
              
              {/* Same fields as Add Modal */}
              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "8px" }} />
              </div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Amount *</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: "100%", padding: "8px" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Date *</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: "8px" }} />
                  </div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Payment Type *</label>
                  <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} style={{ width: "100%", padding: "8px" }}>
                    <option value="">-- Select --</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="transfer">Bank transfer</option>
                  </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value) || "")} style={{ width: "100%", padding: "8px" }}>
                    <option value="">No category</option>
                    {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
                  </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Recurrence</label>
                  <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} style={{ width: "100%", padding: "8px" }}>
                    <option value="">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Comment</label>
                  <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: "100%", padding: "8px" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsEditModalOpen(false)} style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}>Cancel</button>
                <button onClick={handleSaveEdit}>{modalLoading ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {isGroupModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: 300 }}>
              <h3 style={{ marginTop: 0 }}>Filter Expenses</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Start Date</label>
                <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ width: "100%", padding: "8px" }} />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>End Date</label>
                <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ width: "100%", padding: "8px" }} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>Category</label>
                <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(Number(e.target.value) || "")} style={{ width: "100%", padding: "8px" }}>
                    <option value="">All categories</option>
                    {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsGroupModalOpen(false)} style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}>Cancel</button>
                <button onClick={handleGroupConfirm}>Apply Filter</button>
              </div>
            </div>
          </div>
        )}

        {/* High Expense Alert Modal */}
        {isHighExpenseModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: 400, border: "2px solid #dc3545" }}>
              <h3 style={{ marginTop: 0, color: "#dc3545" }}>High Expenses Alert!</h3>
              <p>The following expenses exceed 5000€:</p>
              <ul style={{ maxHeight: 200, overflowY: "auto", paddingLeft: "20px" }}>
                {highExpenses.map((e) => <li key={e.ID}>{e.Pavadinimas}: <strong>{e.Suma} €</strong></li>)}
              </ul>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button onClick={confirmHighExpenses}>Acknowledge</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: 350 }}>
              <h3 style={{ marginTop: 0 }}>Confirm Delete</h3>
              <p style={{ color: "var(--text-secondary)" }}>Are you sure you want to delete this expense? This cannot be undone.</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: "20px" }}>
                <button onClick={() => setIsDeleteModalOpen(false)} style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}>Cancel</button>
                <button onClick={confirmDeleteExpense} style={{ backgroundColor: "#dc3545", color: "white" }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Compare Modal */}
        {isCompareModalOpen && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000 }}>
            <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "12px", width: 400, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ marginTop: 0 }}>Compare Expenses</h3>
              
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 8px 0" }}>Group 1</h4>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input type="date" value={group1Start} onChange={(e) => setGroup1Start(e.target.value)} style={{ flex: 1, padding: "6px" }} />
                    <input type="date" value={group1End} onChange={(e) => setGroup1End(e.target.value)} style={{ flex: 1, padding: "6px" }} />
                  </div>
                  <select value={group1Category} onChange={(e) => setGroup1Category(e.target.value)} style={{ width: "100%", padding: "6px" }}>
                    <option value="all">All Categories</option>
                    <option value="no">No category</option>
                    {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
                  </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 8px 0" }}>Group 2</h4>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input type="date" value={group2Start} onChange={(e) => setGroup2Start(e.target.value)} style={{ flex: 1, padding: "6px" }} />
                    <input type="date" value={group2End} onChange={(e) => setGroup2End(e.target.value)} style={{ flex: 1, padding: "6px" }} />
                  </div>
                  <select value={group2Category} onChange={(e) => setGroup2Category(e.target.value)} style={{ width: "100%", padding: "6px" }}>
                    <option value="all">All Categories</option>
                    <option value="no">No category</option>
                    {categories.map((cat) => <option key={cat.ID} value={cat.ID}>{cat.Pavadinimas}</option>)}
                  </select>
              </div>

              {sum1 !== null && sum2 !== null && (
                <div style={{ background: "rgba(0,0,0,0.05)", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Group 1:</span> <strong>{sum1.toFixed(2)} €</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Group 2:</span> <strong>{sum2.toFixed(2)} €</strong></div>
                  <div style={{ borderTop: "1px solid #ccc", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                      <span>Difference:</span> 
                      <span style={{ color: (sum1 - sum2) > 0 ? "#dc3545" : "#28a745" }}>{(sum1 - sum2).toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsCompareModalOpen(false)} style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}>Close</button>
                <button onClick={calculateCompareSums}>Calculate</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}