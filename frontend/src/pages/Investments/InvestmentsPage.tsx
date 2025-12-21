import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

type Investment = {
  id: number;
  pavadinimas: string;
  kiekis: number;
  pirkimo_kaina: number;
  pirkimo_data: string;
  SektoriusObj?: {
    pavadinimas: string;
  };
};

type SectorSummary = {
  name: string;
  total: number;
  percent: number;
};

export default function InvestmentsPage() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInvestmentId, setDeleteInvestmentId] = useState<number | null>(null);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [predictionResult, setPredictionResult] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [sectorSummary, setSectorSummary] = useState<SectorSummary[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const confirmDeleteInvestment = async () => {
    if (deleteInvestmentId === null) return;

    try {
      const res = await fetch(`${API_URL}/investments/${deleteInvestmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.status === "success") {
        setInvestments(prev => prev.filter(i => i.id !== deleteInvestmentId));
      } else alert(data.error || "Failed to delete investment");
    } catch {
      alert("Failed to connect to server");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteInvestmentId(null);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/market/update`, { method: "PUT", credentials: "include" }).catch(console.error);
    fetch(`${API_URL}/market/prices`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") setMarketPrices(data.data);
      });

    fetch(`${API_URL}/investments`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const invs: Investment[] = data.data || [];
        setInvestments(invs);
        setLoading(false);

        // Calculate sector diversification
        const totals: Record<string, number> = {};
        let grandTotal = 0;
        invs.forEach(inv => {
          const sector = inv.SektoriusObj?.pavadinimas || "Other";
          const value = inv.kiekis * inv.pirkimo_kaina;
          totals[sector] = (totals[sector] || 0) + value;
          grandTotal += value;
        });
        const summary: SectorSummary[] = Object.entries(totals).map(([name, total]) => ({
          name,
          total,
          percent: grandTotal ? (total / grandTotal) * 100 : 0,
        }));
        setSectorSummary(summary);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="auth-container"><p>Loading...</p></div>;

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 900, margin: "20px auto", width: "100%", textAlign: "center" }}>
        <h1>Investment Diversification</h1>

        {/* --- Sector Summary --- */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
          {sectorSummary.map(s => (
            <div key={s.name} style={{ background: "var(--bg-card)", padding: 10, margin: 5, borderRadius: 8, minWidth: 120 }}>
              <strong>{s.name}</strong>: {s.percent.toFixed(1)}%
            </div>
          ))}
        </div>

        {/* --- Investments Table --- */}
        <table style={{
          whiteSpace: "nowrap",
          width: "100%",
          marginBottom: 20,
          textAlign: "left",
          borderCollapse: "separate",
          borderSpacing: "20px 10px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}>
          <thead>
            <tr>
              <th>Sector</th>
              <th>Name</th>
              <th>Shares</th>
              <th>Price per Share</th>
              <th>Total Price</th>
              <th>Purchase Date</th>
              <th>Profit/Loss</th>
              <th>Predict</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {investments.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: "center", padding: 20 }}>No investments found</td></tr>
            ) : investments.map(inv => {
              const marketPrice = marketPrices[inv.pavadinimas] || 0;
              const totalPrice = inv.kiekis * inv.pirkimo_kaina;
              const profitLoss = (marketPrice - inv.pirkimo_kaina) * inv.kiekis;
              return (
                <tr key={inv.id}>
                  <td>{inv.SektoriusObj?.pavadinimas || "Other"}</td>
                  <td>{inv.pavadinimas}</td>
                  <td>{inv.kiekis}</td>
                  <td>{inv.pirkimo_kaina.toFixed(2)} €</td>
                  <td>{totalPrice.toFixed(2)} €</td>
                  <td>{inv.pirkimo_data.split("T")[0]}</td>
                  <td style={{ color: profitLoss >= 0 ? "green" : "red" }}>{profitLoss.toFixed(2)} €</td>
                  <td
                    onClick={() => {
                      setSelectedInvestment(inv);
                      setIsPredictionModalOpen(true);
                      setPredictionResult(null);
                      setSelectedPeriod(null);
                    }}
                    style={{ cursor: "pointer", fontSize: 18, textAlign: "center" }}
                  >?</td>
                  <td
                    onClick={() => { setDeleteInvestmentId(inv.id); setIsDeleteModalOpen(true); }}
                    style={{ cursor: "pointer", color: "red", fontSize: 18, textAlign: "center" }}>❌</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* --- Add Investment Button --- */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button style={{ height: 50, width: 200 }} onClick={() => navigate("/investments/addinvestments")}>Add Investment</button>
        </div>

        {/* --- Prediction Modal --- */}
        {isPredictionModalOpen && selectedInvestment && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000
          }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 400, maxHeight: "90vh", overflowY: "auto" }}>
              <h3>Predict Investment</h3>
              <p><strong>{selectedInvestment.pavadinimas}</strong></p>

              <p>Select a time period:</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {["1 week", "1 month", "6 months", "1 year"].map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      // Placeholder prediction logic: replace with API call or actual algorithm
                      const prediction = Math.random() > 0.5 ? "Up 📈" : "Down 📉";
                      setPredictionResult(prediction);
                    }}
                    style={{ flex: 1, minWidth: 80, padding: 10 }}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {predictionResult && (
                <p>Prediction for <strong>{selectedPeriod}</strong>: <strong>{predictionResult}</strong></p>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={() => setIsPredictionModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* --- Delete Modal --- */}
        {isDeleteModalOpen && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4000
          }}>
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 8, width: 300 }}>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this investment?</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button onClick={confirmDeleteInvestment}>Delete</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
