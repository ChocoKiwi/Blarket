// src/components/comon/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import '../../App.scss';
import UserAvatar from '../../assets/icons/user-avatar.svg';
import icons from '../../assets/icons/icons';

const getRoleDisplayName = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return 'Пользователь';
    }
    const normalizedRoles = roles.map(role => role.toUpperCase());
    if (normalizedRoles.includes('ADMIN')) return 'Администратор';
    if (normalizedRoles.includes('PRO')) return 'Предприниматель';
    if (normalizedRoles.includes('USER')) return 'Пользователь';
    return 'Не определено';
};

const UserProfile = ({ user }) => {
    const { id } = useParams(); // ID продавца из маршрута /users/:id
    const [seller, setSeller] = useState(user || null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(!user); // Если user передан, не загружаем
    const navigate = useNavigate();
    const isOwnProfile = user && seller && String(user.id) === String(id);

    useEffect(() => {
        if (!user) {
            const fetchSeller = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/user/${id}`, { withCredentials: true });
                    setSeller(response.data);
                    setLoading(false);
                    setError(null);
                } catch (err) {
                    console.error('Ошибка загрузки данных пользователя:', err);
                    if (err.response?.status === 401) {
                        setError('Неавторизован');
                        navigate('/login');
                    } else if (err.response?.status === 404) {
                        setError('Пользователь не найден');
                    } else {
                        setError('Ошибка загрузки данных');
                    }
                    setLoading(false);
                }
            };
            fetchSeller();
        }
    }, [id, user, navigate]);

    const handleLogout = async () => {
        try {
            await api.post('/logout', {}, { withCredentials: true });
            navigate('/login');
        } catch (err) {
            console.error('Ошибка при выходе:', err);
            navigate('/login');
        }
    };

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-block">
                <p className="error-text">{error}</p>
                <button className="button" onClick={() => navigate('/')}>
                    На главную
                </button>
            </div>
        );
    }

    if (!seller) {
        return <p className="text-placeholder">Пользователь не найден</p>;
    }

    return (
        <div className="profile-menu">
            <div className="avatar-text-container">
                <div className="avatar-container">
                    <img
                        src={seller.avatar || UserAvatar}
                        alt="Avatar"
                        className="avatar"
                        onError={() => console.error('Ошибка загрузки аватарки в UserProfile')}
                    />
                </div>
                <div className="username-container">
                    <p className="name">{seller.name || 'Без имени'}</p>
                    <p className="role">{getRoleDisplayName(seller.roles)}</p>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;