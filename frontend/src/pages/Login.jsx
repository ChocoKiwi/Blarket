import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import panaImage from '../assets/img/pana.svg';

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Введите email');
            return;
        }
        if (!password) {
            setError('Введите пароль');
            return;
        }
        try {
            await api.post('/login', { email, password });
            setError('');
            onLogin();
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный email или пароль');
        }
    };

    return (
        <div className="auth-container">
            <div className="preform-container">
                <div className="logo-container">
                    <img className="logo" src="/src/assets/logo/logo.svg" alt="logo" />
                </div>
                <div className="form-container">
                    <form onSubmit={submit}>
                        <h2>Добро пожаловать!</h2>
                        <div className="login-container">
                            <div className="input">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    placeholder=""
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="password">Пароль</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder=""
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="with-error">
                            <div className="button-container">
                                <button type="submit" className="primary">Войти</button>
                                <button type="button" className="secondary" onClick={() => navigate('/register')}>
                                    Регистрация
                                </button>
                            </div>
                            {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
                        </div>
                    </form>
                </div>
            </div>
            <div className="image-container">
                <img src={panaImage} alt="Логин" />
            </div>
        </div>
    );
}

export default Login;