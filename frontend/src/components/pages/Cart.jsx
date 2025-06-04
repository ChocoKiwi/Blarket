// src/components/pages/Cart.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Wallet from '../comon/Wallet'; // Импортируем Wallet
import '../../App.scss';

const Cart = ({ user, onLogout }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(0); // Добавляем состояние для баланса

    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    const fetchCart = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/cart', { withCredentials: true });
            console.log('cartItems:', data);
            setCartItems(data);
            setLoading(false);
        } catch (e) {
            if (e.response?.status === 401) {
                setError('Неавторизован');
                onLogout();
            } else {
                setError(e.message || 'Ошибка загрузки корзины');
            }
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const response = await api.get('/wallet', { withCredentials: true });
            setBalance(response.data.balance);
        } catch (e) {
            if (e.response?.status === 401) {
                onLogout();
            } else {
                setError(e.message || 'Ошибка загрузки баланса');
            }
        }
    };

    const updateQuantity = async (cartItemId, newQuantity) => {
        try {
            await api.put(`/cart/${cartItemId}`, { quantity: newQuantity }, { withCredentials: true });
            setCartItems(
                cartItems.map((item) =>
                    item.id === cartItemId ? { ...item, quantity: newQuantity } : item
                )
            );
        } catch (e) {
            alert('Ошибка: ' + (e.response?.data?.message || e.message));
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            await api.delete(`/cart/${cartItemId}`, { withCredentials: true });
            setCartItems(cartItems.filter((item) => item.id !== cartItemId));
        } catch (e) {
            setError(e.message || 'Ошибка удаления товара');
        }
    };

    const handleCheckout = async () => {
        try {
            const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
            if (totalPrice > balance) {
                alert('Недостаточно средств на балансе. Пополните кошелёк.');
                return;
            }
            await api.post('/orders/checkout', { cartItems }, { withCredentials: true });
            alert('Заказ успешно оформлен');
            setCartItems([]); // Очищаем корзину
            await fetchBalance(); // Обновляем баланс
        } catch (e) {
            alert('Ошибка при оформлении заказа: ' + (e.response?.data?.message || e.message));
        }
    };

    useEffect(() => {
        fetchCart();
        fetchBalance();
    }, []);

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
            <Wallet user={user} onLogout={onLogout} setBalance={setBalance} /> {/* Интегрируем Wallet */}
            <div className="cart-items">
                {cartItems.map((item) => (
                    <div key={item.id} className="cart-item">
                        <Link to={`/users/${user.id}/product/${item.announcementId}`}>
                            <img
                                src={item.imageUrl || ''}
                                alt={item.announcementTitle}
                                className="cart-item-image"
                            />
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