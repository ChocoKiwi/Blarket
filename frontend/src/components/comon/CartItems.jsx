import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import '../../App.scss';

const CartItems = ({ user, onLogout, setBalance, itemStatus, setCartItems, formatPrice, formatDate }) => {
    const [cartItems, setLocalCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/cart?status=${itemStatus}`, { withCredentials: true });
            setLocalCartItems(data);
            setCartItems(data);
            setLoading(false);
        } catch (e) {
            setError(e.response?.status === 401 ? 'Неавторизован' : e.response?.data?.message || 'Ошибка загрузки корзины');
            if (e.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
            setLoading(false);
        }
    }, [onLogout, itemStatus, setCartItems, navigate]);

    const updateQuantity = useCallback(
        async (cartItemId, newQuantity) => {
            if (newQuantity < 1) return;
            try {
                const { data } = await api.put(`/cart/${cartItemId}`, { quantity: newQuantity }, { withCredentials: true });
                const updatedItems = cartItems.map((item) => (item.id === cartItemId ? { ...item, quantity: data.quantity } : item));
                setLocalCartItems(updatedItems);
                setCartItems(updatedItems);
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка обновления количества');
            }
        },
        [cartItems, setCartItems]
    );

    const removeFromCart = useCallback(
        async (cartItemId) => {
            try {
                await api.delete(`/cart/${cartItemId}`, { withCredentials: true });
                const updatedItems = cartItems.filter((item) => item.id !== cartItemId);
                setLocalCartItems(updatedItems);
                setCartItems(updatedItems);
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка удаления товара');
            }
        },
        [cartItems, setCartItems]
    );

    const deferItem = useCallback(
        async (cartItemId) => {
            try {
                const { data } = await api.put(`/cart/defer/${cartItemId}?defer=true`, null, { withCredentials: true });
                const updatedItems = cartItems.filter((item) => item.id !== cartItemId); // Удаляем из текущей корзины
                setLocalCartItems(updatedItems);
                setCartItems(updatedItems);
                setError('Товар отложен');
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка при отложении товара');
            }
        },
        [cartItems, setCartItems]
    );

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-block">
                <p className="error-text">{error}</p>
                <button className="button" onClick={fetchCart}>
                    Повторить
                </button>
            </div>
        );
    }

    if (!cartItems.length) {
        return (
            <div className="cart-empty">
                <p>Корзина пуста</p>
                <Link to="/" className="button">
                    На главную
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-content">
            <h2>Корзина</h2>
            <div className="cart-items">
                {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                        <Link to={`/users/${user.id}/product/${item.announcementId}`}>
                            <img src={item.imageUrl || ''} alt={item.announcementTitle} className="cart-item-image" />
                        </Link>
                        <div className="cart-item-details">
                            <h3 style={{ whiteSpace: 'pre-line' }}>{`Покупка товара\n(${item.announcementTitle})`}</h3>
                            <p>Цена: {formatPrice(item.price)} руб.</p>
                            <div className="quantity-control">
                                <button
                                    className="counter-btn"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="counter-value">{item.quantity}</span>
                                <button
                                    className="counter-btn"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.availableQuantity}
                                >
                                    +
                                </button>
                            </div>
                            <button className="remove-button" onClick={() => removeFromCart(item.id)}>
                                Удалить
                            </button>
                            <button className="defer-button" onClick={() => deferItem(item.id)}>
                                Отложить
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CartItems;