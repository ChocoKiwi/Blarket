// src/components/comon/SellerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../comon/Header';
import ProfileProductList from '../comon/ProfileProductList';
import UserProfile from '../comon/UserProfile';
import '../../App.scss';

function SellerProfile({ user, onLogout }) {
    const { id } = useParams(); // ID продавца из маршрута /users/:id
    const [seller, setSeller] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSeller = async () => {
            try {
                const response = await api.get(`/user/${id}`, { withCredentials: true });
                if (response.data) {
                    setSeller(response.data);
                } else {
                    throw new Error('Данные продавца не получены');
                }
            } catch (err) {
                console.error('Ошибка при получении данных продавца:', err);
                if (err.response?.status === 401) {
                    setError('Неавторизован');
                    onLogout();
                    navigate('/login');
                } else if (err.response?.status === 404) {
                    setError('Пользователь не найден');
                } else {
                    setError('Не удалось загрузить данные продавца');
                }
            }
        };
        fetchSeller();
    }, [id, onLogout, navigate]);

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

    if (!seller) return <div className="text-center loading">Загрузка...</div>;

    return (
        <div className="main-container">
            <Header user={user} setUser={() => {}} />
            <div className="profile-content">
                <ProfileProductList user={seller} onLogout={onLogout} />
            </div>
            <UserProfile user={seller} />
        </div>
    );
}

export default SellerProfile;