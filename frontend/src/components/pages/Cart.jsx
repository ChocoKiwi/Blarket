// Cart.jsx
import React, { useEffect, useState, useCallback } from 'react';
import Header from '../comon/Header';
import CartItems from '../comon/cart/CartItems';
import Wallet from '../comon/cart/Wallet';
import ProfileProductList from '../comon/profile/ProfileProductList';
import BuySellStatic from '../comon/cart/BuySellStatic';
import axios from 'axios';
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

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await axios.get('/api/cart?itemStatus=CART', { withCredentials: true });
                setCartItems(Array.isArray(response.data) ? response.data : []);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки корзины:', err);
                setCartItems([]);
                setError('Не удалось загрузить корзину');
                showNotification('Корзина не загружена', 'ошибка', 'error');
            }
        };
        const fetchDeferred = async () => {
            try {
                const response = await axios.get('/api/cart?itemStatus=DEFERRED', { withCredentials: true });
                setDeferredItems(Array.isArray(response.data) ? response.data : []);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки отложенных:', err);
                setDeferredItems([]);
                setError('Не удалось загрузить отложенные');
                showNotification('Отложенные не загружены', 'ошибка', 'error');
            }
        };
        fetchCart();
        fetchDeferred();
    }, [showNotification]); // Зависимость только от showNotification

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'decimal',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const renderContent = () => {
        if (error) {
            return (
                <div className="error-block">
                    <p className="error-text">{error}</p>
                    <button className="button" onClick={() => window.location.reload()}>
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
                        itemStatus="CART"
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
                        itemStatus="DEFERRED"
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
    };

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
                {renderContent()}
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
            />
        </div>
    );
};

export default Cart;