import { useEffect, useState } from "react";
import Modal from "../Modal";

type Props = {
    open: boolean;
    onClose: () => void;
    groupId?: string;
    onUpdated?: (user: any) => void;
}

type Member = {
    id: string;
    name?: string;
    username?: string;
    email?: string;
}

export default function EditGroupModal({ open, groupId, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [groupName, setGroupName] = useState("");
    const [groupInfo, setGroupInfo] = useState("");
    const [members, setMembers] = useState<Member[]>([]);

    useEffect(() => {
        if (!open || !groupId) return;
        (async () => {
        try {
            const res = await fetch(`/api/groups/info/${groupId}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed');
            const json = await res.json();
            const g = json.data;
            setGroupName(g.name ?? '');
            setGroupInfo(g.description ?? '');
            setMembers((g.members ?? []).map((m: any) => ({
                id: String(m.id ?? ''),
                name: m.name ?? m.name,
                username: m.username ?? m.username,
                email: m.email ?? m.email,
            })));
        } catch {
            setError('Unable to load group');
        }
        })();
    }, [open, groupId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!groupId) {
            return;
        }
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/groups/change-info/${groupId}`, {
                method: 'PUT',
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
                onUpdated && onUpdated(json);
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

    if (!open) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '12px'}}>
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

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <label>Group name:</label>
                <input value={groupName} onChange={e=>setGroupName(e.target.value)} />

                <label>Group info:</label>
                <input value={groupInfo} onChange={e=>setGroupInfo(e.target.value)} />

                {members.length > 0 && (
                    <>
                        <label>Members ({members.length}):</label>
                        <ul style={{ maxHeight: 200, overflow: 'auto', paddingLeft: 16 }}>
                        {members.map((m) => (
                            <li key={m.id} style={{ marginBottom: 6 }}>
                            <div style={{ fontWeight: 600 }}>{m.name || m.username || m.email}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {m.username && <span>{m.username}</span>}
                                {m.username && m.email && <span> • </span>}
                                {m.email && <span>{m.email}</span>}
                            </div>
                            </li>
                        ))}
                        </ul>
                    </>
                )}

                <div style={{display:'flex', gap:'.5rem', marginTop:'1rem'}}>
                <button type="button" className="reg-button" onClick={onClose} style={{flex:1}}>Cancel</button>
                <button type="submit" style={{flex:1}}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </form>
        </Modal>
    );
}