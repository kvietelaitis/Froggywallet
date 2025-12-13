import { useNavigate } from "react-router-dom";

export default function ExpensesPage() {
  const navigate = useNavigate();

  const fakeExpenses = [
    {
      id: 1,
      name: "Groceries",
      amount: 45.99,
      date: "2025-09-10",
      paymentType: "Card",
      comment : "Weekly shopping",
      category: "Food",
    },
    {
      id: 2,
      name: "Electricity Bill",
      amount: 60.5,
      date: "2025-09-05",
      paymentType: "Cash",
      comment : "Monthly payment",
      reccurence: "Monthly",
      category: "Utilities",
    },
  ];

  return (
    <div className="auth-container">
      <div style={{ margin: "40px auto", textAlign: "center" }}>
        <h1>Expenses</h1>

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
              <th>Payment</th>
              <th>Category</th>
              <th>Comment</th>
              <th>Reccurence</th>
            </tr>
          </thead>

          <tbody>
            {fakeExpenses.map((exp) => (
              <tr key={exp.id}>
                <td>{exp.name}</td>
                <td>{exp.amount} €</td>
                <td>{exp.date}</td>
                <td>{exp.paymentType}</td>
                <td>{exp.category}</td>
                <td>{exp.comment}</td>
                <td>{exp.reccurence}</td>
                <td>
                  <span
                    onClick={() => navigate("/expenses/editexpenses")}
                    style={{ cursor: "pointer", fontSize: "18px" }}
                    title="Edit"
                  >
                    ✏️
                  </span>
                </td>
                <td>
                  <span
                    onClick={() => navigate("/expenses/deleteexpenses")}
                    style={{ cursor: "pointer", fontSize: "18px" }}
                    title="Delete"
                  >
                    ❌
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
            onClick={() => navigate("/expenses/addexpenses")}
          >
            Add
          </button>

          <button
            style={{
              margin: "10px",
              height: "70px",
              width: "400px",
              maxWidth: "400px",
            }}
            onClick={() => navigate("/expenses/addperiodicalexpenses")}
          >
            Add reccuring expenses
          </button>

          <button
            style={{
              margin: "10px",
              height: "70px",
              width: "400px",
              maxWidth: "400px",
            }}
            onClick={() => navigate("/expenses/compareexpenses")}
          >
            Compare
          </button>

          <button
            style={{
              margin: "10px",
              height: "70px",
              width: "400px",
              maxWidth: "400px",
            }}
            onClick={() => navigate("/expenses/groupexpenses")}
          >
            Group
          </button>
        </div>
      </div>
    </div>
  );
}
