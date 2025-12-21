import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Income = {
    ID: number;
    Aprasymas: string;
    Suma: number;
    Data: string; // ISO string from backend
    Valiuta?: string;
};

export default function IncomePage(){
    const [user, setUser] = useState<any>(null);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Start true
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

    // Helper for currency formatting
    const formatCurrency = (amount: number, currency: string = 'EUR') => 
        new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(amount);

    // 1. Fetch User
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load user");
                const json = await res.json();
                setUser(json.data);
            } catch (err) {
                setError("Unable to load user");
                setLoading(false);
            }
        })();
    }, []);

    // 2. Fetch Incomes when User is ready
    useEffect(() => {
        if (user) {
            fetchIncomes();
        }
    }, [user]);
    
    const fetchIncomes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/incomes/user/${user.id}`, { 
                credentials: 'include',
                method: 'GET',
                headers: { "Content-Type": "application/json" } 
            });
            const data = await res.json();
            const items = (data.incomes ?? data ?? []) as any[];
            
            setIncomes(items.map(i => ({
                ID: i.ID,
                Aprasymas: i.Aprasymas ?? "",
                Suma: i.Suma ?? 0,
                Data: i.Data ?? i.IvedimoData ?? "",
                Valiuta: i.Valiuta ?? "EUR",
            })));
        } catch (err) {
            setError('An error occurred while fetching incomes');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: number) => {
        setDeletingId(id);
    };
    
    const cancelDelete = () => {
        setDeletingId(null);
        setDeleting(false);
    };
    
    const deleteIncome = async () => {
        if (!deletingId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/incomes/${deletingId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error('Delete failed');
            setIncomes(prev => prev.filter(i => i.ID !== deletingId));
            cancelDelete();
        } catch (err) {
            setError('Failed to delete income');
            setDeleting(false);
        }
    };
    
    if (loading && !user) return <div className="auth-container"><p>Loading...</p></div>;

    return (
        <div className="auth-container">
            <div style={{ maxWidth: 900, margin: "20px auto", width: "100%" }}>
                
                <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Income Management</h1>

                {error && (
                    <div style={{ background: "#f8d7da", color: "#721c24", padding: "12px", borderRadius: "8px", marginBottom: "16px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{error}</span>
                        <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: '#721c24', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                )}
                
                {/* Top Action Buttons */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
                    <button 
                        style={{ flex: 1, minWidth: "150px", height: "50px" }} 
                        onClick={() => navigate('create-income')}
                    >
                        + Add Income
                    </button>
                </div>

                {/* Empty State */}
                {incomes.length === 0 && !loading ? (
                    <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                            You haven't added any income records yet.
                        </p>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Track your earnings by clicking the button above.</p>
                    </div>
                ) : (
                    /* Income List */
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {incomes.map((inc) => (
                            <div key={inc.ID} className="card" style={{ padding: "20px" }}>
                                
                                {/* Card Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 8px 0" }}>{inc.Aprasymas}</h3>
                                        <span style={{ background: "#e6f4ea", color: "#1e7e34", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                                            Received
                                        </span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "24px", fontWeight: "bold", color: "#28a745" }}>
                                            {formatCurrency(inc.Suma, inc.Valiuta)}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Details Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Date</div>
                                        <div style={{ fontWeight: "500" }}>{new Date(inc.Data).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Currency</div>
                                        <div style={{ fontWeight: "500" }}>{inc.Valiuta}</div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
                                    <button 
                                        style={{ flex: 1, minWidth: "100px", padding: "10px" }} 
                                        onClick={() => navigate(`edit-income/${inc.ID}`)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        style={{ flex: 1, minWidth: "100px", padding: "10px", backgroundColor: "#dc3545", color: "white" }} 
                                        onClick={() => confirmDelete(inc.ID)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {deletingId !== null && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'var(--bg-card)', padding: "24px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
                        <p style={{ color: "var(--text-secondary)" }}>Are you sure you want to delete this income record? This action cannot be undone.</p>
                        
                        {error && <div style={{ color: '#dc3545', marginBottom: "16px", fontSize: "0.9rem" }}>{error}</div>}

                        <div style={{ display: 'flex', gap: "12px", justifyContent: 'flex-end', marginTop: "24px" }}>
                            <button 
                                onClick={cancelDelete} 
                                disabled={deleting}
                                style={{ backgroundColor: "transparent", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={deleteIncome} 
                                disabled={deleting}
                                style={{ backgroundColor: "#dc3545", color: "white" }}
                            >
                        {deleting ? 'Deleting...' : 'Delete Record'}
                    </button>
                </div>
            </div>
        </div>
        )}
    </div>
);
}