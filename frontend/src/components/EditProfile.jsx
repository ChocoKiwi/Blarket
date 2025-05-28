import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api';
import success from "../assets/icons/sucsses.svg";
import { useNavigate } from 'react-router-dom';

function EditProfile({ onLogout, setUser, user }) {
    const { register, handleSubmit, formState: { errors }, reset, setError, setValue, watch } = useForm({ mode: 'onChange' });
    const [initialData, setInitialData] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');
    const phoneNumber = watch('phoneNumber', '');
    const navigate = useNavigate();

    const successMessages = [
        'Красивые данные, мы их сохраним!',
        'Спасибо за данные, добрый человек!',
        'Упс.. Кажется, мы сохранили ваши данные',
        'Ты молодец, отличные данные!'
    ];

    const fetchUser = useCallback(async () => {
        try {
            const { data } = await api.get('/user/me', { withCredentials: true });
            if (data?.email) {
                const userData = {
                    name: data.name || '',
                    email: data.email || '',
                    phoneNumber: data.phone ? formatPhoneNumber(data.phone) : '',
                    address: data.address || '',
                    dateOfBirth: data.date_of_birth || '',
                    gender: data.gender || '',
                    avatar: data.avatar || ''
                };
                setInitialData(userData);
                reset(userData);
                setUser(data);
            } else {
                throw new Error('Данные пользователя не получены');
            }
        } catch (err) {
            console.error('Ошибка при получении данных:', err);
            setError('api', { message: 'Не удалось загрузить данные' });
            if (err.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    }, [reset, onLogout, setError, setUser, navigate]);

    useEffect(() => {
        if (!initialData) fetchUser();
    }, [fetchUser, initialData]);

    const formatPhoneNumber = value => {
        if (!value) return '';
        const onlyDigits = value.replace(/[^\d]/g, '');
        if (onlyDigits.length === 0) return '+7 ';
        let formatted = '+7 ';
        if (onlyDigits.length > 1) formatted += onlyDigits.slice(1, 4);
        if (onlyDigits.length > 4) formatted += ' ' + onlyDigits.slice(4, 7);
        if (onlyDigits.length > 7) formatted += '-' + onlyDigits.slice(7, 9);
        if (onlyDigits.length > 9) formatted += '-' + onlyDigits.slice(9, 11);
        return formatted;
    };

    const handlePhoneNumberChange = e => {
        const formatted = formatPhoneNumber(e.target.value);
        setValue('phoneNumber', formatted, { shouldValidate: true });
    };

    const validatePhoneNumber = value => {
        if (!value) return true;
        const digits = value.replace(/[^\d]/g, '');
        return digits.length === 11 || 'Номер телефона должен содержать 11 цифр';
    };

    const validateDateOfBirth = value => {
        if (!value) return true;
        const date = new Date(value);
        const today = new Date();
        return date <= today || 'Дата рождения не может быть в будущем';
    };

    const validateGender = value => {
        if (!value) return true;
        return ['MALE', 'FEMALE'].includes(value) || 'Пол должен быть MALE или FEMALE';
    };

    const submit = async data => {
        try {
            const updatedData = {
                name: data.name || undefined,
                email: data.email || undefined,
                phoneNumber: data.phoneNumber ? data.phoneNumber.replace(/[^\d]/g, '') : undefined,
                address: data.address || undefined,
                dateOfBirth: data.dateOfBirth || undefined,
                gender: data.gender || undefined,
                avatar: user.avatar || undefined
            };
            const response = await api.post('/user/update', updatedData, { withCredentials: true });
            // Обновляем данные пользователя на клиенте
            await fetchUser();
            setInitialData(data);
            reset(data);
            // Если email изменился, обновляем локальные данные пользователя
            if (data.email && data.email !== initialData.email) {
                setUser({ ...user, email: response.data.newEmail });
            }
            const randomMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
            setNotificationMessage(randomMessage);
            setNotificationState('visible');
            setTimeout(() => setNotificationState('hiding'), 3000);
            setTimeout(() => setNotificationState('hidden'), 3500);
        } catch (err) {
            console.error('Ошибка обновления:', err);
            setError('api', { message: err.response?.data?.message || 'Ошибка при обновлении данных' });
            if (err.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const handleReset = () => {
        reset(initialData);
        setUser({ ...user, ...initialData, avatar: initialData.avatar });
    };

    const errorMessages = Object.values(errors)
        .map(error => error.message)
        .filter(Boolean);

    if (!initialData) return <div>Загрузка...</div>;

    return (
        <div style={{ position: 'relative' }}>
            <form onSubmit={handleSubmit(submit)}>
                <h2>Редактировать профиль</h2>
                <div className="update-container">
                    <div className="input radio" style={{ background: 'none', padding: '0' }}>
                        <div style={{ display: 'flex', gap: '30px' }}>
                            <label className="custom-radio">
                                <input
                                    type="radio"
                                    value="MALE"
                                    {...register('gender', { validate: validateGender })}
                                />
                                Мужчина
                                <span className="radio-mark"></span>
                            </label>
                            <label className="custom-radio">
                                <input
                                    type="radio"
                                    value="FEMALE"
                                    {...register('gender', { validate: validateGender })}
                                />
                                Женщина
                                <span className="radio-mark"></span>
                            </label>
                        </div>
                    </div>
                    <div className="input">
                        <label htmlFor="name">Фамилия и имя</label>
                        <input
                            type="text"
                            id="name"
                            {...register('name', {
                                minLength: {
                                    value: 3,
                                    message: 'Имя должно содержать не менее 3 символов'
                                }
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
                                    message: 'Вы указали почту неправильного формата'
                                }
                            })}
                        />
                    </div>
                    <div className="input">
                        <label htmlFor="address">Адрес</label>
                        <input type="text" id="address" {...register('address')} />
                    </div>
                    <div className="phone-date-container">
                        <div className="input">
                            <label htmlFor="phoneNumber">Номер телефона</label>
                            <input
                                type="text"
                                id="phoneNumber"
                                {...register('phoneNumber', { validate: validatePhoneNumber })}
                                onChange={handlePhoneNumberChange}
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
            {notificationState !== 'hidden' && (
                <div className={`notification ${notificationState}`}>
                    <img src={success} alt="notification" />
                    <span>{notificationMessage}</span>
                </div>
            )}
        </div>
    );
}

export default EditProfile;