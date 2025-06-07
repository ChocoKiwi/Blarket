// src/components/comon/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import '../../../App.scss';
import UserAvatar from '../../../assets/icons/user-avatar.svg';
import Phone from '../../../assets/icons/phone.svg';
import Email from '../../../assets/icons/message.svg';

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

const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Ensure we have at least 10 digits
    if (digits.length < 10) return phone; // Return original if invalid
    // Format as 7 (XXX) XXX XX-XX
    const countryCode = digits.length === 11 ? digits[0] : '7';
    const areaCode = digits.substr(-10, 3);
    const firstPart = digits.substr(-7, 3);
    const secondPart = digits.substr(-4, 2);
    const thirdPart = digits.substr(-2, 2);
    return `${countryCode} (${areaCode}) ${firstPart} ${secondPart}-${thirdPart}`;
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
            <div className="contact-info">
                {seller.email && (
                    <div className="contact-item">
                        <img
                            src={Email}
                            alt="Email Icon"
                            className="contact-icon"
                            onError={() => console.error('Ошибка загрузки иконки email')}
                        />
                        <span className="contact-text email">{seller.email}</span>
                    </div>
                )}
                {seller.phone && (
                    <div className="contact-item">
                        <img
                            src={Phone}
                            alt="Phone Icon"
                            className="contact-icon"
                            onError={() => console.error('Ошибка загрузки иконки телефона')}
                        />
                        <span className="contact-text">{formatPhoneNumber(seller.phone)}</span>
                    </div>
                )}
            </div>
            <div className="button-container">
                <Link to={`/users/${seller.id}`} className="button">
                    Перейти в профиль
                </Link>
            </div>
        </div>
    );
};

export default UserProfile;