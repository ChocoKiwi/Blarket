import React, { useEffect, useState } from 'react';
import Header from '../comon/Header';
import CartItems from '../comon/CartItems';
import Wallet from '../comon/Wallet';
import ProfileProductList from '../comon/profile/ProfileProductList';
import BuySellStatic from '../comon/BuySellStatic';
import axios from 'axios';
import '../../App.scss';

const Cart = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(0);
    const [userState, setUserState] = useState(user);
    const [activeTab, setActiveTab] = useState('cart');
    const [cartItems, setCartItems] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCart = async () => {
            try {
                const response = await axios.get('/api/cart', { withCredentials: true });
                setCartItems(Array.isArray(response.data) ? response.data : []);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки корзины:', err);
                setCartItems([]);
                setError('Не удалось загрузить корзину');
            }
        };
        fetchCart();
    }, []);

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
                        formatPrice={formatPrice}
                        formatDate={formatDate}
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
                        cartItems={cartItems}
                        setCartItems={setCartItems}
                        formatPrice={formatPrice}
                        formatDate={formatDate}
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