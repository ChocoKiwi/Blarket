import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';

const Wallet = ({ user, onLogout, setBalance, cartItems }) => {
    const [balance, setLocalBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const hasCheckedPayment = useRef(false);

    const fetchWallet = async () => {
        try {
            const { data } = await api.get('/wallet', { withCredentials: true });
            setLocalBalance(data.balance);
            setBalance(data.balance);
        } catch (error) {
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            } else {
                setMessage('Ошибка загрузки баланса');
            }
        }
    };

    const handleTopUp = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setMessage('Введите корректную сумму');
            return;
        }
        try {
            const { data } = await api.post('/wallet/top-up', { amount: parseFloat(amount) }, { withCredentials: true });
            hasCheckedPayment.current = false;
            window.location.href = data;
        } catch (error) {
            setMessage('Ошибка при пополнении: ' + (error.response?.data?.message || error.message));
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const handleCheckout = async () => {
        if (!cartItems.length) {
            setMessage('Корзина пуста');
            return;
        }
        try {
            await api.post('/orders/checkout', { cartItems }, { withCredentials: true });
            setMessage('Заказ успешно оформлен');
            await fetchWallet();
        } catch (error) {
            setMessage('Ошибка при оформлении заказа: ' + (error.response?.data?.message || error.message));
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'decimal',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const checkPaymentStatus = async (transactionId) => {
        try {
            const { data } = await api.get(`/wallet/check-payment/${transactionId}`, { withCredentials: true });
            if (data.status === 'COMPLETED') {
                setMessage('Пополнение успешно');
                await fetchWallet();
            } else {
                setMessage('Пополнение не удалось');
            }
            navigate('/cart', { replace: true });
        } catch (error) {
            setMessage('Ошибка проверки платежа');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchWallet();
        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transactionId');
        if (transactionId && !hasCheckedPayment.current) {
            hasCheckedPayment.current = true;
            checkPaymentStatus(transactionId);
        }
    }, [location]);

    const totalCost = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="wallet">
            <h3>Кошелёк</h3>
            <p>Текущий баланс: {formatPrice(balance)} руб.</p>
            <p>Итоговая стоимость корзины: {formatPrice(totalCost)} руб.</p>
            <div className="wallet-top-up">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Сумма пополнения"
                    min="0"
                    step="0.01"
                />
                <button onClick={handleTopUp}>Пополнить</button>
            </div>
            <button onClick={handleCheckout} disabled={totalCost > balance || !cartItems.length}>
                Оформить заказ
            </button>
            {message && <p className="wallet-message">{message}</p>}
        </div>
    );
};

export default Wallet;