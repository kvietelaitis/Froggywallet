import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useParams } from "react-router-dom";

const today = new Date();
const earliestAllowed = new Date(2000, 0, 1); // example min date

function IncomeEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState<Date | null>(today);
    const [currency, setCurrency] = useState('USD');

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/incomes/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setName(data.income.Aprasymas || '');
                setAmount(data.income.Suma || 0);
                setDate(data.income.Data ? new Date(data.income.Data) : null);
                setCurrency(data.income.Valiuta || 'USD');
            } else {
                setError('Failed to load income data.');
            }
        } catch (err) {
            setError('An error occurred while loading income data.');
        } finally {
            setLoading(false);
        }
    };

const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!id) {
            setError('Missing income id');
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`/api/incomes/${id}`, {
                method: 'PUT',
                 credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    name,
                    amount: amount === '' ? 0 : amount,
                    date: date ? date.toISOString().split('T')[0] : '',
                    currency,
                }),
            });

            if (response.ok) {
                navigate(-1);
            } else {
                setError('Failed to update income.');
            }
        } catch (err) {
            setError('An error occurred while updating income.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Income Edit Page</h1>

           <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 10 }}>
                    <label>
                        Name:
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Salary"
                        value={name}
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
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value))}
                    />
                </div>

                <div style={{ marginBottom: 10 }}>
                    <label>
                        Date:
                    </label>
                    <div>
                        <DatePicker
                            selected={date}
                            onChange={(d: Date | null) => setDate(d)}
                            minDate={earliestAllowed}
                            maxDate={today}
                            placeholderText="Select date"
                            dateFormat="yyyy-MM-dd"
                            disabledKeyboardNavigation
                            renderDayContents={(day, dateObj) => (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <span>{day}</span>
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div>
                    <label>
                        Currency
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="EUR"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    />
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit" style={{ marginTop: '1rem' }}>
                        Update Income
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

export default IncomeEditPage;