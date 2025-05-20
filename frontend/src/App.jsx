import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import api from './api';
//import './App.css';
import './App.scss';
import ImageContainer from "./components/ImageContainer";

function App() {
    const [auth, setAuth] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data.username) {
                    setAuth(true);
                }
            } catch (err) {
                setAuth(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const onLogin = () => setAuth(true);
    const onLogout = () => setAuth(false);
    const onRegister = () => {
        setAuth(true);
        setShowRegister(false);
    };

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <div className="main-auth-container">
                {auth ? (
                    <Profile onLogout={onLogout} />
                ) : showRegister ? (
                    <Register onRegister={onRegister} onSwitchToLogin={() => setShowRegister(false)} />
                ) : (
                    <Login onLogin={onLogin} onSwitchToRegister={() => setShowRegister(true)} />
                )}
        </div>
    );
}

export default App;