import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface Loan {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  VisaSkolaDouble: number;
  MokejimoKiekis: number;
  KitasMokejimas: string;
  PaskutinisMokejimas: string;
  Pajamos: number;
  Skolininkai: Debtor[];
}

export interface Debtor {
  ID: number;
  PaskolaID: number;
  Pavadinimas: string;
  ElPastas: string;
  TelNr: string;
}

interface UpcomingPayment {
  loanId: number;
  amount: number;
  dueDate: string;
  daysUntil: number;
}

interface MonthlyCalculation {
  menesine_imoka: number;
  menesiai: number;
  visa_mokama_suma: number;
  palukanu_suma: number;
  likusi_skola: number;
}

const LoanPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [calculation, setCalculation] = useState<MonthlyCalculation | null>(null);
  const [newLoan, setNewLoan] = useState({ visa_skola: "", mokejimo_kiekis: "", kitas_mokejimas: "", pajamos: "0" });
  const [payAmount, setPayAmount] = useState("");
  const [calculateMonths, setCalculateMonths] = useState("12");
  const navigate = useNavigate();

  useEffect(() => { fetchLoans(); fetchUpcomingPayments(); }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/loans`);
      const data = await response.json();
      if (data.status === "success") setLoans(data.data || []);
      else setError(data.error || "Failed to fetch loans");
    } catch { setError("Failed to connect to server"); }
    finally { setLoading(false); }
  };

  const fetchUpcomingPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/loans/upcoming?days=7`);
      const data = await response.json();
      if (data.status === "success" && data.data) {
        const payments: UpcomingPayment[] = data.data.map((loan: Loan) => {
          const dueDate = new Date(loan.KitasMokejimas);
          const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return { loanId: loan.ID, amount: loan.MokejimoKiekis, dueDate: loan.KitasMokejimas, daysUntil: diffDays };
        });
        setUpcomingPayments(payments);
      }
    } catch { console.error("Failed to fetch upcoming payments"); }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/loans`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visa_skola: parseFloat(newLoan.visa_skola), mokejimo_kiekis: parseFloat(newLoan.mokejimo_kiekis), kitas_mokejimas: newLoan.kitas_mokejimas, pajamos: parseFloat(newLoan.pajamos) }),
      });
      const data = await response.json();
      if (data.status === "success") { setShowAddModal(false); setNewLoan({ visa_skola: "", mokejimo_kiekis: "", kitas_mokejimas: "", pajamos: "0" }); fetchLoans(); fetchUpcomingPayments(); }
      else setError(data.error);
    } catch { setError("Failed to create loan"); }
  };

  const handleDeleteLoan = async () => {
    if (!selectedLoan) return;
    try {
      const response = await fetch(`${API_URL}/loans/${selectedLoan.ID}`, { method: "DELETE" });
      const data = await response.json();
      if (data.status === "success") { setShowDeleteModal(false); setSelectedLoan(null); fetchLoans(); fetchUpcomingPayments(); }
      else setError(data.error);
    } catch { setError("Failed to delete loan"); }
  };

  const handlePayLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      const response = await fetch(`${API_URL}/loans/${selectedLoan.ID}/pay`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suma: parseFloat(payAmount) }),
      });
      const data = await response.json();
      if (data.status === "success") { setShowPayModal(false); setSelectedLoan(null); setPayAmount(""); fetchLoans(); fetchUpcomingPayments(); }
      else setError(data.error);
    } catch { setError("Failed to process payment"); }
  };

  const handleCalculate = async () => {
    if (!selectedLoan) return;
    try {
      const response = await fetch(`${API_URL}/loans/${selectedLoan.ID}/calculate?menesiai=${calculateMonths}`);
      const data = await response.json();
      if (data.status === "success") setCalculation(data.data);
      else setError(data.error);
    } catch { setError("Failed to calculate"); }
  };

  const formatDate = (dateString: string) => (!dateString || dateString === "0001-01-01T00:00:00Z") ? "None" : new Date(dateString).toLocaleDateString("en-US");
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);

  if (loading) return <div className="auth-container"><p>Loading...</p></div>;

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 900, margin: "20px auto", width: "100%" }}>
        {upcomingPayments.length > 0 && (
          <div style={{ background: "linear-gradient(135deg, #fff3cd, #ffeeba)", border: "1px solid #ffc107", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
            <h3 style={{ color: "#856404", margin: "0 0 12px 0" }}>Upcoming Payments</h3>
            {upcomingPayments.map((p) => (
              <div key={p.loanId} style={{ background: "rgba(255,255,255,0.7)", padding: "10px 14px", borderRadius: "8px", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#856404" }}>Loan #{p.loanId}: {formatCurrency(p.amount)}</span>
                <span style={{ color: p.daysUntil <= 3 ? "#dc3545" : "#856404", fontWeight: p.daysUntil <= 3 ? "bold" : "normal" }}>
                  {p.daysUntil === 0 ? "Today!" : p.daysUntil === 1 ? "Tomorrow" : `In ${p.daysUntil} days`}
                </span>
              </div>
            ))}
          </div>
        )}

        <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Loan Management</h1>

        {error && (
          <div style={{ background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: "10px", padding: "4px 8px", fontSize: "12px", background: "#721c24", color: "white" }}>Close</button>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
          <button style={{ flex: 1, minWidth: "150px", height: "50px" }} onClick={() => setShowAddModal(true)}>+ Add Loan</button>
          <button style={{ flex: 1, minWidth: "150px", height: "50px" }} onClick={() => navigate("debtor")} className="reg-button">Debtors</button>
        </div>

        {loans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)" }}>No loans found. Add a new loan!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {loans.map((loan) => (
              <div key={loan.ID} className="card" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 8px 0" }}>Loan #{loan.ID}</h3>
                    <span style={{ background: loan.VisaSkolaDouble > 0 ? "#ffc107" : "#28a745", color: loan.VisaSkolaDouble > 0 ? "#856404" : "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
                      {loan.VisaSkolaDouble > 0 ? "Active" : "Paid Off"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--accent)" }}>{formatCurrency(loan.VisaSkolaDouble)}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Remaining Balance</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                  <div><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Monthly Payment</div><div style={{ fontWeight: "500" }}>{formatCurrency(loan.MokejimoKiekis)}</div></div>
                  <div><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Next Payment</div><div style={{ fontWeight: "500" }}>{formatDate(loan.KitasMokejimas)}</div></div>
                  <div><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Last Payment</div><div style={{ fontWeight: "500" }}>{formatDate(loan.PaskutinisMokejimas)}</div></div>
                  <div><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Interest Rate</div><div style={{ fontWeight: "500" }}>{loan.Pajamos}%</div></div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                  <button style={{ flex: 1, minWidth: "100px", padding: "10px" }} onClick={() => { setSelectedLoan(loan); setShowProgressModal(true); }}>Progress</button>
                  <button style={{ flex: 1, minWidth: "100px", padding: "10px" }} onClick={() => { setSelectedLoan(loan); setShowCalculateModal(true); setCalculation(null); }}>Calculate</button>
                  <button style={{ flex: 1, minWidth: "100px", padding: "10px" }} onClick={() => { setSelectedLoan(loan); setShowPayModal(true); }} disabled={loan.VisaSkolaDouble <= 0}>Pay</button>
                  <button style={{ flex: 1, minWidth: "100px", padding: "10px", background: "#dc3545" }} onClick={() => { setSelectedLoan(loan); setShowDeleteModal(true); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAddModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowAddModal(false)}>
            <div className="card" style={{ maxWidth: "450px", width: "90%", margin: "20px" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "20px" }}>New Loan</h2>
              <form onSubmit={handleAddLoan}>
                <div style={{ marginBottom: "16px" }}><label>Total Debt (EUR)</label><input type="number" step="0.01" value={newLoan.visa_skola} onChange={(e) => setNewLoan({ ...newLoan, visa_skola: e.target.value })} required placeholder="10000.00" /></div>
                <div style={{ marginBottom: "16px" }}><label>Monthly Payment (EUR)</label><input type="number" step="0.01" value={newLoan.mokejimo_kiekis} onChange={(e) => setNewLoan({ ...newLoan, mokejimo_kiekis: e.target.value })} required placeholder="500.00" /></div>
                <div style={{ marginBottom: "16px" }}><label>Next Payment Date</label><input type="date" value={newLoan.kitas_mokejimas} onChange={(e) => setNewLoan({ ...newLoan, kitas_mokejimas: e.target.value })} required /></div>
                <div style={{ marginBottom: "20px" }}><label>Annual Interest Rate (%)</label><input type="number" step="0.01" value={newLoan.pajamos} onChange={(e) => setNewLoan({ ...newLoan, pajamos: e.target.value })} placeholder="5.5" /></div>
                <div style={{ display: "flex", gap: "10px" }}><button type="submit" style={{ flex: 1 }}>Create</button><button type="button" className="reg-button" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button></div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && selectedLoan && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowDeleteModal(false)}>
            <div className="card" style={{ maxWidth: "400px", width: "90%", margin: "20px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "16px", color: "#dc3545" }}>Confirm Deletion</h2>
              <p style={{ marginBottom: "20px" }}>Are you sure you want to delete Loan #{selectedLoan.ID}?<br /><strong>Remaining Balance: {formatCurrency(selectedLoan.VisaSkolaDouble)}</strong></p>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px" }}>This action cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px" }}><button style={{ flex: 1, background: "#dc3545" }} onClick={handleDeleteLoan}>Yes, Delete</button><button className="reg-button" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>Cancel</button></div>
            </div>
          </div>
        )}

        {showPayModal && selectedLoan && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowPayModal(false)}>
            <div className="card" style={{ maxWidth: "400px", width: "90%", margin: "20px" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "20px" }}>Make Payment</h2>
              <p style={{ marginBottom: "16px" }}>Loan #{selectedLoan.ID}<br /><strong>Remaining Balance: {formatCurrency(selectedLoan.VisaSkolaDouble)}</strong></p>
              <form onSubmit={handlePayLoan}>
                <div style={{ marginBottom: "20px" }}>
                  <label>Payment Amount (EUR)</label>
                  <input type="number" step="0.01" min="0.01" max={selectedLoan.VisaSkolaDouble} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
                  <div style={{ marginTop: "8px" }}>
                    <button type="button" style={{ padding: "6px 12px", fontSize: "12px", marginRight: "8px" }} onClick={() => setPayAmount(selectedLoan.MokejimoKiekis.toString())}>Monthly Payment</button>
                    <button type="button" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setPayAmount(selectedLoan.VisaSkolaDouble.toString())}>Full Amount</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}><button type="submit" style={{ flex: 1 }}>Pay</button><button type="button" className="reg-button" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Cancel</button></div>
              </form>
            </div>
          </div>
        )}

        {showCalculateModal && selectedLoan && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowCalculateModal(false)}>
            <div className="card" style={{ maxWidth: "450px", width: "90%", margin: "20px" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "20px" }}>Monthly Payment Calculator</h2>
              <p style={{ marginBottom: "16px" }}>Loan #{selectedLoan.ID}<br /><strong>Remaining Balance: {formatCurrency(selectedLoan.VisaSkolaDouble)}</strong><br />Interest Rate: {selectedLoan.Pajamos}%</p>
              <div style={{ marginBottom: "20px" }}>
                <label>Payment Period (months)</label>
                <input type="number" min="1" max="360" value={calculateMonths} onChange={(e) => setCalculateMonths(e.target.value)} />
                <button type="button" style={{ marginTop: "10px" }} onClick={handleCalculate}>Calculate</button>
              </div>
              {calculation && (
                <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Monthly Payment:</span><strong style={{ color: "var(--accent)" }}>{formatCurrency(calculation.menesine_imoka)}</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Number of Payments:</span><span>{calculation.menesiai} months</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Total Amount:</span><span>{formatCurrency(calculation.visa_mokama_suma)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Interest Amount:</span><span style={{ color: "#dc3545" }}>{formatCurrency(calculation.palukanu_suma)}</span></div>
                </div>
              )}
              <button className="reg-button" onClick={() => setShowCalculateModal(false)}>Close</button>
            </div>
          </div>
        )}

        {showProgressModal && selectedLoan && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowProgressModal(false)}>
            <div className="card" style={{ maxWidth: "450px", width: "90%", margin: "20px" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "20px" }}>Repayment Progress</h2>
              <p style={{ marginBottom: "20px" }}>Loan #{selectedLoan.ID}</p>
              <div style={{ background: "var(--bg-secondary)", borderRadius: "10px", height: "24px", overflow: "hidden", marginBottom: "16px" }}>
                <div style={{ background: "linear-gradient(90deg, var(--accent), var(--accent-light))", height: "100%", width: `${Math.max(5, 100 - (selectedLoan.VisaSkolaDouble / (selectedLoan.VisaSkolaDouble + selectedLoan.MokejimoKiekis * 6)) * 100)}%`, borderRadius: "10px" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", textAlign: "center" }}><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Remaining Balance</div><div style={{ fontSize: "20px", fontWeight: "bold", color: "#dc3545" }}>{formatCurrency(selectedLoan.VisaSkolaDouble)}</div></div>
                <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", textAlign: "center" }}><div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Monthly Payment</div><div style={{ fontSize: "20px", fontWeight: "bold", color: "var(--accent)" }}>{formatCurrency(selectedLoan.MokejimoKiekis)}</div></div>
              </div>
              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Next Payment:</span><strong>{formatDate(selectedLoan.KitasMokejimas)}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span>Last Payment:</span><span>{formatDate(selectedLoan.PaskutinisMokejimas)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Interest Rate:</span><span>{selectedLoan.Pajamos}%</span></div>
              </div>
              {selectedLoan.Skolininkai && selectedLoan.Skolininkai.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h4 style={{ marginBottom: "8px" }}>Debtors ({selectedLoan.Skolininkai.length})</h4>
                  {selectedLoan.Skolininkai.map((d) => <div key={d.ID} style={{ background: "var(--bg-secondary)", padding: "8px 12px", borderRadius: "6px", marginBottom: "4px" }}>{d.Pavadinimas}</div>)}
                </div>
              )}
              <button className="reg-button" onClick={() => setShowProgressModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanPage;
