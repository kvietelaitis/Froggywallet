import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function BudgetCategoryCreationPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [color, setColor] = useState("#4caf50");
    const [monthlyLimit, setMonthlyLimit] = useState<number | "">("");
    const [notes, setNotes] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/categories`, {
                credentials: 'include',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    color,
                    monthlyLimit: monthlyLimit === "" ? null : monthlyLimit,
                    notes: notes.trim() || null,
                }),
            });

            if (response.ok) {
                navigate(-1);
            } else {
                setError('Failed to create budget category.');
            }
        } catch (err) {
            setError('An error occurred while creating budget category.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div>
                <h1>Create Budget Category</h1>
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Groceries"
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Color:
                    </label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: 64, height: 36, padding: 0, border: "none" }}
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Monthly limit (optional):
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={monthlyLimit}
                        onChange={(e) =>
                            setMonthlyLimit(e.target.value === "" ? "" : parseFloat(e.target.value))
                        }
                        placeholder="0.00"
                    />
                </div>

                <div style={{ marginBottom: 14 }}>
                    <label>
                        Notes (optional):
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        style={{ width: "100%" }}
                    />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Budget Category'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ marginTop: '1rem' }}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BudgetCategoryCreationPage;