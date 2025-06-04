// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Profile from './components/pages/Profile';
import Home from './components/pages/Home';
import ProductPage from './components/pages/ProductPage';
import Wallet from "./components/comon/Wallet";
import SellerProfile from './components/pages/SellerProfile';
import api from './api';
import './App.scss';

function App() {
    const [auth, setAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/user/me', { withCredentials: true });
                if (response.data.name) {
                    setAuth(true);
                    setUser(response.data);
                }
            } catch (err) {
                setAuth(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    const onLogin = () => {
        setAuth(true);
        api.get('/user/me', { withCredentials: true })
            .then(response => setUser(response.data))
            .catch(err => console.error('Ошибка загрузки пользователя:', err));
    };

    const onLogout = () => {
        setAuth(false);
        setUser(null);
    };

    const onRegister = () => {
        setAuth(true);
        api.get('/user/me', { withCredentials: true })
            .then(response => setUser(response.data))
            .catch(err => console.error('Ошибка загрузки пользователя:', err));
    };

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!auth ? <Login onLogin={onLogin} onSwitchToRegister={() => {}} /> : <Navigate to="/" />} />
                <Route path="/register" element={!auth ? <Register onRegister={onRegister} onSwitchToLogin={() => {}} /> : <Navigate to="/" />} />
                <Route path="/profile/*" element={auth ? <Profile user={user} setUser={setUser} onLogout={onLogout} /> : <Navigate to="/login" />} />
                <Route path="/" element={auth ? <Home user={user} setUser={setUser} onLogout={onLogout} /> : <Navigate to="/login" />} />
                <Route path="/users/:userId/product/:id" element={auth ? <ProductPage user={user} setUser={setUser} onLogout={onLogout} /> : <Navigate to="/login" />} />
                <Route path="/users/:id" element={auth ? <SellerProfile user={user} onLogout={onLogout} /> : <Navigate to="/login" />} />
                <Route path="/wallet" element={auth ? <Wallet user={user} onLogout={onLogout} /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;