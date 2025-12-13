import { useNavigate } from "react-router-dom";

function IncomeCreationPage() {
    const navigate = useNavigate();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
    };

    return (
        <div>
            <div>
                <h1>Income Creation Page</h1>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Name:
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Salary"
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
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Date:
                    </label>
                    <input
                        type="date"
                        required
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