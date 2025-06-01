// src/components/comon/ProfileProductList.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import ProductCard from '../ui/ProductCard';
import '../../App.scss';

const ProfileProductList = ({ user, onLogout }) => {
    const { id } = useParams(); // Получаем ID пользователя из URL
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            try {
                // Запрашиваем объявления пользователя по ID с фильтром по статусам ACTIVE и BUSINESS
                const response = await api.get(`/announcements?status=ACTIVE,BUSINESS`, {
                    withCredentials: true,
                });
                setAnnouncements(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки объявлений:', err);
                if (err.response?.status === 401) {
                    setError('Неавторизован');
                    onLogout();
                } else {
                    setError('Ошибка загрузки объявлений');
                }
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, [id, onLogout]);

    // Функция для преобразования условия товара в текст
    const getConditionText = (condition) => {
        switch (condition) {
            case 'NEW':
                return 'Новый';
            case 'USED':
                return 'Б/У';
            case 'BUYSELL':
                return 'Перепродажа';
            default:
                return '';
        }
    };

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-block">
                <p className="error-text">{error}</p>
                <button className="button" onClick={() => window.location.reload()}>
                    Повторить
                </button>
            </div>
        );
    }

    return (
        <div className="profile-product-list">
            <h2>Объявления пользователя</h2>
            {announcements.length === 0 ? (
                <p className="text-placeholder">Объявления отсутствуют</p>
            ) : (
                <div className="product-list">
                    {announcements.map((announcement) => (
                        <ProductCard
                            key={announcement.id}
                            id={announcement.id}
                            imageUrl={announcement.imageUrls?.[0] || ''}
                            title={announcement.title}
                            authorName={user?.name || 'Без имени'}
                            price={announcement.price ? parseFloat(announcement.price) : 0}
                            condition={getConditionText(announcement.condition)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfileProductList;