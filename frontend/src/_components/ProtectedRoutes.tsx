import { useEffect, useState } from "react"
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/me', {credentials: 'include'});

                if (res.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;