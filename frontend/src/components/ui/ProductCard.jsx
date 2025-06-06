import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../api';
import '../../App.scss';
import Star1 from '../../assets/icons/star1.svg';
import User from '../../assets/icons/solar_user-bold.svg';
import successIcon from '../../assets/icons/sucsses.svg';

const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const ProductCard = ({ id, imageUrl, title, authorName, price, condition, status, quantitySold, isOwnProfile, userId, itemStatus, isPurchased, isDeferred, restoreItem }) => {
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');

    const showNotification = (message) => {
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 3000);
        setTimeout(() => setNotificationState('hidden'), 3500);
    };

    const addToCart = async () => {
        try {
            await api.post('/cart/add', { announcementId: id, quantity: 1 }, { withCredentials: true });
            const variations = [
                `Товар "${title}" добавлен в корзину!`,
                `Готово! "${title}" успешно добавлен.`,
                `Успех! Товар "${title}" в корзине.`,
                `"${title}" добавлен в корзину. Отлично!`
            ];
            showNotification(variations[Math.floor(Math.random() * variations.length)]);
        } catch (e) {
            showNotification(`Ошибка: ${e.response?.data?.message || e.message}`);
        }
    };

    const handleButtonClick = () => {
        if (itemStatus === 'DEFERRED') {
            restoreItem();
        } else {
            addToCart();
        }
    };

    const isSold = status === 'SOLD';
    const buttonClass = `product-button ${isOwnProfile || isSold ? 'details-button' : 'cart-button'} ${isSold ? 'sold-button' : ''}`;
    const buttonText = isSold ? `Продано: ${quantitySold} шт.` : isOwnProfile ? 'Подробнее' : itemStatus === 'DEFERRED' ? 'Восстановить' : 'В корзину';

    return (
        <div className={`product-card ${status}`} style={{ position: 'relative' }}>
            {isSold ? (
                <div className="product-image-link disabled">
                    <img src={imageUrl} alt={title} className="product-image" />
                </div>
            ) : (
                <Link to={`/users/${userId}/product/${id}`} className="product-image-link">
                    <img src={imageUrl} alt={title} className="product-image" />
                </Link>
            )}
            <div className="product-main">
                <div className="under-button">
                    {isSold ? (
                        <div className="product-title-link disabled">
                            <h3 className="product-title">{title}</h3>
                        </div>
                    ) : (
                        <Link to={`/users/${userId}/product/${id}`} className="product-title-link">
                            <h3 className="product-title">{title}</h3>
                        </Link>
                    )}
                    <div className="product-rating">
                        <div className="stars">
                            {Array(5)
                                .fill()
                                .map((_, index) => (
                                    <img key={index} src={Star1} className="full-star" alt="star" />
                                ))}
                        </div>
                        <span className="reviews-count">Нет отзывов</span>
                    </div>
                    <div className="product-author">
                        <img src={User} className="author-icon" alt="user" />
                        <span className="author-name">{authorName}</span>
                    </div>
                    <div className="product-price">
                        <p className="price">{formatPrice(price)} ₽</p>
                        {!(isPurchased || isDeferred) && (
                            <p className="condition">{condition || 'Не указано'}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={isOwnProfile || isSold ? null : handleButtonClick}
                    className={buttonClass}
                    disabled={isOwnProfile || isSold}
                >
                    {buttonText}
                </button>
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

ProductCard.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    imageUrl: PropTypes.string,
    title: PropTypes.string.isRequired,
    authorName: PropTypes.string,
    price: PropTypes.number.isRequired,
    condition: PropTypes.string,
    status: PropTypes.oneOf(['ACTIVE', 'BUSINESS', 'SOLD', 'DRAFT', 'ARCHIVED']),
    isOwnProfile: PropTypes.bool,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    itemStatus: PropTypes.oneOf(['CART', 'DEFERRED']),
    isPurchased: PropTypes.bool,
    isDeferred: PropTypes.bool,
    restoreItem: PropTypes.func,
};

export default ProductCard;