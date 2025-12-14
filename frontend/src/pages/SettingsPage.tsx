import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
    const navigate = useNavigate();

    return (
        <div>
            <h1>Settings Page</h1>

            <p>Manage your application settings here.</p>

            <button style={{marginTop: '1rem'}}>
                Update Profile
            </button>
            
            <button style={{marginTop: '1rem'}}>Change Password</button>

            <button style={{marginTop: '1rem'}} onClick={() => navigate('/')}>Log out</button>
        </div>
    );
}