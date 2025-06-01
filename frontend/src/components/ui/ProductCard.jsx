// src/components/ui/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import '../../App.scss';
import Star1 from '../../assets/icons/star1.svg';
import User from '../../assets/icons/solar_user-bold.svg';

const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const ProductCard = ({ id, imageUrl, title, authorName, price, condition, isOwnProfile }) => {
    return (
        <div className="product-card">
            <Link to={`/profile/ads/${id}`} className="product-image-link">
                <img src={imageUrl} alt={title} className="product-image" />
            </Link>
            <div className="product-main">
                <div className="under-button">
                    <Link to={`/profile/ads/${id}`} className="product-title-link">
                        <h3 className="product-title">{title}</h3>
                    </Link>
                    <div className="product-rating">
                        <div className="stars">
                            {Array(5).fill().map((_, index) => (
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
                <Link
                    to={`/announcement/${id}`}
                    className={`product-button ${isOwnProfile ? 'details-button' : 'cart-button'}`}
                >
                    {isOwnProfile ? 'Подробнее' : 'В корзину'}
                </Link>
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
    isOwnProfile: PropTypes.bool, // Новый пропс
};

export default ProductCard;