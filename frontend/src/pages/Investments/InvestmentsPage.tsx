import { useNavigate } from "react-router-dom";

export default function InvestmentsPage() {
  const navigate = useNavigate();
  const fakeExpenses = [
    {
      id: 1,
      sector : "Bonds",
      name: "USA Goverment bonds",
      shares: 3,
      price: 420.69,
      purchaseDate: "2015-09-05",
    },
    {
      id: 2,
      sector : "Tech",
      name: "Tesla",
      shares: 1,
      price: 67.07,
      purchaseDate: "2004-11-01",
    },
  ];

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 690, margin: "40px auto", textAlign: "center" }}>
        <h1>Investment diversification</h1>
        <h2>$✡︎$ 🐸 $✡︎$</h2>
        
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
            </tr>
          </thead>

          <tbody>
            {fakeExpenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.sector}</td>
                <td>{exp.name}</td>
                <td>{exp.shares}</td>
                <td>{exp.price} €</td>
                <td>{exp.purchaseDate}</td>
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
            ))}
          </tbody>
        </table>

        <div style={{ alignContent: "center", width: "100%" }}>
          <button
            style={{
              margin: "10px",
              height: "70px",
              width: "400px",
              maxWidth: "400px",
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
              maxWidth: "400px",
            }}
            onClick={() => navigate("/investments/investmentpredictionstime")}
          >
            Investicijų prognozė
          </button>

        </div>
      </div>
    </div>
  );
}