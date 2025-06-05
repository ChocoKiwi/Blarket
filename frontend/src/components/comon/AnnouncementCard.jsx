import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import icons from '../../assets/icons/icons';
import '../../App.scss';
import Star from '../../assets/icons/star1.svg';
import successIcon from '../../assets/icons/sucsses.svg';

const AnnouncementCard = () => {
    const { id } = useParams(); // ID продукта
    const [announcement, setAnnouncement] = useState(null);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');

    // Форматирование цены
    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    // Отображение состояния товара
    const getConditionText = (condition) => {
        switch (condition) {
            case 'NEW':
                return 'Новое';
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

    // Переключение полного описания
    const toggleDescription = () => {
        setIsDescriptionExpanded(!isDescriptionExpanded);
    };

    // Увеличение количества
    const incrementQuantity = () => {
        if (quantity < announcement.quantity) {
            setQuantity(quantity + 1);
        }
    };

    // Уменьшение количества
    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const addToCart = async () => {
        if (quantity > announcement.quantity) {
            setNotificationMessage(`Нельзя добавить больше ${announcement.quantity} шт.`);
            setNotificationState('visible');
            setTimeout(() => setNotificationState('hiding'), 3000);
            setTimeout(() => setNotificationState('hidden'), 3500);
            return;
        }
        try {
            await api.post('/cart/add', { announcementId: id, quantity }, { withCredentials: true });
            setNotificationMessage('Товар добавлен в корзину!');
            setNotificationState('visible');
            setTimeout(() => setNotificationState('hiding'), 3000);
            setTimeout(() => setNotificationState('hidden'), 3500);
        } catch (e) {
            setNotificationMessage('Ошибка: ' + (e.response?.data?.message || e.message));
            setNotificationState('visible');
            setTimeout(() => setNotificationState('hiding'), 3000);
            setTimeout(() => setNotificationState('hidden'), 3500);
        }
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
        <div className="announcement-card" style={{ position: 'relative' }}>
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
            <div className="info-block">
                <div className="main-info">
                    <div className="categories">
                        {category?.parent?.name && (
                            <>
                                <span className="main-category">{category.parent.name}</span>
                                <span className="separator">—</span>
                            </>
                        )}
                        <span className="sub-category">{category?.child?.name || 'Без категории'}</span>
                    </div>
                    <h2 className="title">{announcement.title}</h2>
                    <div className="rating">
                        <div className="stars">
                            {[...Array(5)].map((_, index) => (
                                <span key={index} className="star">
                                    <img src={Star}/>
                                </span>
                            ))}
                            <span className="rating-text">
                                {announcement.rating || '0.0'} ({announcement.commentsCount || 0} отзывов)
                            </span>
                        </div>
                    </div>
                    <div className="price-status">
                        <span className="price">{formatPrice(announcement.price)} ₽</span>
                        <span className="status">{getConditionText(announcement.condition)}</span>
                    </div>
                    <div className="description">
                        <p className={`description-text ${isDescriptionExpanded ? '' : 'truncated'}`}>
                            {announcement.description}
                        </p>
                        {announcement.description?.length > 100 && (
                            <button className="read-more" onClick={toggleDescription}>
                                {isDescriptionExpanded ? 'Свернуть' : 'Читать далее'}
                            </button>
                        )}
                    </div>
                    <div className="button-quantity">
                        <div className="counter">
                            <button className="counter-btn" onClick={decrementQuantity} disabled={quantity <= 1}>
                                -
                            </button>
                            <span className="counter-value">{quantity}</span>
                            <button
                                className="counter-btn"
                                onClick={incrementQuantity}
                                disabled={quantity >= announcement.quantity}
                            >
                                +
                            </button>
                        </div>
                        <button className="buy-button" onClick={addToCart}>
                            В корзину
                        </button>
                    </div>
                </div>
                <div className="additional-info">
                    <p className="address"> <b>Адрес</b>{announcement.address || 'Адрес не указан'}</p>
                    <p className="quantity">
                        <b>Количество:</b>{announcement.quantity === 1 ? '1 шт.' : `${announcement.quantity} шт.`}
                    </p>
                    <p className="product-id"><b>ID товара:</b>{announcement.id}</p>
                </div>
            </div>
            {notificationState !== 'hidden' && (
                <div className={`notification ${notificationState}`}>
                    <img src={successIcon} alt="notification" />
                    <span>{notificationMessage}</span>
                </div>
            )}
        </div>
    );
};

export default AnnouncementCard;