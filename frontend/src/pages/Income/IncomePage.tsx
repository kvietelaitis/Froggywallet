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
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchIncomes(); }, []);

    const fetchIncomes = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/incomes", { headers: { "Content-Type": "application/json" } });
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
                            </div>
                        </li>
                    ))}
                </ul>

            )}
        </div>
    );
}