import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../App.scss';
import panaImage from '../assets/img/pana.svg';

function Register({ onRegister }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [isTermsAccepted, setIsTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const submit = async (e) => {
        e.preventDefault();
        if (password !== repeatPassword) {
            setError('Пароли не совпадают');
            return;
        }
        if (!isTermsAccepted) {
            setError('Вы должны согласиться с обработкой данных');
            return;
        }
        try {
            await api.post('/registration', { username, email, password });
            setSuccess('Регистрация успешна');
            setError('');
            onRegister();
            navigate('/profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка регистрации');
            setSuccess('');
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
                        <h2>Зарегистрируйтесь</h2>
                        <div className="login-container">
                            <div className="input">
                                <label htmlFor="username">Имя и фамилия</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="email">Почта</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="passowrd-container">
                                <div className="input">
                                    <label htmlFor="password">Пароль</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input">
                                    <label htmlFor="repeatPassword">Повторите пароль</label>
                                    <input
                                        type="password"
                                        id="repeatPassword"
                                        value={repeatPassword}
                                        onChange={(e) => setRepeatPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="with-error">
                            <div className="button-checkbox">
                                <div className="button-container">
                                    <button type="submit" className="primary">Регистрация</button>
                                    <button type="button" className="secondary" onClick={() => navigate('/login')}>
                                        Войти
                                    </button>
                                </div>
                                <div className="custom-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={isTermsAccepted}
                                            onChange={(e) => setIsTermsAccepted(e.target.checked)}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="checkbox-label-text">
                      Я даю согласие на обработку персональных данных
                    </span>
                                    </label>
                                </div>
                            </div>
                            {success && <p style={{ color: 'green' }}>{success}</p>}
                            {error && <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>}
                        </div>
                    </form>
                </div>
            </div>
            <div className="image-container">
                <img src={panaImage} alt="Регистрация" />
            </div>
        </div>
    );
}

export default Register;