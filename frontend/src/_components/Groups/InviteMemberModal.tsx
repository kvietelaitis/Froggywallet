import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    groupId?: string;
    onInvited?: () => void;
}

export default function EditGroupModal({ open, groupId, onClose, onInvited }: Props) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!email) {
            return;
        }
        setError("");
        setLoading(true);
        setSuccess("");

        try {
            const response = await fetch(`/api/groups/${groupId}/invite`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    "el_pastas": email,
                }),
            });

            if (response.ok) {
                setSuccess("Invite sent!");
                setEmail("");
                onInvited && onInvited();
                setTimeout(() => onClose(), 1500);
            } else {
                const json = await response.json();
                setError(json.error || "Failed to send invite");
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
            <h2>Invite Member</h2>
            {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}
            <form onSubmit={handleSubmit}>
                <label>Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="button" onClick={onClose} style={{ flex: 1 }}>
                    Cancel
                </button>
                <button type="submit" disabled={loading} style={{ flex: 1 }}>
                    {loading ? "Sending..." : "Send Invite"}
                </button>
                </div>
            </form>
        </Modal>
    );
}