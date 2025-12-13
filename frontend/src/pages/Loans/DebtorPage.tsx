import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface Loan {
  ID: number;
  VisaSkolaDouble: number;
  MokejimoKiekis: number;
  KitasMokejimas: string;
}

interface Debtor {
  ID: number;
  PaskolaID: number;
  Pavadinimas: string;
  ElPastas: string;
  TelNr: string;
  Paskola?: Loan;
}

const DebtorPage: React.FC = () => {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterName, setFilterName] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterLoanId, setFilterLoanId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  
  const [formData, setFormData] = useState({
    paskola_id: "",
    pavadinimas: "",
    el_pastas: "",
    tel_nr: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchDebtors();
    fetchLoans();
  }, []);

  const fetchDebtors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/debtors`);
      const data = await response.json();
      if (data.status === "success") {
        setDebtors(data.data || []);
      } else {
        setError(data.error || "Failed to fetch debtors");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await fetch(`${API_URL}/loans`);
      const data = await response.json();
      if (data.status === "success") {
        setLoans(data.data || []);
      }
    } catch {
      console.error("Failed to fetch loans");
    }
  };

  const fetchFilteredDebtors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterName) params.append("pavadinimas", filterName);
      if (filterEmail) params.append("el_pastas", filterEmail);
      if (filterPhone) params.append("tel_nr", filterPhone);
      if (filterLoanId) params.append("paskola_id", filterLoanId);
      
      const response = await fetch(`${API_URL}/debtors/filter?${params.toString()}`);
      const data = await response.json();
      if (data.status === "success") {
        setDebtors(data.data || []);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to filter debtors");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterName("");
    setFilterEmail("");
    setFilterPhone("");
    setFilterLoanId("");
    fetchDebtors();
  };

  const handleAddDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/debtors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paskola_id: parseInt(formData.paskola_id),
          pavadinimas: formData.pavadinimas,
          el_pastas: formData.el_pastas,
          tel_nr: formData.tel_nr,
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setShowAddModal(false);
        setFormData({ paskola_id: "", pavadinimas: "", el_pastas: "", tel_nr: "" });
        fetchDebtors();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to create debtor");
    }
  };

  const handleEditDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor) return;
    try {
      const response = await fetch(`${API_URL}/debtors/${selectedDebtor.ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pavadinimas: formData.pavadinimas,
          el_pastas: formData.el_pastas,
          tel_nr: formData.tel_nr,
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setShowEditModal(false);
        setSelectedDebtor(null);
        setFormData({ paskola_id: "", pavadinimas: "", el_pastas: "", tel_nr: "" });
        fetchDebtors();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to update debtor");
    }
  };

  const handleDeleteDebtor = async () => {
    if (!selectedDebtor) return;
    try {
      const response = await fetch(`${API_URL}/debtors/${selectedDebtor.ID}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.status === "success") {
        setShowDeleteModal(false);
        setSelectedDebtor(null);
        fetchDebtors();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to delete debtor");
    }
  };

  const openEditModal = (debtor: Debtor) => {
    setSelectedDebtor(debtor);
    setFormData({
      paskola_id: debtor.PaskolaID.toString(),
      pavadinimas: debtor.Pavadinimas,
      el_pastas: debtor.ElPastas || "",
      tel_nr: debtor.TelNr || "",
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);
  };

  if (loading && debtors.length === 0) {
    return (
      <div className="auth-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 900, margin: "20px auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ margin: 0 }}>Debtors</h1>
          <button onClick={() => navigate("/loan")} className="reg-button" style={{ width: "auto", padding: "10px 20px" }}>
            Back
          </button>
        </div>

        {error && (
          <div style={{ background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "10px", padding: "4px 8px", fontSize: "12px", background: "#721c24", color: "white" }}>
              Close
            </button>
          </div>
        )}

        <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showFilters ? "16px" : "0" }}>
            <h3 style={{ margin: 0 }}>Filters</h3>
            <button onClick={() => setShowFilters(!showFilters)} style={{ width: "auto", padding: "8px 16px", fontSize: "14px" }}>
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>
          
          {showFilters && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px" }}>Name</label>
                  <input type="text" value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="Search by name..." />
                </div>
                <div>
                  <label style={{ fontSize: "12px" }}>Email</label>
                  <input type="text" value={filterEmail} onChange={(e) => setFilterEmail(e.target.value)} placeholder="Search by email..." />
                </div>
                <div>
                  <label style={{ fontSize: "12px" }}>Phone</label>
                  <input type="text" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} placeholder="Search by phone..." />
                </div>
                <div>
                  <label style={{ fontSize: "12px" }}>Loan</label>
                  <select value={filterLoanId} onChange={(e) => setFilterLoanId(e.target.value)}>
                    <option value="">All Loans</option>
                    {loans.map((loan) => (
                      <option key={loan.ID} value={loan.ID}>
                        Loan #{loan.ID} ({formatCurrency(loan.VisaSkolaDouble)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={fetchFilteredDebtors} style={{ flex: 1 }}>Apply Filters</button>
                <button onClick={clearFilters} className="reg-button" style={{ flex: 1 }}>Clear Filters</button>
              </div>
            </>
          )}
        </div>

        <button style={{ marginBottom: "20px", height: "50px" }} onClick={() => setShowAddModal(true)}>
          + Add Debtor
        </button>

        {debtors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)" }}>
              {filterName || filterEmail || filterPhone || filterLoanId
                ? "No debtors found matching the selected filters."
                : "No debtors found. Add a new debtor!"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {debtors.map((debtor) => (
              <div key={debtor.ID} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <h3 style={{ margin: 0 }}>{debtor.Pavadinimas}</h3>
                      <span style={{ background: "var(--accent)", color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" }}>
                        Loan #{debtor.PaskolaID}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px", color: "var(--text-secondary)" }}>
                      {debtor.ElPastas && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Email:</span>
                          <a href={`mailto:${debtor.ElPastas}`} style={{ color: "var(--accent)" }}>{debtor.ElPastas}</a>
                        </div>
                      )}
                      {debtor.TelNr && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>Phone:</span>
                          <a href={`tel:${debtor.TelNr}`} style={{ color: "var(--accent)" }}>{debtor.TelNr}</a>
                        </div>
                      )}
                    </div>
                    {debtor.Paskola && (
                      <div style={{ marginTop: "12px", padding: "10px", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "13px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Loan Balance: </span>
                        <strong style={{ color: "var(--accent)" }}>{formatCurrency(debtor.Paskola.VisaSkolaDouble)}</strong>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button style={{ width: "auto", padding: "8px 16px", fontSize: "14px" }} onClick={() => openEditModal(debtor)}>
                      Edit
                    </button>
                    <button style={{ width: "auto", padding: "8px 16px", fontSize: "14px", background: "#dc3545" }} onClick={() => { setSelectedDebtor(debtor); setShowDeleteModal(true); }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "16px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
          Total: {debtors.length} debtor{debtors.length === 1 ? "" : "s"}
        </div>

        {showAddModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
            <div className="card" style={{ maxWidth: "450px", width: "90%", margin: "20px" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "20px" }}>New Debtor</h2>
              <form onSubmit={handleAddDebtor}>
                <div style={{ marginBottom: "16px" }}>
                  <label>Loan *</label>
                  <select value={formData.paskola_id} onChange={(e) => setFormData({ ...formData, paskola_id: e.target.value })} required>
                    <option value="">Select a loan</option>
                    {loans.map((loan) => (
                      <option key={loan.ID} value={loan.ID}>
                        Loan #{loan.ID} ({formatCurrency(loan.VisaSkolaDouble)})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label>Name *</label>
                  <input type="text" value={formData.pavadinimas} onChange={(e) => setFormData({ ...formData, pavadinimas: e.target.value })} required placeholder="John Doe" />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label>Email</label>
                  <input type="email" value={formData.el_pastas} onChange={(e) => setFormData({ ...formData, el_pastas: e.target.value })} placeholder="john@example.com" />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label>Phone</label>
                  <input type="tel" value={formData.tel_nr} onChange={(e) => setFormData({ ...formData, tel_nr: e.target.value })} placeholder="+1 555 123 4567" />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" style={{ flex: 1 }}>Create</button>
                  <button type="button" className="reg-button" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedDebtor && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowEditModal(false)}>
            <div className="card" style={{ maxWidth: "450px", width: "90%", margin: "20px" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "20px" }}>Edit Debtor</h2>
              <form onSubmit={handleEditDebtor}>
                <div style={{ marginBottom: "16px" }}>
                  <label>Name *</label>
                  <input type="text" value={formData.pavadinimas} onChange={(e) => setFormData({ ...formData, pavadinimas: e.target.value })} required />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label>Email</label>
                  <input type="email" value={formData.el_pastas} onChange={(e) => setFormData({ ...formData, el_pastas: e.target.value })} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label>Phone</label>
                  <input type="tel" value={formData.tel_nr} onChange={(e) => setFormData({ ...formData, tel_nr: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" style={{ flex: 1 }}>Save</button>
                  <button type="button" className="reg-button" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && selectedDebtor && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowDeleteModal(false)}>
            <div className="card" style={{ maxWidth: "400px", width: "90%", margin: "20px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "16px", color: "#dc3545" }}>Confirm Deletion</h2>
              <p style={{ marginBottom: "20px" }}>
                Are you sure you want to delete this debtor?
                <br />
                <strong>{selectedDebtor.Pavadinimas}</strong>
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button style={{ flex: 1, background: "#dc3545" }} onClick={handleDeleteDebtor}>Yes, Delete</button>
                <button className="reg-button" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtorPage;
