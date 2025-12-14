import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    onUpdated?: (user: any) => void;
}

export default function UpdateProfileModal({ open, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [user, setUser] = useState<any>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        if (!open) return;

        (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });

                if (res.ok) {
                    const json = await res.json();
                    setUser(json.data);
                    setFirstName(json.data.vardas || json.data.firstName || "");
                    setLastName(json.data.pavarde || json.data.lastName || "");
                    setUsername(json.data.vartotojo_vardas || json.data.username || "");
                    setEmail(json.data.el_pastas || json.data.email || "");
                } else {
                    setError("Unable to load user");
                }
            } catch (err) {
                setError("Network error");
            }
        })();
    }, [open]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) {
            return;
        }
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/user/change-info/${user.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vardas: firstName,
                    pavarde: lastName,
                    vartotojo_vardas: username,
                    el_pastas: email,
                }),
            });

            if (response.ok) {
                const json = await response.json();
                onUpdated && onUpdated(json);
                onClose();
            } else {
                setError('Failed to update user info.');
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
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '12px'}}>
                <h2 style={{margin:0}}>Update profile</h2>
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

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <label>First name:</label>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)} />

                <label>Last name:</label>
                <input value={lastName} onChange={e=>setLastName(e.target.value)} />

                <label>Email:</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} />

                <label>Username:</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} />

                <div style={{display:'flex', gap:'.5rem', marginTop:'1rem'}}>
                <button type="button" className="reg-button" onClick={onClose} style={{flex:1}}>Cancel</button>
                <button type="submit" style={{flex:1}}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </form>
        </Modal>
    );
}