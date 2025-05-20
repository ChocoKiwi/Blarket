import React, { useState } from 'react';
import api from '../api';
import ImageContainer from './ImageContainer';

function Login({ onLogin, onSwitchToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        if (!email) {setError('Введите email'); return;}
        if (!password) {setError('Введите пароль'); return;}
        try {
            await api.post('/login', { email, password });
            setError('');
            onLogin();
        } catch (err) {
            setError(err.response?.data?.message || 'Неверный email или пароль');
        }
    };

    return (
        <div className="auth-container">
        <div className="preform-container">
            <div className="logo-container">
                <img className="logo" src="/src/assets/logo.svg" alt="logo"/>
            </div>
            <div className="form-container">
                <form onSubmit={submit}>
                <h2>Добро пожаловать!</h2>
                    <div className="login-container">
                       <div className='input'>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                placeholder=""
                                id='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                       </div>
                        <div className='input'>
                            <label htmlFor="password">Пароль</label>
                            <input
                                type="password"
                                id='password'
                                placeholder=""
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className='with-error'>
                        <div className='button-container'>
                            <button type="submit" className="primary">Войти</button>
                            <button type="button" className="secondary" onClick={onSwitchToRegister}>Регистрация</button>
                        </div>
                        {error && <p style={{color: 'red', marginTop: '20px'}}>{error}</p>}
                    </div>
                </form>
            </div>
        </div>
            <ImageContainer imageType="register" />
        </div>
    );
}

export default Login;