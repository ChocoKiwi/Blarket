import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import panaImage from '../assets/img/pana.svg';

function Login({ onLogin }) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [apiError, setApiError] = React.useState('');
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            await api.post('/login', { email: data.email, password: data.password });
            setApiError('');
            onLogin();
            navigate('/profile');
        } catch (err) {
            setApiError('Похоже, email или пароль неверные. Попробуйте ещё раз!');
        }
    };

    const getFirstError = () => {
        if (errors.email?.type === 'required') return 'Пожалуйста, укажите ваш email.';
        if (errors.email?.type === 'pattern') return 'Кажется, email введён некорректно. Проверьте формат!';
        if (errors.password?.type === 'required') return 'Не забудьте ввести пароль!';
        if (errors.password?.type === 'minLength') return 'Пароль должен содержать минимум 8 символов.';
        if (errors.password?.type === 'latin') return 'Пароль должен содержать хотя бы одну латинскую букву.';
        if (errors.password?.type === 'special') return 'Пароль должен содержать хотя бы один специальный символ (например, !@#$).';
        return '';
    };

    return (
        <div className="auth-container">
            <div className="preform-container">
                <div className="logo-container">
                    <img className="logo" src="/src/assets/logo/logo.svg" alt="logo" />
                </div>
                <div className="form-container">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <h2>Добро пожаловать!</h2>
                        <div className="login-container">
                            <div className="input">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register('email', {
                                        required: true,
                                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                    })}
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="password">Пароль</label>
                                <input
                                    type="password"
                                    id="password"
                                    {...register('password', {
                                        required: true,
                                        minLength: 8,
                                        validate: {
                                            latin: value => /[a-zA-Z]/.test(value) || 'latin',
                                            special: value => /[!@#$%^&*(),.?":{}|<>]/.test(value) || 'special'
                                        }
                                    })}
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
                            {(getFirstError() || apiError) && (
                                <p style={{color: '#FF725E', marginTop: '20px'}}>
                                    {getFirstError() || apiError}
                                </p>
                            )}
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