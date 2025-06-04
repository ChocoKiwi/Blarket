// src/components/pages/ProductPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../comon/Header';
import AnnouncementCard from '../comon/AnnouncementCard';
import UserProfile from '../comon/UserProfile';
import '../../App.scss';

function ProductPage({ user, setUser, onLogout }) {
    const { userId, id } = useParams(); // userId = 2, id = 17
    const [announcement, setAnnouncement] = useState(null);
    const [seller, setSeller] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Загрузка объявления
                const announcementResponse = await api.get(`/announcements/${id}`, {
                    withCredentials: true,
                });
                setAnnouncement(announcementResponse.data);
                console.log('Announcement imageUrls:', announcementResponse.data.imageUrls);

                // Загрузка продавца
                const sellerResponse = await api.get(`/user/${userId}`, {
                    withCredentials: true,
                });
                setSeller(sellerResponse.data);

                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                if (err.response?.status === 401) {
                    setError('Неавторизован');
                    onLogout();
                    navigate('/login');
                } else if (err.response?.status === 404) {
                    setError(
                        err.response.data.message || 'Объявление или пользователь не найдены'
                    );
                } else {
                    setError('Не удалось загрузить данные');
                }
                setLoading(false);
            }
        };
        fetchData();
    }, [id, userId, onLogout, navigate]);

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

    return (
        <div className="main-container">
            <Header user={user} setUser={setUser} />
            <div className="profile-content">
                <AnnouncementCard />
            </div>
            <UserProfile user={seller} />
        </div>
    );
}

export default ProductPage;