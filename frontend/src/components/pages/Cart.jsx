// src/components/pages/Cart.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Wallet from '../comon/Wallet';
import '../../App.scss';

const Cart = ({ user, onLogout }) => {
    const [cartItems, setCartItems] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/cart', { withCredentials: true });
            setCartItems(data);
            setLoading(false);
        } catch (e) {
            setError(e.response?.status === 401 ? 'Неавторизован' : e.response?.data?.message || 'Ошибка загрузки корзины');
            if (e.response?.status === 401) onLogout();
            setLoading(false);
        }
    }, [onLogout]);

    const updateQuantity = useCallback(
        async (cartItemId, newQuantity) => {
            if (newQuantity < 1) return;
            try {
                const { data } = await api.put(`/cart/${cartItemId}`, { quantity: newQuantity }, { withCredentials: true });
                setCartItems(cartItems.map((item) => (item.id === cartItemId ? { ...item, quantity: data.quantity } : item)));
            } catch (e) {
                alert('Ошибка: ' + (e.response?.data?.message || e.message));
            }
        },
        [cartItems]
    );

    const removeFromCart = useCallback(
        async (cartItemId) => {
            try {
                await api.delete(`/cart/${cartItemId}`, { withCredentials: true });
                setCartItems(cartItems.filter((item) => item.id !== cartItemId));
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка удаления товара');
            }
        },
        [cartItems]
    );

    const handleCheckout = async () => {
        const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        if (totalPrice > balance) {
            alert('Недостаточно средств. Пополните кошелёк.');
            return;
        }
        try {
            await api.post('/orders/checkout', { cartItems }, { withCredentials: true });
            alert('Заказ успешно оформлен');
            setCartItems([]); // Очищаем корзину
            // Баланс обновится через Wallet
        } catch (e) {
            alert('Ошибка при оформлении: ' + (e.response?.data?.message || e.message));
        }
    };

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

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);

    return (
        <div className="cart">
            <h2>Корзина</h2>
            <Wallet user={user} onLogout={onLogout} setBalance={setBalance} />
            <div className="cart-items">
                {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                        <Link to={`/users/${user.id}/product/${item.announcementId}`}>
                            <img src={item.imageUrl || ''} alt={item.announcementTitle} className="cart-item-image" />
                        </Link>
                        <div className="cart-item-details">
                            <h3>{item.announcementTitle}</h3>
                            <p>Цена: {formatPrice(item.price)} ₽</p>
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
                            <p>Доступно: {item.availableQuantity} шт.</p>
                            <button className="remove-button" onClick={() => removeFromCart(item.id)}>
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="cart-total">
                <p>Итого: {formatPrice(totalPrice)} ₽</p>
                <button className="checkout-button" onClick={handleCheckout}>
                    Оформить заказ
                </button>
            </div>
        </div>
    );
};

export default Cart;