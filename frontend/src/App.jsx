import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Profile from './components/pages/Profile';
import api from './api';
import './App.scss';

const Home = () => <div>Главная страница</div>;
const Messages = () => <div>Сообщения</div>;
const Cart = () => <div>Корзина</div>;
const Notifications = () => <div>Уведомления</div>;
const Settings = () => <div>Настройки</div>;

function App() {
    const [auth, setAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data.name) {
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
    };

    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!auth ? <Login onLogin={onLogin} onSwitchToRegister={() => {}} /> : <Navigate to="/profile/info" />} />
                <Route path="/register" element={!auth ? <Register onRegister={onRegister} onSwitchToLogin={() => {}} /> : <Navigate to="/profile" />} />
                <Route path="/profile/*" element={auth ? <Profile onLogout={onLogout} /> : <Navigate to="/login" />} />
                <Route path="/home" element={auth ? <Home /> : <Navigate to="/login" />} />
                <Route path="/messages" element={auth ? <Messages /> : <Navigate to="/login" />} />
                <Route path="/cart" element={auth ? <Cart /> : <Navigate to="/login" />} />
                <Route path="/notifications" element={auth ? <Notifications /> : <Navigate to="/login" />} />
                <Route path="/settings" element={auth ? <Settings /> : <Navigate to="/login" />} />
                <Route path="/" element={auth ? <Home /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;