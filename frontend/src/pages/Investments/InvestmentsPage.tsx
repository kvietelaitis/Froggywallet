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

export default function InvestmentsPage() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  useEffect(() => {
    fetch(`${API_URL}/investments`)
      .then((res) => res.json())
      .then((data) => {
        setInvestments(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load investments:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 690, margin: "40px auto", textAlign: "center" }}>
        <h1>Investment diversification</h1>

        {loading ? (
          <p>Loading investments...</p>
        ) : (
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
                <th>Sector</th>
                <th>Name</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Purchase date</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {investments?.length ? (
                investments.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.SektoriusObj?.pavadinimas || "—"}</td>
                    <td>{inv.pavadinimas || "—"}</td>
                    <td>{inv.kiekis ?? "—"}</td>
                    <td>{inv.pirkimo_kaina ?? "—"} €</td>
                    <td>{inv.pirkimo_data?.split("T")[0] || "—"}</td>
                    <td>
                      <span
                        onClick={() => navigate("/investments/profitlosstimepicker")}
                        style={{ cursor: "pointer", fontSize: "18px" }}
                        title="Profit/Loss"
                      >
                        +/-
                      </span>
                    </td>
                    <td>
                      <span
                        onClick={() => navigate("/investments/deleteinvestments")}
                        style={{ cursor: "pointer", fontSize: "18px" }}
                        title="Delete"
                      >
                        X
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No investments found</td>
                </tr>
              )}
            </tbody>


          </table>
        )}

        <div style={{ alignContent: "center", width: "100%" }}>
          <button
            style={{
              margin: "10px",
              height: "70px",
              width: "400px",
            }}
            onClick={() => navigate("/investments/addinvestments")}
          >
            Pridėti investiciją
          </button>

          <button
            style={{
              margin: "10px",
              height: "70px",
              width: "400px",
            }}
            onClick={() =>
              navigate("/investments/investmentpredictionstime")
            }
          >
            Investicijų prognozė
          </button>
        </div>
      </div>
    </div>
  );
}
