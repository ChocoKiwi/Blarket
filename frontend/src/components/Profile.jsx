/* src/components/Profile.jsx */
import React, { useState, useEffect } from 'react';
import api from '../api';

// Компонент для отображения профиля пользователя
function Profile({ onLogout }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    // Загрузка данных пользователя при монтировании компонента
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data && response.data.username) {
                    setUser(response.data);
                } else {
                    throw new Error('Данные пользователя не получены');
                }
            } catch (err) {
                console.error('Ошибка при получении данных пользователя:', err);
                setError('Не удалось загрузить данные пользователя');
                onLogout(); // Вызываем logout при ошибке аутентификации
            }
        };

        fetchUser();
    }, [onLogout]);

    // Отображение загрузки или ошибки
    if (error) {
        return <div>{error}</div>;
    }

    if (!user) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            <h2>Профиль</h2>
            <p>Email: {user.email}</p>
            <p>Имя пользователя: {user.username}</p>
            <button onClick={async () => {
                try {
                    await api.post('/logout');
                    onLogout();
                } catch (err) {
                    console.error('Ошибка при выходе:', err);
                    onLogout(); // Выполняем выход даже при ошибке
                }
            }}>
                Выйти
            </button>
        </div>
    );
}

export default Profile;