import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../_components/Users/UserProvider';

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
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load user");
        const json = await res.json();
        setUser(json.data);
      } catch (err) {
        setError("Unable to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

    useEffect(() => {
        if (user) {
            fetchIncomes();
        }
    }, [user]);
    
    const fetchIncomes = async () => {
        setLoading(true);
        try {
            // Updated URL to match backend change
            const res = await fetch(`/api/incomes/user/${user.id}`, { 
                credentials: 'include',
                method: 'GET',
                headers: { "Content-Type": "application/json" } 
            });
            const data = await res.json();
            // backend may return array or { incomes: [...] }
            const items = (data.incomes ?? data ?? []) as any[];
            // map to typed shape (keep original field names)
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
    
    return (
        <div>
            <h1>Income Page</h1>
            
            <div style={{ marginBottom: '1rem'}}>
                <button onClick={() => navigate('create-income')}>Create Income</button>
            </div>

            {loading && <p>Loading income...</p>}
            {error && <p style={{color: 'red'}}>Error: {error}</p>}

            {incomes.length === 0 ? (<p>No income yet.</p>) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {incomes.map((inc) => (
                        <li key={inc.ID} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{inc.Aprasymas}</div>
                                <div style={{ fontSize: 12, color: "#666" }}>
                                    {new Date(inc.Data).toLocaleDateString()} · {inc.Valiuta}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <div style={{ fontWeight: 700 }}>${inc.Suma.toFixed(2)}</div>
                                <button onClick={() => navigate(`edit-income/${inc.ID}`)}>Edit</button>
                                <button onClick={() => confirmDelete(inc.ID)}>Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>

            )}
            {/* Delete confirmation modal */}
            {deletingId !== null && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 360 }}>
                        <h3>Confirm delete</h3>
                        <p>Are you sure you want to delete this income?</p>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={cancelDelete} disabled={deleting}>Cancel</button>
                            <button onClick={deleteIncome} disabled={deleting}>
                                {deleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}