import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '../comon/Header';
import CartItems from '../comon/cart/CartItems';
import Wallet from '../comon/cart/Wallet';
import ProfileProductList from '../comon/profile/ProfileProductList';
import BuySellStatic from '../comon/cart/BuySellStatic';
import api from '../../api';
import '../../App.scss';

const Cart = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(0);
    const [userState, setUserState] = useState(user);
    const [activeTab, setActiveTab] = useState('cart');
    const [cartItems, setCartItems] = useState([]);
    const [deferredItems, setDeferredItems] = useState([]);
    const [error, setError] = useState(null);
    const [notificationState, setNotificationState] = useState('hidden');
    const [notificationMessage, setNotificationMessage] = useState('');

    const showNotification = useCallback((title, action, type = 'success') => {
        const variations = [
            `Товар "${title}" теперь ${action}!`,
            `Готово! "${title}" успешно ${action}.`,
            `Успех! Товар "${title}" ${action}.`,
            `"${title}" теперь ${action}. Отлично!`
        ];
        const message = type === 'error' ? `Ошибка: ${title}` : variations[Math.floor(Math.random() * variations.length)];
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 2000);
        setTimeout(() => setNotificationState('hidden'), 2500);
    }, []);

    const fetchCart = useCallback(async () => {
        try {
            const { data } = await api.get('/cart?deferred=false', { withCredentials: true });
            setCartItems(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки корзины:', err);
            setCartItems([]);
            setError(err.response?.data?.message || 'Не удалось загрузить корзину');
            showNotification('Корзина не загружена', 'ошибка', 'error');
        }
    }, [showNotification]);

    const fetchDeferred = useCallback(async () => {
        try {
            const { data } = await api.get('/cart?deferred=true', { withCredentials: true });
            setDeferredItems(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки отложенных:', err);
            setDeferredItems([]);
            setError(err.response?.data?.message || 'Не удалось загрузить отложенные');
            showNotification('Отложенные не загружены', 'ошибка', 'error');
        }
    }, [showNotification]);

    useEffect(() => {
        fetchCart();
        fetchDeferred();
    }, [fetchCart, fetchDeferred]);

    const formatPrice = useCallback((price) => {
        return new Intl.NumberFormat('ru-RU', { style: 'decimal', minimumFractionDigits: 0 }).format(price);
    }, []);

    const formatDate = useCallback((date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }, []);

    const renderContent = useMemo(() => {
        if (error) {
            return (
                <div className="error-block">
                    <p className="error-text">{error}</p>
                    <button className="button" onClick={() => { fetchCart(); fetchDeferred(); }}>
                        Повторить
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'cart':
                return (
                    <CartItems
                        user={userState}
                        onLogout={onLogout}
                        setBalance={setBalance}
                        deferred={false}
                        cartItems={cartItems}
                        setCartItems={setCartItems}
                        setDeferredItems={setDeferredItems}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        showNotification={showNotification}
                    />
                );
            case 'purchases':
                return (
                    <ProfileProductList
                        user={userState}
                        onLogout={onLogout}
                        isPurchased={true}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                    />
                );
            case 'deferred':
                return (
                    <CartItems
                        user={userState}
                        onLogout={onLogout}
                        setBalance={setBalance}
                        deferred={true}
                        cartItems={deferredItems}
                        setCartItems={setCartItems}
                        setDeferredItems={setDeferredItems}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
                        showNotification={showNotification}
                    />
                );
            case 'stats':
                return <BuySellStatic user={userState} onLogout={onLogout} setUser={setUserState} />;
            default:
                return null;
        }
    }, [error, activeTab, userState, onLogout, cartItems, deferredItems, setBalance, setCartItems, setDeferredItems, formatPrice, formatDate, showNotification, fetchCart, fetchDeferred]);

    return (
        <div className="main-container">
            <Header user={userState} setUser={setUserState} />
            <div className="cart-container">
                <h2>Корзина</h2>
                <div className="status-filter">
                    {[
                        { id: 'cart', label: 'Корзина' },
                        { id: 'purchases', label: 'Покупки' },
                        { id: 'deferred', label: 'Отложенное' },
                        { id: 'stats', label: 'Статистика' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            className={`condition-chip ${activeTab === tab.id ? 'selected' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
                {renderContent}
                {notificationState !== 'hidden' && (
                    <div className={`notification ${notificationState}`}>
                        <img src="/src/assets/icons/sucsses.svg" alt="notification" />
                        <span>{notificationMessage}</span>
                    </div>
                )}
            </div>
            <Wallet
                user={userState}
                onLogout={onLogout}
                setBalance={setBalance}
                cartItems={cartItems}
                setCartItems={setCartItems}
                formatPrice={formatPrice}
                fetchCart={fetchCart}
            />
        </div>
    );
};

export default Cart;