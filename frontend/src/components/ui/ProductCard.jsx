// src/components/ui/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import './App.scss'; // Отдельный CSS для стилей

const ProductCard = ({ id, imageUrl, title, authorName, price, condition }) => {
    return (
        <div className="product-card">
            <Link to={`/profile/announcements/${id}`}>
                <img src={imageUrl} alt={title} className="product-image" />
            </Link>
            <div className="product-main">
                <h3 className="product-title">{title}</h3>
                <div className="product-rating">
                    {Array(5).fill().map((_, index) => (
                        <span key={index} className="star-icon">★</span>
                    ))}
                    <span className="reviews-count">0 отзывов</span>
                </div>
                <div className="product-author">
                    <span className="author-icon">👤</span>
                    <span className="author-name">{authorName}</span>
                </div>
                <div className="product-price">
                    <p className="price">{price} ₽</p>
                    <p className="condition">{condition}</p>
                </div>
                <Link to={`/profile/announcements/${id}`} className="product-button">
                    Подробнее
                </Link>
            </div>
        </div>
    );
};

ProductCard.propTypes = {
    id: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    title: PropTypes.string.isRequired,
    authorName: PropTypes.string,
    price: PropTypes.number.isRequired,
    condition: PropTypes.string,
};

export default ProductCard;