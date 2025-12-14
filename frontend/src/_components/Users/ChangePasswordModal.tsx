import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    onUpdated?: (user: any) => void;
}

export default function ChangePasswordModal({ open, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [user, setUser] = useState<any>(null);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("")

    useEffect(() => {
        if (!open) return;

        (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });

                if (res.ok) {
                    const json = await res.json();
                    setUser(json.data);
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
            const response = await fetch(`/api/user/change-password/${user.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    senas_slaptazodis: oldPassword,
                    naujas_slaptazodis: newPassword,
                }),
            });

            if (response.ok) {
                const json = await response.json();
                onUpdated && onUpdated(json);
                onClose();
            } else {
                const json = await response.json();
                setError(json.error || 'Failed to update user password.');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setError("");
        onClose();
}   ;

    if (!open) return null;

    return (
        <Modal open={open} onClose={handleClose}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '12px'}}>
                <h2 style={{margin:0}}>Change Password</h2>
                <button onClick={handleClose} style={{
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
                <label>Old Password:</label>
                <input type="password" onChange={e=>setOldPassword(e.target.value)} />

                <label>New Password:</label>
                <input type="password" onChange={e=>setNewPassword(e.target.value)} />

                <div style={{display:'flex', gap:'.5rem', marginTop:'1rem'}}>
                <button type="button" className="reg-button" onClick={handleClose} style={{flex:1}}>Cancel</button>
                <button type="submit" style={{flex:1}}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </form>
        </Modal>
    );
}