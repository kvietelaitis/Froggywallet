import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditGroupModal from '../../_components/Groups/EditGroupModal';
import InviteMemberModal from "../../_components/Groups/InviteMemberModal";
import CreateGroupModal from '../../_components/Groups/CreateGroupModal';
import DeleteGroupModal from '../../_components/Groups/DeleteGroupModal';

type Group = {
    id: string;
    name: string;
    members: string[];
    isAdmin: boolean;
}

export default function GroupsPage(){
    const [user, setUser] = useState<any>(null);
    const [groups, setGroups] = useState<Group[]>([])
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [groupsLoading, setGroupsLoading] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const navigate = useNavigate();

    const [openGroupInfo, setOpenGroup] = useState(false);
    const [openGroupCreation, setCreateGroup] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load user");
                const json = await res.json();
                setUser(json.data);
            } catch (err) {
                setError("Unable to load user");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
    if (loading) return;
    if (!user) {
        setGroups([]);
        return;
    }
    fetchGroups();
    }, [user, loading]);

    const fetchGroups = async () => {
        try {
           setGroupsLoading(true);
           const response = await fetch(`/api/groups/${user.id}`, {
            method:'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
           });

           if (response.ok) {
            const json = await response.json();
            let data = json.data.groups ?? [];
            if (!Array.isArray(data)) data = [data];

            const mapped = data.map((g: any) => ({
            id: String(g.ID ?? g.id ?? ''),
            name: g.Pavadinimas ?? g.name ?? '',
            members: (g.members ?? []).map((m: any) => m.name ?? m.vardas ?? m.username ?? m.email ?? ''),
            role: g.role ?? '',
            isAdmin: !!g.isAdmin,
            }));
            setGroups(mapped);
           }
        } catch (err) {
            setError("Network error");
        } finally {
            setGroupsLoading(false);
        }
    }

    const deleteGroup = async (groupId: string) => {
        try {
            setGroupsLoading(true);
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if(response.ok) {
                fetchGroups();
            }
        } catch (err) {
            setError("Failed to delete group");
        } finally {
            setGroupsLoading(false);
        }
    }

    const handleSelectGroup = (groupId: string) => {
        localStorage.setItem('selectedGroupId', groupId);
        alert('Group selected!');
    }

    return (
        <div>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                minHeight: 48 // matches h1 height for alignment
            }}
        >
            <h1 style={{ margin: 0, fontSize: 28, lineHeight: '40px' }}>Groups</h1>
            <button
                onClick={() => setCreateGroup(true)}
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginLeft: 12,
                    padding: 0,
                }}
                aria-label="Create Group"
            >
                +
            </button>
        </div>

        <CreateGroupModal open={openGroupCreation} onClose={() => setCreateGroup(false)} onCreated={() => {
            setCreateGroup(false);
            fetchGroups();
        }} />

        {groupsLoading && <p>Loading groups...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {groups.length === 0 && !groupsLoading ? (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You are not a member of any groups yet.</p>
            </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: 12 }}>
            {groups.map((g) => (
                <div key={g.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                    <h3 style={{ margin: 0 }}>{g.name}</h3>
                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                        {g.members?.length ?? 0} member{(g.members?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                    </div>
                    <div style={{ marginLeft: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button 
                        onClick={() => handleSelectGroup(g.id)} 
                        style={{ padding: '6px 10px'}}>
                        Select
                    </button>
                    <button onClick={() => setOpenGroup(true)} style={{ padding: '6px 10px' }}>Open</button>
                    {(g.isAdmin) && (
                        <>
                            <button onClick={() => setShowInvite(true)} style={{ padding: '6px 10px' }}>Invite Member</button>
                            <button onClick={() => setShowDeleteModal(true)} style={{ padding: '6px 10px' }}>Delete Group</button>
                        </>
                    )}
                    </div>

                    <InviteMemberModal
                        open={showInvite}
                        groupId={g.id || ""}
                        onClose={() => setShowInvite(false)}
                        onInvited={() => {}}
                    />

                    <DeleteGroupModal
                        open={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        groupId={g.id}
                        groupName={g.name}
                        onDelete={deleteGroup}
                    />
                </div>

                {g.members && g.members.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                    <strong style={{ fontSize: 13 }}>Members</strong>
                    <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                        {g.members.slice(0, 5).map((m, i) => (
                        <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{m}</li>
                        ))}
                        {g.members.length > 5 && <li style={{ fontSize: 13, color: 'var(--text-secondary)' }}>+{g.members.length - 5} more</li>}
                    </ul>
                    </div>
                )}

                <EditGroupModal open={openGroupInfo} groupId={g.id} onClose={() => setOpenGroup(false)} onUpdated={() => { /* refresh if needed */ }} />

                </div>
            ))}
            </div>
        )}
        </div>
    );
}