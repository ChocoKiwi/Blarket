// src/components/pages/Cart.jsx
import React, { useState } from 'react';
import Header from '../comon/Header';
import CartItems from '../comon/CartItems';
import Wallet from '../comon/Wallet';
import '../../App.scss';

const Cart = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(0);
    const [userState, setUserState] = useState(user);

    return (
        <div className="main-container">
            <Header user={userState} setUser={setUserState} />
            <div className="cart-content">
                <CartItems user={userState} onLogout={onLogout} setBalance={setBalance} />
            </div>
            <Wallet user={userState} onLogout={onLogout} setBalance={setBalance} />
        </div>
    );
};

export default Cart;