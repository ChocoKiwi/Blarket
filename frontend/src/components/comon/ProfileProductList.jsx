// src/pages/ProfileProductList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import ProductCard from '../ui/ProductCard';
import '../../App.scss'; // Отдельный CSS для стилей

const ProfileProductList = ({ userId }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProducts = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/announcements/user/${userId}`, { withCredentials: true });
                setProducts(response.data || []);
                setLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки товаров:', err);
                setError(err.response?.status === 401 ? 'Неавторизован' : 'Не удалось загрузить товары');
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserProducts();
        } else {
            setError('ID пользователя не указан');
            setLoading(false);
        }
    }, [userId]);

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-block">
                <p className="error-text">{error}</p>
                {error !== 'Неавторизован' && (
                    <button className="button" onClick={() => navigate(0)}>
                        Повторить
                    </button>
                )}
            </div>
        );
    }

    if (products.length === 0) {
        return <p className="text-placeholder">У вас пока нет товаров</p>;
    }

    return (
        <div className="profile-product-list">
            <h2>Мои товары</h2>
            <div className="products-grid">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        imageUrl={product.imageUrls?.[0] || 'https://via.placeholder.com/300x150'}
                        title={product.title}
                        authorName={product.user?.name || 'Неизвестный автор'}
                        price={product.price}
                        condition={product.condition}
                    />
                ))}
            </div>
        </div>
    );
};

ProfileProductList.propTypes = {
    userId: PropTypes.string.isRequired,
};

export default ProfileProductList;