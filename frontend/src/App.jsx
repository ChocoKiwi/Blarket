
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/pages/Login'
import Register from './components/pages/Register';
import Profile from './components/pages/Profile';
import Home from './components/pages/Home';
import api from './api';
import './App.scss';

function App() {
    const [auth, setAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null); // Добавляем состояние для user

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data.name) {
                    setAuth(true);
                    setUser(response.data); // Сохраняем данные пользователя
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
        // Загружаем данные пользователя после логина
        api.get('/user/me')
            .then(response => setUser(response.data))
            .catch(err => console.error('Ошибка загрузки пользователя:', err));
    };

    const onLogout = () => {
        setAuth(false);
        setUser(null);
    };

    const onRegister = () => {
        setAuth(true);
        // Загружаем данные пользователя после регистрации
        api.get('/user/me')
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
                <Route path="/profile/*" element={auth ? <Profile user={user} onLogout={onLogout} /> : <Navigate to="/login" />} />
                <Route path="/" element={auth ? <Home user={user} setUser={setUser} onLogout={onLogout} /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;