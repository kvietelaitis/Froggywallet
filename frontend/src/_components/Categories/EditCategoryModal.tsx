import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    categoryId?: number;
    onUpdated?: (category: any) => void;
}

export default function EditCategoryModal({ open, categoryId, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [categoryName, setCategoryName] = useState("");

    useEffect(() => {
        if (!open || !categoryId) return;
        (async () => {
            try {
                const res = await fetch(`/api/categories/${categoryId}`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch category');
                const json = await res.json();
                const category = json.data || json;
                setCategoryName(category.Pavadinimas ?? '');
            } catch {
                setError('Unable to load category');
            }
        })();
    }, [open, categoryId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!categoryId || !categoryName.trim()) {
            setError("Category name is required");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    pavadinimas: categoryName.trim()
                }),
            });

            if (response.ok) {
                const json = await response.json();
                onUpdated && onUpdated(json);
                onClose();
            } else {
                const json = await response.json();
                setError(json.error || 'Failed to update category');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '16px'}}>
                <h2 style={{margin:0}}>Edit Category</h2>
                <button onClick={onClose} style={{
                    background:'transparent', 
                    border:'none', 
                    fontSize:18, 
                    cursor:'pointer', 
                    padding:0,
                    width: 'auto',
                    height: 'auto',
                    minWidth: 'auto',
                    lineHeight: 1
                }}>✕</button>
            </div>

            {error && <div className="error-message" style={{ marginBottom: 12, color: 'red' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <label style={{ display: 'block', marginTop: 12, marginBottom: 8 }}>Category Name:</label>
                <input
                    type="text"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                    style={{ padding: '8px 10px', marginBottom: 18, borderRadius: 6, border: '1px solid #ddd', width: '100%' }}
                    placeholder="Enter category name"
                />

                <div style={{display:'flex', gap:'.5rem', marginTop:'1.25rem'}}>
                    <button type="button" className="reg-button" onClick={onClose} style={{flex:1, padding: '10px 12px'}}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{flex:1, padding: '10px 12px'}} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}