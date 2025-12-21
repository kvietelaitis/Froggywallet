import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: (user: any) => void;
}

type Member = {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    role?: string;
}

export default function CreateGroupModal({ open, onClose, onCreated }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [groupName, setGroupName] = useState("");
    const [groupInfo, setGroupInfo] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/groups/create-group/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    pavadinimas: groupName, aprasymas: groupInfo 
                }),
            });

            if (response.ok) {
                const json = await response.json();
                onCreated && onCreated(json.data);
                setGroupName("");
                setGroupInfo("");
                onClose();
            } else {
                setError('Failed to update info.');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = ["Admin", "Member", "Guest"];

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '16px'}}>
                <h2 style={{margin:0}}>Group info</h2>
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

            {error && <div className="error-message" style={{ marginBottom: 12 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                    <label style={{ display: 'block', marginTop: 12, marginBottom: 8 }}>Group name:</label>
                    <input
                        value={groupName}
                        onChange={e=>setGroupName(e.target.value)}
                        style={{ padding: '8px 10px', marginBottom: 14, borderRadius: 6, border: '1px solid #ddd', width: '100%' }}
                    />

                    <label style={{ display: 'block', marginTop: 6, marginBottom: 8 }}>Group info:</label>
                    <input
                        value={groupInfo}
                        onChange={e=>setGroupInfo(e.target.value)}
                        style={{ padding: '8px 10px', marginBottom: 18, borderRadius: 6, border: '1px solid #ddd', width: '100%' }}
                    />

                <div style={{display:'flex', gap:'.5rem', marginTop:'1.25rem'}}>
                <button type="button" className="reg-button" onClick={onClose} style={{flex:1, padding: '10px 12px'}}>
                    Cancel
                </button>
                {(
                    <button type="submit" style={{flex:1, padding: '10px 12px'}}>{loading ? 'Saving...' : 'Save'}</button>
                )}
                </div>
            </form>
        </Modal>
    );
}