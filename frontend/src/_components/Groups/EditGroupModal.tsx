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
    role?: string;
}

export default function EditGroupModal({ open, groupId, onClose, onUpdated }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [groupName, setGroupName] = useState("");
    const [groupInfo, setGroupInfo] = useState("");
    const [members, setMembers] = useState<Member[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState("");
    const [currentUserId, setCurrentUserId] = useState<string>("");

    const isAdmin = currentUserRole === "Admin" || currentUserRole === "Administratorius";

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
            setCurrentUserRole(g.currentUserRole ?? '');
            setCurrentUserId(String(g.currentUserId ?? ''));
            setMembers((g.members ?? []).map((m: any) => ({
                id: String(m.id ?? ''),
                name: m.name,
                username: m.username,
                email: m.email,
                role: m.role,
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

    const roleOptions = ["Admin", "Member"];

    const handleRoleChange = async (memberId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/groups/${groupId}/members/${memberId}/role`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
            } else {
                const json = await res.json();
                setError(json.error || 'Failed to update role');
            }
        } catch {
            setError('Network error');
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Remove this member from the group?')) return;
        try {
            const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                setMembers(prev => prev.filter(m => m.id !== memberId));
            } else {
                const json = await res.json();
                setError(json.error || 'Failed to remove member');
            }
        } catch {
            setError('Network error');
        }
    };

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
                {isAdmin ? (
                <>
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
                </>
                ) : (
                <>
                    <label style={{ display: 'block', marginTop: 12, marginBottom: 8 }}>Group name:</label>
                    <div className="readonly-field" style={{ padding: '8px 10px', marginBottom: 14 }}>{groupName}</div>

                    <label style={{ display: 'block', marginTop: 6, marginBottom: 8 }}>Group info:</label>
                    <div className="readonly-field" style={{ padding: '8px 10px', marginBottom: 18 }}>{groupInfo}</div>
                </>
                )}

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {members.map((m) => {
                    const isSelf = m.id === currentUserId;
                    
                    return (
                        <li key={m.id} style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                    {m.name || m.username || m.email}
                                    {isSelf && <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 6 }}> (you)</span>}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {m.username && <span>{m.username}</span>}
                                    {m.username && m.email && <span> • </span>}
                                    {m.email && <span>{m.email}</span>}
                                </div>
                            </div>

                            {isAdmin && !isSelf ? (
                                <>
                                    <select
                                        value={m.role || 'Member'}
                                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                                        style={{ padding: '4px 8px', width: 120 }}
                                    >
                                        {roleOptions.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveMember(m.id)}
                                        title="Remove member"
                                        style={{
                                            width: 24,
                                            height: 24,
                                            padding: 0,
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            fontSize: 14,
                                            lineHeight: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.role}</span>
                            )}
                        </li>
                    );
                })}
                </ul>

                <div style={{display:'flex', gap:'.5rem', marginTop:'1.25rem'}}>
                <button type="button" className="reg-button" onClick={onClose} style={{flex:1, padding: '10px 12px'}}>
                    {isAdmin ? 'Cancel' : 'Close'}
                </button>
                {isAdmin && (
                    <button type="submit" style={{flex:1, padding: '10px 12px'}}>{loading ? 'Saving...' : 'Save'}</button>
                )}
                </div>
            </form>
        </Modal>
    );
}