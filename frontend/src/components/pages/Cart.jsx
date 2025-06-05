import React, { useState } from 'react';
import Header from '../comon/Header';
import CartItems from '../comon/CartItems';
import Wallet from '../comon/Wallet';
import ProfileProductList from '../comon/profile/ProfileProductList';
import BuySellStatic from '../comon/BuySellStatic';
import '../../App.scss';

const Cart = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(0);
    const [userState, setUserState] = useState(user);
    const [activeTab, setActiveTab] = useState('cart');
    const [cartItems, setCartItems] = useState([]);

    const tabs = [
        { id: 'cart', label: 'Корзина' },
        { id: 'purchases', label: 'Покупки' },
        { id: 'deferred', label: 'Отложенное' },
        { id: 'stats', label: 'Статистика' },
    ];

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
        switch (activeTab) {
            case 'cart':
                return (
                    <CartItems
                        user={userState}
                        onLogout={onLogout}
                        setBalance={setBalance}
                        itemStatus="CART"
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
                    <ProfileProductList
                        user={userState}
                        onLogout={onLogout}
                        isDeferred={true}
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
            <div className="cart-content">
                <div className="tabs-nav">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                {renderContent()}
            </div>
            <Wallet user={userState} onLogout={onLogout} setBalance={setBalance} cartItems={cartItems} formatPrice={formatPrice} />
        </div>
    );
};

export default Cart;