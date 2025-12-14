import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface Expense {
  ID: number;
  Suma: number;
  Data: string;
  Kategorija?: {
    ID: number;
    Pavadinimas: string;
  };
}

interface Category {
  ID: number;
  Pavadinimas: string;
}

export default function CompareExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [group1Start, setGroup1Start] = useState("");
  const [group1End, setGroup1End] = useState("");
  const [group1Category, setGroup1Category] = useState<string | number>("all");

  const [group2Start, setGroup2Start] = useState("");
  const [group2End, setGroup2End] = useState("");
  const [group2Category, setGroup2Category] = useState<string | number>("all");

  const [sum1, setSum1] = useState<number | null>(null);
  const [sum2, setSum2] = useState<number | null>(null);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/expenses`);
      const data = await res.json();
      if (data.status === "success") {
        setExpenses(data.data || []);
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

  const calculateSums = () => {
    const parseDate = (d: string) => new Date(d);

    const sumGroup = (
      start: string,
      end: string,
      category: string | number
    ): number => {
      const categoryIdNum =
        category === "no" || category === "all" ? category : Number(category);

      return expenses
        .filter((e) => {
          const date = new Date(e.Data);
          const dateCheck =
            (!start || date >= new Date(start)) && (!end || date <= new Date(end));

          let categoryCheck = true;
          if (categoryIdNum === "no") {
            categoryCheck = !e.Kategorija;
          } else if (categoryIdNum === "all") {
            categoryCheck = true;
          } else {
            categoryCheck = e.Kategorija?.ID === categoryIdNum;
          }

          return dateCheck && categoryCheck;
        })
        .reduce((acc, e) => acc + e.Suma, 0);
    };

    setSum1(sumGroup(group1Start, group1End, group1Category));
    setSum2(sumGroup(group2Start, group2End, group2Category));
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
      <div style={{ maxWidth: 500, margin: "40px auto", textAlign: "center" }}>
        <h1>Compare Expenses</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 10,
          }}
        >
          {/* Group 1 */}
          <div style={{ flex: 1 }}>
            <h3>Group 1</h3>
            <label>Start Date:</label>
            <input
              type="date"
              value={group1Start}
              onChange={(e) => setGroup1Start(e.target.value)}
            />
            <label>End Date:</label>
            <input
              type="date"
              value={group1End}
              onChange={(e) => setGroup1End(e.target.value)}
            />
            <label>Category:</label>
            <select
              value={group1Category}
              onChange={(e) => setGroup1Category(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="no">No Category</option>
              {categories.map((cat) => (
                <option key={cat.ID} value={cat.ID}>
                  {cat.Pavadinimas}
                </option>
              ))}
            </select>
          </div>

          {/* Group 2 */}
          <div style={{ flex: 1 }}>
            <h3>Group 2</h3>
            <label>Start Date:</label>
            <input
              type="date"
              value={group2Start}
              onChange={(e) => setGroup2Start(e.target.value)}
            />
            <label>End Date:</label>
            <input
              type="date"
              value={group2End}
              onChange={(e) => setGroup2End(e.target.value)}
            />
            <label>Category:</label>
            <select
              value={group2Category}
              onChange={(e) => setGroup2Category(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="no">No Category</option>
              {categories.map((cat) => (
                <option key={cat.ID} value={cat.ID}>
                  {cat.Pavadinimas}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={calculateSums} style={{ marginBottom: 20 }}>
          Compare
        </button>

        {(sum1 !== null || sum2 !== null) && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 50,
              fontSize: 18,
              marginTop: 20,
            }}
          >
            <div>
              <strong>Group 1 Sum:</strong> {sum1?.toFixed(2) || 0} €
            </div>
            <div>
              <strong>Group 2 Sum:</strong> {sum2?.toFixed(2) || 0} €
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
