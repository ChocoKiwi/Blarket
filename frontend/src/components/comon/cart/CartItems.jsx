import React, { useEffect, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../api';
import icons from '../../../assets/icons/icons';
import '../../../App.scss';

const CartItems = ({ user, onLogout, setBalance, deferred, cartItems, setCartItems, setDeferredItems, formatPrice, formatDate, showNotification }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/cart?deferred=${deferred}`, { withCredentials: true });
            if (!deferred) {
                setCartItems(data);
            } else {
                setDeferredItems(data);
            }
        } catch (e) {
            if (e.response?.status === 401) {
                setError('Неавторизован');
                onLogout();
                navigate('/login');
            } else {
                setError(e.response?.data?.message || 'Ошибка загрузки корзины');
                showNotification('Корзина не загружена', 'ошибка', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [deferred, setCartItems, setDeferredItems, onLogout, navigate, showNotification]);

    const updateQuantity = useCallback(
        async (cartItemId, newQuantity, setLoadingItem = () => {}) => {
            if (newQuantity < 1) return;
            setLoadingItem(true);
            try {
                const { data } = await api.put(`/cart/${cartItemId}`, { quantity: newQuantity }, { withCredentials: true });
                if (!deferred) {
                    setCartItems(prev => prev.map(item => (item.id === cartItemId ? { ...item, quantity: data.quantity } : item)));
                    showNotification(data.announcementTitle || 'Товар', 'количество обновлено');
                } else {
                    setDeferredItems(prev => prev.map(item => (item.id === cartItemId ? { ...item, quantity: data.quantity } : item)));
                }
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка обновления количества');
                showNotification('Ошибка обновления количества', 'ошибка', 'error');
            } finally {
                setLoadingItem(false);
            }
        },
        [deferred, setCartItems, setDeferredItems, showNotification]
    );

    const removeFromCart = useCallback(
        async (cartItemId, setLoadingItem = () => {}) => {
            setLoadingItem(true);
            try {
                const item = cartItems.find(i => i.id === cartItemId);
                if (!item) return;
                await api.delete(`/cart/${cartItemId}`, { withCredentials: true });
                if (!deferred) {
                    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
                    showNotification(item.announcementTitle || 'Товар', 'удалён из корзины');
                } else {
                    setDeferredItems(prev => prev.filter(item => item.id !== cartItemId));
                    showNotification(item.announcementTitle || 'Товар', 'удалён из отложенных');
                }
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка удаления товара');
                showNotification('Ошибка удаления товара', 'ошибка', 'error');
            } finally {
                setLoadingItem(false);
            }
        },
        [cartItems, deferred, setCartItems, setDeferredItems, showNotification]
    );

    const deferItem = useCallback(
        async (cartItemId, setLoadingItem = () => {}) => {
            setLoadingItem(true);
            try {
                const item = cartItems.find(i => i.id === cartItemId);
                if (!item) return;
                const { data } = await api.put(`/cart/defer/${cartItemId}?defer=true`, null, { withCredentials: true });
                setCartItems(prev => prev.filter(item => item.id !== cartItemId));
                setDeferredItems(prev => [...prev, data]);
                showNotification(item.announcementTitle || 'Товар', 'отложен');
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка при отложении товара');
                showNotification('Ошибка при отложении товара', 'ошибка', 'error');
            } finally {
                setLoadingItem(false);
            }
        },
        [cartItems, setCartItems, setDeferredItems, showNotification]
    );

    const restoreItem = useCallback(
        async (cartItemId, setLoadingItem = () => {}) => {
            setLoadingItem(true);
            try {
                const item = cartItems.find(i => i.id === cartItemId);
                if (!item) return;
                const { data } = await api.put(`/cart/defer/${cartItemId}?defer=false`, null, { withCredentials: true });
                setDeferredItems(prev => prev.filter(item => item.id !== cartItemId));
                setCartItems(prev => [...prev, data]);
                showNotification(item.announcementTitle || 'Товар', 'восстановлен в корзину');
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка при восстановлении товара');
                showNotification('Ошибка при восстановлении товара', 'ошибка', 'error');
            } finally {
                setLoadingItem(false);
            }
        },
        [cartItems, setCartItems, setDeferredItems, showNotification]
    );

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error && !cartItems.length) {
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
                <p>{deferred ? 'Нет отложенных товаров' : 'Корзина пуста'}</p>
                <Link to="/" className="button">
                    На главную
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-content">
            <div className="cart-items">
                {cartItems.map((item) => (
                    <CartItem
                        key={item.id}
                        item={item}
                        user={user}
                        deferred={deferred}
                        updateQuantity={updateQuantity}
                        removeFromCart={removeFromCart}
                        deferItem={deferItem}
                        restoreItem={restoreItem}
                        formatPrice={formatPrice}
                    />
                ))}
            </div>
        </div>
    );
};

const CartItem = ({ item, user, deferred, updateQuantity, removeFromCart, deferItem, restoreItem, formatPrice }) => {
    const [loadingItem, setLoadingItem] = useState(false);

    return (
        <div className="card-item">
            <div className="cart-item">
                <Link to={`/users/${user.id}/product/${item.announcementId}`}>
                    <img src={item.imageUrl || ''} alt={item.announcementTitle || 'Товар'} className="cart-item-image" loading="lazy" />
                </Link>
                <div className="cart-item-details">
                    <div className="title-button">
                        <Link to={`/users/${user.id}/product/${item.announcementId}`}>
                            <h3 style={{ whiteSpace: 'pre-line'}}>{item.announcementTitle || 'Товар'}</h3>
                        </Link>
                        <div className="button-container">
                            <div
                                className="nav-link"
                                onClick={() => (deferred ? restoreItem(item.id, setLoadingItem) : deferItem(item.id, setLoadingItem))}
                                disabled={loadingItem}
                            >
                                <icons.archive className="menu-icon" />
                                {deferred ? 'Восстановить' : 'Отложить'}
                            </div>
                            <div className="nav-link" onClick={() => removeFromCart(item.id, setLoadingItem)} disabled={loadingItem}>
                                <icons.delete className="menu-icon" />
                                Удалить
                            </div>
                        </div>
                    </div>
                    <div className="counter">
                        <button
                            className="counter-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, setLoadingItem)}
                            disabled={item.quantity <= 1 || loadingItem}
                        >
                            -
                        </button>
                        <span className="counter-value">{item.quantity}</span>
                        <button
                            className="counter-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, setLoadingItem)}
                            disabled={item.quantity >= item.availableQuantity || loadingItem}
                        >
                            +
                        </button>
                    </div>
                    <p>{formatPrice(item.price)} ₽</p>
                    {loadingItem && <span className="loading-text">Обработка...</span>}
                </div>
            </div>
        </div>
    );
};

export default CartItems;