// src/components/ui/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import api from '../../api';
import '../../App.scss';
import Star1 from '../../assets/icons/star1.svg';
import User from '../../assets/icons/solar_user-bold.svg';

const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const ProductCard = ({ id, imageUrl, title, authorName, price, condition, status, quantitySold, isOwnProfile, userId }) => {
    const addToCart = async () => {
        try {
            await api.post('/cart/add', { announcementId: id, quantity: 1 }, { withCredentials: true });
            alert('Товар добавлен в корзину');
        } catch (e) {
            alert('Ошибка: ' + (e.response?.data?.message || e.message));
        }
    };

    // Определяем отображаемый текст статуса
    const statusDisplay = {
        ACTIVE: 'Активно',
        BUSINESS: 'Бизнес',
        SOLD: 'Продано',
        DRAFT: 'Черновик',
        ARCHIVED: 'В архиве',
    };

    const isSold = status === 'SOLD';
    const buttonClass = `product-button ${isOwnProfile || isSold ? 'details-button' : 'cart-button'} ${isSold ? 'sold-button' : ''}`;

    return (
        <div className={`product-card ${status}`}>
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
                        <p className="condition">{condition || 'Не указано'}</p>
                    </div>
                </div>
                <button
                    onClick={isOwnProfile || isSold ? null : addToCart}
                    className={buttonClass}
                    disabled={isOwnProfile || isSold}
                >
                    {isSold ? `Продано: ${quantitySold} шт.` : (isOwnProfile ? 'Подробнее' : 'В корзину')}
                </button>
            </div>
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
    status: PropTypes.oneOf(['ACTIVE', 'BUSINESS', 'SOLD', 'DRAFT', 'ARCHIVED']), // Добавляем status
    isOwnProfile: PropTypes.bool,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default ProductCard;