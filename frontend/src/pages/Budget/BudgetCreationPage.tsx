import { useState } from "react";
import { useNavigate } from "react-router-dom";

function BudgetCreationPage() {
    const navigate = useNavigate();
    
    // State for form fields
    const [name, setName] = useState("");
    const [income, setIncome] = useState("");
    const [expenses, setExpenses] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setError("");

        // Basic validation
        if (!name || !income || !expenses || !startDate || !endDate) {
            setError("Please fill in all fields");
            return;
        }

        // Get the selected group ID from local storage
        const groupId = localStorage.getItem('selectedGroupId');

        const payload = {
            pavadinimas: name,
            planuojamos_pajamos: parseFloat(income),
            planuojamos_islaidos: parseFloat(expenses),
            data_nuo: startDate,
            data_iki: endDate,
            // Convert string ID to number, or null if not present
            grupe_id: groupId ? parseInt(groupId) : null
        };

        try {
            const response = await fetch('/api/budgets', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Success! Go back to the budget list
                navigate(-1);
            } else {
                const data = await response.json();
                setError(data.error || "Failed to create budget");
            }
        } catch (err) {
            setError("An error occurred while creating the budget");
        }
    };

    return (
        <div>
            <h1>Create New Budget</h1>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Budget Name:
                </label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Summer Vacation"
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Planned Income (€):
                </label>
                <input 
                    type="number" 
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="0.00"
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Planned Expenses (€):
                </label>
                <input 
                    type="number" 
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    placeholder="0.00"
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Start Date:
                </label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    End Date:
                </label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>

            <div style={{ marginTop: '2rem' }}>
                <button onClick={handleSubmit} style={{ marginRight: '1rem' }}>
                    Create Budget
                </button>
                
                <button onClick={() => navigate(-1)} style={{ backgroundColor: '#ccc' }}>
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default BudgetCreationPage;