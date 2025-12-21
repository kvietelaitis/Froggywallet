import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

function BudgetEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [name, setName] = useState("");
    const [income, setIncome] = useState("");
    const [expenses, setExpenses] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Helper to construct URL with query param
    const getUrlWithGroup = () => {
        const groupId = localStorage.getItem('selectedGroupId');
        // Changed to 'grupe_id' to match your BudgetPage fix
        return groupId 
            ? `/api/budgets/${id}?grupe_id=${groupId}` 
            : `/api/budgets/${id}`;
    };

    useEffect(() => {
        const fetchBudget = async () => {
            try {
                const response = await fetch(getUrlWithGroup(), {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    // FIX: Check for lowercase 'biudzetas' first (standard Go Fiber response)
                    const b = data.biudzetas || data.Biudzetas;
                    
                    if (b) {
                        setName(b.Pavadinimas);
                        setIncome(b.PlanuojamosPajamos);
                        setExpenses(b.PlanuojamosIslaidos);
                        setStartDate(b.LaikotarpioPradzia.split('T')[0]);
                        setEndDate(b.LaikotarpioPabaiga.split('T')[0]);
                    } else {
                        setError("Budget data not found in response");
                    }
                } else {
                    setError("Failed to load budget details");
                }
            } catch (err) {
                console.error(err);
                setError("Error fetching budget");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchBudget();
    }, [id]);

    const handleUpdate = async () => {
        const groupId = localStorage.getItem('selectedGroupId');
        
        const payload = {
            pavadinimas: name,
            planuojamos_pajamos: parseFloat(income),
            planuojamos_islaidos: parseFloat(expenses),
            data_nuo: startDate,
            data_iki: endDate,
            grupe_id: groupId ? parseInt(groupId) : null 
        };

        try {
            // FIX: Use getUrlWithGroup() here to include the ID
            const response = await fetch(getUrlWithGroup(), {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                navigate(-1);
            } else {
                const data = await response.json();
                setError(data.error || "Failed to update budget");
            }
        } catch (err) {
            setError("Error updating budget");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this budget?")) return;

        try {
            // FIX: Use getUrlWithGroup() here to include the ID
            const response = await fetch(getUrlWithGroup(), {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                navigate('/budget');
            } else {
                setError("Failed to delete budget");
            }
        } catch (err) {
            setError("Error deleting budget");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1>Edit Budget</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Budget Name:</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Planned Income (€):</label>
                <input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Planned Expenses (€):</label>
                <input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>End Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button onClick={handleUpdate} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                    Save Changes
                </button>
                
                <button onClick={handleDelete} style={{ backgroundColor: '#f44336', color: 'white' }}>
                    Delete Budget
                </button>

                <button onClick={() => navigate(-1)} style={{ backgroundColor: '#ccc' }}>
                Cancel
                </button>
            </div>
        </div>
    );
}

export default BudgetEditPage;