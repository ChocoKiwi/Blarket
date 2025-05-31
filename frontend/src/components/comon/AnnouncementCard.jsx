// AnnouncementCard.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import icons from '../../assets/icons/icons';
import '../../App.scss'; // Assuming you'll create a separate CSS file for styling

const AnnouncementCard = () => {
    const { id } = useParams(); // Get announcement ID from URL
    const [announcement, setAnnouncement] = useState(null);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Format price with spaces (e.g., 100000 -> 100 000)
    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    // Map condition from DB to display text
    const getConditionText = (condition) => {
        switch (condition) {
            case 'NEW':
                return 'Новый';
            case 'USED':
                return 'Б/У';
            case 'BUYSELL':
                return 'Купля-продажа';
            default:
                return '';
        }
    };

    // Fetch announcement and category data
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch announcement by ID
            const { data: announcementData } = await api.get(`/announcements/${id}`, { withCredentials: true });
            setAnnouncement({
                ...announcementData,
                imageUrls: announcementData.imageUrls || [],
                views: announcementData.views || 0,
                commentsCount: announcementData.commentsCount || 0,
            });

            // Fetch category with parent if categoryId exists
            if (announcementData.categoryId) {
                const { data: categoryData } = await api.get(`/categories/with-parent/${announcementData.categoryId}`);
                setCategory(categoryData);
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

    // Set the first image as default when announcement loads
    useEffect(() => {
        if (announcement?.imageUrls?.length > 0) {
            setSelectedImage(announcement.imageUrls[0]);
        }
    }, [announcement]);

    // Handle image selection
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
            {/* Image and Content Container */}
            <div className="main-container">
                {/* Image Container */}
                <div className="phone-date-container">
                    {/* Preview Image */}
                    {selectedImage && (
                        <div className='image-upload'>
                            <img src={selectedImage} alt="Preview" className="preview-image"/>
                        </div>
                    )}
                    {/* Image Selection Container */}
                    {announcement.imageUrls.length > 0 && (
                        <div className="image-group">
                            {announcement.imageUrls.slice(0, 3).map((imageUrl, index) => (
                                <div className="image-upload swipe ">
                                    <img
                                        key={index}
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

                {/* Content Container */}
                <div className="content-container">
                    {/* Header and Main Content */}
                    <div className="main-content">
                        {/* Announcement Header */}
                        <div className="announcement-header">
                        {/* Rating and Breadcrumbs */}
                            <div className="rating-breadcrumbs">
                                {/* Rating */}
                                <div className="rating-container">
                                    <p className="rating">0.0</p>
                                    <Link to="#reviews" className="reviews-link">
                                        Нет отзывов
                                    </Link>
                                </div>
                                {/* Breadcrumbs */}
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
                            {/* Title */}
                            <h2>{announcement.title}</h2>
                        </div>
                        {/* Description */}
                        <p className="description">{announcement.description}</p>
                    </div>

                    {/* Footer */}
                    <div className="footer-container">
                        {/* Price and Condition */}
                        <div className="price-condition">
                            <p className="price">{formatPrice(announcement.price)} ₽</p>
                            <p className="condition">{getConditionText(announcement.itemCondition)}</p>
                        </div>
                        {/* Quantity */}
                        <p className="quantity">
                            Остаток: {announcement.quantity === 1 ? '1 шт.' : `${announcement.quantity} шт.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="reviews-section">
                <h2>Отзывы покупателей</h2>
                <div className="reviews-container">
                    {/* Placeholder for reviews (to be implemented later) */}
                    <p className="text-placeholder">Отзывы пока отсутствуют</p>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementCard;