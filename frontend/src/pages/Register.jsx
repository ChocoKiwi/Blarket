import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import '../App.scss';
import panaImage from '../assets/img/pana.svg';

function Register({ onRegister }) {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [apiError, setApiError] = React.useState('');
    const [success, setSuccess] = React.useState('');
    const navigate = useNavigate();
    const password = watch('password');

    const onSubmit = async (data) => {
        if (!data.isTermsAccepted) {
            setApiError('Пожалуйста, согласитесь с обработкой персональных данных.');
            return;
        }
        try {
            await api.post('/registration', {
                name: data.name,
                email: data.email,
                password: data.password
            });
            setSuccess('Регистрация прошла успешно! Добро пожаловать!');
            setApiError('');
            onRegister();
            navigate('/profile');
        } catch (err) {
            setApiError('Что-то пошло не так при регистрации. Попробуйте снова!');
        }
    };

    const getErrorMessage = () => {
        if (errors.name?.type === 'required') return 'Пожалуйста, укажите ваше имя и фамилию.';
        if (errors.name?.type === 'minLength') return 'Имя должно содержать минимум 2 символа.';
        if (errors.email?.type === 'required') return 'Пожалуйста, укажите ваш email.';
        if (errors.email?.type === 'pattern') return 'Кажется, email введён некорректно. Проверьте формат!';
        if (errors.password?.type === 'required') return 'Не забудьте ввести пароль!';
        if (errors.password?.type === 'minLength') return 'Пароль должен содержать минимум 8 символов.';
        if (errors.password?.type === 'latin') return 'Пароль должен содержать хотя бы одну латинскую букву.';
        if (errors.password?.type === 'special') return 'Пароль должен содержать хотя бы один специальный символ (например, !@#$).';
        if (errors.repeatPassword?.type === 'required') return 'Пожалуйста, повторите пароль.';
        if (errors.repeatPassword?.type === 'validate') return 'Пароли не совпадают. Проверьте ещё раз!';
        if (errors.isTermsAccepted?.type === 'required') return 'Пожалуйста, согласитесь с обработкой данных.';
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
                        <h2>Зарегистрируйтесь</h2>
                        <div className="login-container">
                            <div className="input">
                                <label htmlFor="name">Фамилия и имя</label>
                                <input
                                    type="text"
                                    id="name"
                                    {...register('name', {
                                        required: true,
                                        minLength: 2
                                    })}
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="email">Почта</label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register('email', {
                                        required: true,
                                        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                    })}
                                />
                            </div>
                            <div className="passowrd-container">
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
                                <div className="input">
                                    <label htmlFor="repeatPassword">Повторите пароль</label>
                                    <input
                                        type="password"
                                        id="repeatPassword"
                                        {...register('repeatPassword', {
                                            required: true,
                                            validate: value => value === password
                                        })}
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
                                            {...register('isTermsAccepted', {
                                                required: true
                                            })}
                                        />
                                        <span className="checkmark"></span>
                                        <span className="checkbox-label-text">
                                            Я даю согласие на обработку персональных данных
                                        </span>
                                    </label>
                                </div>
                            </div>
                            {success && <p style={{ color: 'green', marginTop: '5px' }}>{success}</p>}
                            {Object.keys(errors).length > 0 && (
                                <div className="error-block">
                                    <p className="error-text">
                                        {getErrorMessage(errors)}
                                    </p>
                                </div>
                            )}
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