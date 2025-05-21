import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api';
import ImageContainer from './ImageContainer';

function EditProfile({ onLogout }) {
    const { register, handleSubmit, formState: { errors }, reset, setError, setValue, watch } = useForm({ mode: 'onChange' });
    const [initialData, setInitialData] = useState(null);
    const phoneNumber = watch('phoneNumber', '');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data && response.data.username) {
                    setInitialData(response.data);
                    reset(response.data); // Устанавливаем начальные значения формы
                } else {
                    throw new Error('Данные пользователя не получены');
                }
            } catch (err) {
                console.error('Ошибка при получении данных:', err);
                setError('api', { type: 'manual', message: 'Не удалось загрузить данные' });
                onLogout();
            }
        };
        fetchUser();
    }, [reset, onLogout, setError]);

    const formatPhoneNumber = (value) => {
        if (!value) return value;
        const onlyDigits = value.replace(/[^\d]/g, '');
        if (onlyDigits.length === 0) return '+7 ';
        let formatted = '+7 ';
        if (onlyDigits.length > 1) {
            formatted += onlyDigits.slice(1, 4);
        }
        if (onlyDigits.length > 4) {
            formatted += ' ' + onlyDigits.slice(4, 7);
        }
        if (onlyDigits.length > 7) {
            formatted += '-' + onlyDigits.slice(7, 9);
        }
        if (onlyDigits.length > 9) {
            formatted += '-' + onlyDigits.slice(9, 11);
        }
        return formatted;
    };

    const handlePhoneNumberChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setValue('phoneNumber', formatted, { shouldValidate: true });
    };

    const validatePhoneNumber = (value) => {
        if (!value) return true; // Поле необязательное
        const digits = value.replace(/[^\d]/g, '');
        return digits.length === 11 || 'Номер телефона должен содержать 11 цифр';
    };

    const validateDateOfBirth = (value) => {
        if (!value) return true; // Поле необязательное
        const date = new Date(value);
        const today = new Date();
        return date <= today || 'Дата рождения не может быть в будущем';
    };

    const validateGender = (value) => {
        if (!value) return true; // Поле необязательное
        return ['MALE', 'FEMALE'].includes(value) || 'Пол должен быть MALE или FEMALE';
    };

    const submit = async (data) => {
        try {
            await api.post('/api/user/update', {
                username: data.username || undefined,
                email: data.email || undefined,
                phoneNumber: data.phoneNumber || undefined,
                address: data.address || undefined,
                dateOfBirth: data.dateOfBirth || undefined,
                gender: data.gender || undefined,
            });
            setInitialData(data); // Обновляем начальные данные
            reset(data); // Сбрасываем форму
        } catch (err) {
            setError('api', {
                type: 'manual',
                message: err.response?.data?.message || 'Ошибка при обновлении данных',
            });
        }
    };

    const handleReset = () => {
        reset(initialData); // Сбрасываем на исходные данные
    };

    const errorMessages = Object.values(errors)
        .map((error) => error.message)
        .filter(Boolean);

    if (!initialData) {
        return <div>Загрузка...</div>;
    }

    return (
        <div className="auth-container">
            <div className="preform-container">
                <div className="logo-container">
                    <img className="logo" src="/src/assets/logo.svg" alt="logo" />
                </div>
                <div className="form-container">
                    <form onSubmit={handleSubmit(submit)}>
                        <h2>Редактировать профиль</h2>
                        <div className="login-container">
                            <div className="input">
                                <label htmlFor="username">Имя пользователя</label>
                                <input
                                    type="text"
                                    id="username"
                                    {...register('username', {
                                        required: 'Пожалуйста, заполните имя пользователя',
                                        minLength: { value: 3, message: 'Имя пользователя должно содержать не менее 3 символов' },
                                    })}
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    {...register('email', {
                                        required: 'Пожалуйста, заполните поле с почтой',
                                        pattern: {
                                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                            message: 'Вы указали почту неправильного формата',
                                        },
                                    })}
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="phoneNumber">Номер телефона</label>
                                <input
                                    type="text"
                                    id="phoneNumber"
                                    {...register('phoneNumber', { validate: validatePhoneNumber })}
                                    onChange={handlePhoneNumberChange}
                                    value={formatPhoneNumber(phoneNumber)}
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="address">Адрес</label>
                                <input
                                    type="text"
                                    id="address"
                                    {...register('address')}
                                />
                            </div>
                            <div className="input">
                                <label htmlFor="dateOfBirth">Дата рождения</label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    {...register('dateOfBirth', { validate: validateDateOfBirth })}
                                />
                            </div>
                            <div className="input">
                                <label>Пол</label>
                                <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
                                    <label>
                                        <input
                                            type="radio"
                                            value="MALE"
                                            {...register('gender', { validate: validateGender })}
                                        />
                                        Мужской
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="FEMALE"
                                            {...register('gender', { validate: validateGender })}
                                        />
                                        Женский
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="with-error">
                            <div className="button-container">
                                <button type="submit" className="primary">Сохранить</button>
                                <button type="button" className="secondary" onClick={handleReset}>Сбросить</button>
                            </div>
                            {errorMessages.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    {errorMessages.map((error, index) => (
                                        <p style={{ color: '#FF725E', marginTop: '5px' }} key={index}>{error}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            <ImageContainer imageType="register" />
        </div>
    );
}

export default EditProfile;