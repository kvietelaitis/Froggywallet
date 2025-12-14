import { useNavigate } from "react-router-dom";
import { useState } from "react";
import UpdateProfileModal from "../_components/Users/UpdateProfileModal";

export default function SettingsPage() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    return (
        <div>
            <h1>Settings Page</h1>

            <p>Manage your application settings here.</p>

            <button style={{marginTop: '1rem'}} onClick={() => setOpen(true)}>
                Update Profile
            </button>
            
            <button style={{marginTop: '1rem'}}>Change Password</button>

            <button style={{marginTop: '1rem'}} onClick={async () => {
                await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
                });
                navigate('/');
            }}>
                Log out
            </button>

            <UpdateProfileModal open={open} onClose={() => setOpen(false)} onUpdated={() => {}}/>
        </div>
    );
}