import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Budget = {
    id: string;
    name: string;
    spendingAmount: number;
    incomeAmount: number;
    categories: string[];
}

export default function BudgetPage(){
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const navigate = useNavigate();

    const formatCurrency = (amount: number) => 
        new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(amount);


    useEffect(() => {
        (async () => {
            setLoading(true);

            const groupId = localStorage.getItem('selectedGroupId');

            const url = groupId ? `/api/budgets?grupe_id=${groupId}` : '/api/budgets';

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                    'Content-Type': 'application/json',
                },
                });

                if (response.ok) {
                    const data = await response.json();
                    const mappedBudgets = data.budgets.map((b: any) => ({
                        id: b.ID.toString(),
                        name: b.Pavadinimas,
                        incomeAmount: b.PlanuojamosPajamos,
                        spendingAmount: b.PlanuojamosIslaidos,
                        categories: [] // Backend doesn't seem to return categories yet
                    }));

                    setBudgets(mappedBudgets);
                } else {
                    setError('Failed to load budgets');
                }
            } catch (err) {
                setError('An error occurred while fetching budgets');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
<div className="auth-container">
            <div style={{ maxWidth: 900, margin: "20px auto", width: "100%" }}>
                
                <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Budget Management</h1>

                {error && (
                    <div style={{ background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                        {error}
                        <button onClick={() => setError('')} style={{ marginLeft: "10px", padding: "4px 8px", fontSize: "12px", background: "#721c24", color: "white", border: "none", cursor: "pointer" }}>Close</button>
                    </div>
                )}
                
                {/* Top Action Buttons */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
                    <button 
                        style={{ flex: 1, minWidth: "150px", height: "50px" }} 
                        onClick={() => navigate('create-budget')}
                    >
                        + Create Budget
                    </button>
                    <button 
                        style={{ flex: 1, minWidth: "150px", height: "50px" }} 
                        onClick={() => navigate('add-category')} 
                        className="reg-button"
                    >
                        All Categories
                    </button>
                </div>

                {/* Empty State */}
                {budgets.length === 0 && !loading && !error ? (
                    <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                            No budgets found for this group. 
                        </p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Create a new budget to get started!</p>
                    </div>
                ) : (
                    /* Budget List */
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {budgets.map((budget) => {
                            const netBalance = budget.incomeAmount - budget.spendingAmount;
                            
                            return (
                                <div key={budget.id} className="card" style={{ padding: "20px" }}>
                                    
                                    {/* Card Header */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                        <div>
                                            <h3 style={{ margin: "0 0 8px 0" }}>{budget.name}</h3>
                                            <span style={{ background: "#28a745", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>
                                                Active
                                            </span>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontSize: "24px", fontWeight: "bold", color: netBalance >= 0 ? "var(--accent)" : "#dc3545" }}>
                                                {formatCurrency(netBalance)}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Net Balance</div>
                                        </div>
                                    </div>

                                    {/* Card Details Grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                                        <div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Planned Income</div>
                                            <div style={{ fontWeight: "500", color: "#28a745" }}>{formatCurrency(budget.incomeAmount)}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Planned Expenses</div>
                                            <div style={{ fontWeight: "500", color: "#dc3545" }}>{formatCurrency(budget.spendingAmount)}</div>
                                        </div>
                                        {/* You can add more stats here like Start Date/End Date if you map them */}
                                    </div>

                                    {/* Card Actions */}
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                                        <button 
                                            style={{ flex: 1, minWidth: "100px", padding: "10px" }} 
                                            onClick={() => navigate(`edit-budget/${budget.id}`)}
                                        >
                                            Edit / Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
} 