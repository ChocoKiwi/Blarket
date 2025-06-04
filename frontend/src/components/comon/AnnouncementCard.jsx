// src/components/comon/AnnouncementCard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import icons from '../../assets/icons/icons';
import '../../App.scss';

const AnnouncementCard = () => {
    const { id } = useParams(); // ID продукта
    const [announcement, setAnnouncement] = useState(null);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Форматирование цены
    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    // Отображение состояния товара
    const getConditionText = (condition) => {
        switch (condition) {
            case 'NEW':
                return 'Новый';
            case 'USED':
                return 'Б/У';
            case 'BUYSELL':
                return 'Купля-продажа';
            default:
                return 'Не указано';
        }
    };

    // Загрузка данных объявления и категории
    const fetchData = async () => {
        setLoading(true);
        try {
            // Запрос объявления
            const { data: announcementData } = await api.get(`/announcements/${id}`, { withCredentials: true });
            setAnnouncement({
                ...announcementData,
                imageUrls: Array.isArray(announcementData.imageUrls) ? announcementData.imageUrls : [],
                views: announcementData.views || 0,
                quantity: announcementData.quantity || 1,
                commentsCount: announcementData.commentsCount || 0,
            });

            // Запрос категории, если categoryId существует
            if (announcementData.categoryId) {
                const { data: categoryData } = await api.get(`/categories/with-parent/${announcementData.categoryId}`, { withCredentials: true });
                setCategory(categoryData);
            } else {
                setCategory({ child: { name: 'Без категории' } });
            }

            setLoading(false);
            setError(null);
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            if (e.response?.status === 401) {
                setError('Неавторизован');
            } else {
                setError(e.message || 'Ошибка загрузки данных');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    // Установка первого изображения по умолчанию
    useEffect(() => {
        if (announcement?.imageUrls?.length > 0) {
            setSelectedImage(announcement.imageUrls[0]);
        }
    }, [announcement]);

    // Обработка выбора изображения
    const handleImageSelect = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-block">
                <p className="error-text">{error}</p>
                {error !== 'Неавторизован' && (
                    <button className="button" onClick={fetchData}>
                        Повторить
                    </button>
                )}
            </div>
        );
    }

    if (!announcement) {
        return <p className="text-placeholder">Объявление не найдено</p>;
    }

    return (
        <div className="announcement-card">
            <div className="main-container">
                <div className="phone-date-container">
                    {selectedImage && (
                        <div className="image-upload">
                            <img src={selectedImage} alt="Preview" className="preview-image" />
                        </div>
                    )}
                    {announcement.imageUrls.length > 0 && (
                        <div className="image-group">
                            {announcement.imageUrls.slice(0, 3).map((imageUrl, index) => (
                                <div key={index} className="image-upload swipe">
                                    <img
                                        src={imageUrl}
                                        alt={`Thumbnail ${index + 1}`}
                                        className={`upload-label ${selectedImage === imageUrl ? 'selected' : ''}`}
                                        onClick={() => handleImageSelect(imageUrl)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="content-container">
                    <div className="main-content">
                        <div className="announcement-header">
                            <div className="rating-breadcrumbs">
                                <div className="rating-container">
                                    <p className="rating">{announcement.rating || '0.0'}</p>
                                    <Link to="#reviews" className="reviews-link">
                                        {announcement.commentsCount === 0 ? 'Нет отзывов' : `${announcement.commentsCount} отзывов`}
                                    </Link>
                                </div>
                                <div className="breadcrumbs">
                                    {category?.parent?.name && (
                                        <>
                                            <p>{category.parent.name}</p>
                                            <span>&gt;</span>
                                        </>
                                    )}
                                    <p>{category?.child?.name || 'Без категории'}</p>
                                </div>
                            </div>
                            <h2>{announcement.title}</h2>
                        </div>
                        <p className="description">{announcement.description}</p>
                    </div>

                    <div className="footer-container">
                        <div className="price-condition">
                            <p className="price">{formatPrice(announcement.price)} ₽</p>
                            <p className="condition">{getConditionText(announcement.condition)}</p>
                        </div>
                        <p className="quantity">
                            Остаток: {announcement.quantity === 1 ? '1 шт.' : `${announcement.quantity} шт.`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="reviews-section">
                <h2>Отзывы покупателей</h2>
                <div className="reviews-container">
                    <p className="text-placeholder">Отзывы пока отсутствуют</p>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementCard;