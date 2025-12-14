import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function IncomeCreationPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState('');
    const [currency, setCurrency] = useState('USD');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/incomes/create-income`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    amount,
                    date,
                    currency,
                }),
            });

            if (response.ok) {
                navigate(-1);
            } else {
                setError('Failed to create income.');
            }
        } catch (err) {
            setError('An error occurred while creating income.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div>
                <h1>Income Creation Page</h1>
            </div>

            {error && (
                <div
                    role="alert"
                    style={{
                        marginBottom: 12,
                        padding: 10,
                        borderRadius: 6,
                        background: "#ffe6e6",
                        color: "#b00020",
                        border: "1px solid #f5c2c2",
                    }}
                >
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Name:
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Salary"
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Amount:
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                        onChange={(e) => setAmount(parseFloat(e.target.value))}
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Date:
                    </label>
                    <input
                        type="date"
                        required
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div>
                    <label>
                        Currency
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="USD"
                        onChange={(e) => setCurrency(e.target.value)}
                    />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={{ marginTop: '1rem' }}>
                        Create Income
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ marginTop: '1rem' }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default IncomeCreationPage;