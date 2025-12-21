import React, { useState } from "react";

export default function AddInvestmentsPage() {
  const today = new Date().toISOString().split("T")[0];

  const [shares, setShares] = useState("");
  const [sector, setSector] = useState("");
  const [name, setName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const sectors = [
    { id: 1, pavadinimas: "Technology" },
    { id: 2, pavadinimas: "Bonds" },
    { id: 3, pavadinimas: "Real Estate" },
    { id: 4, pavadinimas: "Stocks" },
    { id: 6, pavadinimas: "Commodities" },
    { id: 7, pavadinimas: "Mutual Funds" },
    { id: 8, pavadinimas: "Cryptocurrencies" },
    { id: 9, pavadinimas: "Other" },
  ];

  const marketNames = [
    "AAPL","MSFT","GOOGL","AMZN","TSLA","META","NFLX","NVDA","INTC","AMD",
    "BABA","ORCL","IBM","ADBE","PYPL","CRM","UBER","LYFT","SHOP","SQ",
    "TWTR","SNAP","SPOT","ROKU","ZM","DOCU","COIN","PINS","BIDU","JD",
    "TCEHY","V","MA","GS","JPM","BAC","WFC","C","TSM","ASML",
    "SAP","SNE","SONY","TM","GM","F","NIO","LI","RIVN"
  ];

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

  const handleAddInvestment = async () => {
    if (!name || !shares || !price || !purchaseDate || !sector) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/investments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ send cookie automatically
        body: JSON.stringify({
          pavadinimas: name,
          kiekis: Number(shares),
          pirkimo_kaina: Number(price),
          pirkimo_data: purchaseDate,
          sektorius_id: Number(sector),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Investment added successfully!");
        setName("");
        setShares("");
        setPrice("");
        setSector("");
        setPurchaseDate(today);
      } else if (response.status === 401) {
        alert("You are not logged in. Please log in again.");
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ maxWidth: 420, margin: "40px auto", textAlign: "center" }}>
        <h1>Add Investment</h1>

        <p style={{ textAlign: "left" }}>Investment sector</p>
        <select value={sector} onChange={(e) => setSector(e.target.value)}>
          <option value="">Choose sector</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>{s.pavadinimas}</option>
          ))}
        </select>

        <p style={{ textAlign: "left" }}>Investment name</p>
        <select value={name} onChange={(e) => setName(e.target.value)}>
          <option value="">Choose name</option>
          {marketNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <p style={{ textAlign: "left" }}>Shares</p>
        <input type="number" min="0" step="1" value={shares} onChange={(e) => setShares(e.target.value)} />

        <p style={{ textAlign: "left" }}>Price</p>
        <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />

        <p style={{ textAlign: "left" }}>Purchase date</p>
        <input type="date" max={today} value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />

        <button
          onClick={handleAddInvestment}
          disabled={loading}
          style={{ width: "100%", marginTop: "25px", cursor: "pointer" }}
        >
          {loading ? "Adding..." : "Add Investment"}
        </button>
      </div>
    </div>
  );
}
