import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../_components/Users/UserProvider';

type Group = {
    id: string;
    name: string;
    members: string[];
}

export default function GroupsPage(){
    const { user, loading: userLoading, refresh } = useUser();
    const [groups, setGroups] = useState<Group[]>([])
    const [error, setError] = useState('');
    const [groupsLoading, setGroupsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if(userLoading) return;
        if(!user) {
            setGroups([]);
            return;
        }

        fetchGroups();
    }, [user, userLoading])

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
            setGroups(json.data || []);
           }
        } catch (err) {
            setError("Network error");
        } finally {
            setGroupsLoading(false);
        }
    }

    const openGroup = (id: string) => {
        navigate(`edit-group/${id}`);
    };

    return (
        <div>
        <h1>Groups</h1>

        {groupsLoading && <p>Loading groups...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        <div style={{ margin: '1rem 0' }}>
            <button onClick={() => navigate('create-group')}>Create Group</button>
            <button style={{ marginLeft: 8 }} onClick={() => navigate('edit-group')}>Existing Group</button>
        </div>

        <p style={{ marginBottom: '1rem' }}>Your groups are listed below.</p>

        {groups.length === 0 && !groupsLoading ? (
            <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You are not a member of any groups yet.</p>
            </div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {groups.map((g) => (
                <div key={g.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                    <h3 style={{ margin: 0 }}>{g.name}</h3>
                    <p style={{ margin: '8px 0 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                        {g.members?.length ?? 0} member{(g.members?.length ?? 0) !== 1 ? 's' : ''}
                    </p>
                    </div>
                    <div style={{ marginLeft: 12 }}>
                    <button onClick={() => openGroup(g.id)} style={{ padding: '6px 10px' }}>Open</button>
                    </div>
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
                </div>
            ))}
            </div>
        )}
        </div>
    );
}