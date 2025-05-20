import React, { useEffect, useState } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true,
});

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/login', { email, password });
            setError('');
            onLogin();
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный email или пароль');
        }
    };

    return (
        <form onSubmit={submit}>
            <h2>Вход</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Войти</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

function Register({ onRegister }) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/registration', { email, username, password });
            setError('');
            setSuccess('Регистрация прошла успешно!');
            onRegister();
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка регистрации');
            setSuccess('');
        }
    };

    return (
        <form onSubmit={submit}>
            <h2>Регистрация</h2>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button type="submit">Зарегистрироваться</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </form>
    );
}

function Profile({ onLogout }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        api.get('/user/me')
            .then((res) => {
                if (res.data.username) {
                    setUser(res.data);
                } else {
                    onLogout();
                }
            })
            .catch(() => onLogout());
    }, [onLogout]);

    const logout = async () => {
        try {
            await api.post('/logout'); // Корректный эндпоинт
            onLogout();
        } catch (err) {
            console.error('Ошибка при выходе:', err);
            onLogout(); // Выполняем выход даже при ошибке
        }
    };

    if (!user) return <p>Загрузка...</p>;

    return (
        <div>
            <h2>Профиль</h2>
            <p>Привет, {user.username} ({user.email})</p>
            <button onClick={logout}>Выйти</button>
        </div>
    );
}

export default function App() {
    const [auth, setAuth] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const onLogin = () => setAuth(true);
    const onLogout = () => setAuth(false);

    if (!auth) {
        return showRegister ? (
            <>
                <Register onRegister={() => setShowRegister(false)} />
                <p>
                    Уже есть аккаунт?{' '}
                    <button onClick={() => setShowRegister(false)}>Войти</button>
                </p>
            </>
        ) : (
            <>
                <Login onLogin={onLogin} />
                <p>
                    Нет аккаунта?{' '}
                    <button onClick={() => setShowRegister(true)}>Зарегистрироваться</button>
                </p>
            </>
        );
    }

    return <Profile onLogout={onLogout} />;
}