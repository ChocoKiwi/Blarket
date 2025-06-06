import React, {useEffect, useCallback, useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import icons from '../../assets/icons/icons';
import successIcon from '../../assets/icons/sucsses.svg';
import '../../App.scss';

const CartItems = ({ user, onLogout, setBalance, itemStatus, cartItems, setCartItems, formatPrice, formatDate }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationState, setNotificationState] = useState('hidden');
    const [notificationMessage, setNotificationMessage] = useState('');
    const navigate = useNavigate();

    const showNotification = (title, action, type = 'success') => {
        const variations = [
            `Товар "${title}" теперь ${action}!`,
            `Готово! "${title}" успешно ${action}.`,
            `Успех! Товар "${title}" ${action}.`,
            `"${title}" теперь ${action}. Отлично!`
        ];
        const message = variations[Math.floor(Math.random() * variations.length)];
        setNotificationMessage(type === 'error' ? `Ошибка: ${title}` : message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 3000);
        setTimeout(() => setNotificationState('hidden'), 3500);
    };

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/cart?itemStatus=${itemStatus}`, { withCredentials: true });
            const filteredData = data.filter(item => item.itemStatus === itemStatus);
            setCartItems(filteredData);
            setLoading(false);
        } catch (e) {
            if (e.response?.status === 401) {
                setError('Неавторизован');
                onLogout();
                navigate('/login');
            } else {
                setError(e.response?.data?.message || 'Ошибка загрузки корзины');
                showNotification('Корзина не загружена', 'ошибка', 'error');
            }
            setLoading(false);
        }
    }, [onLogout, itemStatus, setCartItems, navigate]);

    const updateQuantity = useCallback(
        async (cartItemId, newQuantity) => {
            if (newQuantity < 1) return;
            try {
                const { data } = await api.put(`/cart/${cartItemId}`, { quantity: newQuantity }, { withCredentials: true });
                setCartItems(cartItems.map((item) => (item.id === cartItemId ? { ...item, quantity: data.quantity } : item)));
                showNotification(data.announcementTitle, 'количество обновлено');
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка обновления количества');
                showNotification('Ошибка обновления количества', 'ошибка', 'error');
            }
        },
        [cartItems, setCartItems]
    );

    const removeFromCart = useCallback(
        async (cartItemId) => {
            try {
                const item = cartItems.find(i => i.id === cartItemId);
                await api.delete(`/cart/${cartItemId}`, { withCredentials: true });
                setCartItems(cartItems.filter((item) => item.id !== cartItemId));
                showNotification(item.announcementTitle, 'удалён из корзины');
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка удаления товара');
                showNotification('Ошибка удаления товара', 'ошибка', 'error');
            }
        },
        [cartItems, setCartItems]
    );

    const deferItem = useCallback(
        async (cartItemId) => {
            try {
                const item = cartItems.find(i => i.id === cartItemId);
                const { data } = await api.put(`/cart/defer/${cartItemId}?defer=true`, null, { withCredentials: true });
                setCartItems(cartItems.filter((item) => item.id !== cartItemId));
                showNotification(item.announcementTitle, 'отложен');
                await fetchCart();
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка при отложении товара');
                showNotification('Ошибка при отложении товара', 'ошибка', 'error');
            }
        },
        [cartItems, setCartItems, fetchCart]
    );

    const restoreItem = useCallback(
        async (cartItemId) => {
            try {
                const item = cartItems.find(i => i.id === cartItemId);
                const { data } = await api.put(`/cart/defer/${cartItemId}?defer=false`, null, { withCredentials: true });
                setCartItems(cartItems.filter((item) => item.id !== cartItemId));
                showNotification(item.announcementTitle, 'восстановлен');
                await fetchCart();
            } catch (e) {
                setError(e.response?.data?.message || 'Ошибка при восстановлении товара');
                showNotification('Ошибка при восстановлении товара', 'ошибка', 'error');
            }
        },
        [cartItems, setCartItems, fetchCart]
    );

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error && !cartItems.length && itemStatus !== 'CART' && itemStatus !== 'DEFERRED') {
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
                <p>{itemStatus === 'DEFERRED' ? 'Нет отложенных товаров' : 'Корзина пуста'}</p>
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
                    <div className="card-item" key={item.id}>
                        <div className="cart-item">
                            <Link to={`/users/${user.id}/product/${item.announcementId}`}>
                                <img src={item.imageUrl || ''} alt={item.announcementTitle} className="cart-item-image" />
                            </Link>
                            <div className="cart-item-details">
                                <div className="title-button">
                                    <h3 style={{ whiteSpace: 'pre-line' }}>{item.announcementTitle}</h3>
                                    <div className="button-container">
                                        <div
                                            className="nav-link"
                                            onClick={() => (itemStatus === 'DEFERRED' ? restoreItem(item.id) : deferItem(item.id))}
                                        >
                                            <icons.archive className={'menu-icon'} />
                                            {itemStatus === 'DEFERRED' ? 'Восстановить' : 'Отложить'}
                                        </div>
                                        <div className="nav-link" onClick={() => removeFromCart(item.id)}>
                                            <icons.delete className={'menu-icon'} />
                                            Удалить
                                        </div>
                                    </div>
                                </div>
                                <div className="counter">
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
                                <p>{formatPrice(item.price)} ₽</p>
                            </div>
                        </div>
                    </div>
                ))}
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

export default CartItems;