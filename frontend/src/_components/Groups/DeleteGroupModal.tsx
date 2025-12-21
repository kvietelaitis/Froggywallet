import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    groupId: string;
    groupName?: string;
    onDelete: (groupId: string) => Promise<void>;
}

export default function DeleteGroupModal({ open, onClose, groupId, groupName, onDelete }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = async (event: React.FormEvent) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await onDelete(groupId);
            onClose();
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <h2>Delete Group</h2>
            {error && <div className="error-message">{error}</div>}
            <p>Are you sure you want to delete <strong>{groupName || "this group"}</strong>?</p>
            <div style={{display:'flex', gap:'.5rem', marginTop:'1.25rem'}}>
                <button type="button" onClick={onClose}>Cancel</button>
                <button type="button" onClick={handleDelete} disabled={loading}>
                    {loading ? "Deleting..." : "Delete"}
                </button>
            </div>
        </Modal>
    );
}