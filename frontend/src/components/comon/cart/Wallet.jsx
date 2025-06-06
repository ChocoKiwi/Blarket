import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WalletIcon from '../../../assets/icons/solar_wallet-bold.svg';
import successIcon from '../../../assets/icons/sucsses.svg';
import api from '../../../api';
import '../../../App.scss';

const Wallet = ({ user, onLogout, setBalance, cartItems, setCartItems, formatPrice, fetchCart }) => {
    const [balance, setLocalBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');
    const [isTopUpLoading, setIsTopUpLoading] = useState(false);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const hasCheckedPayment = useRef(false);

    const showNotification = (message, type = 'success') => {
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 3000);
        setTimeout(() => setNotificationState('hidden'), 3500);
    };

    const fetchWallet = async () => {
        try {
            const { data } = await api.get('/wallet', { withCredentials: true });
            setLocalBalance(data.balance);
            setBalance(data.balance);
        } catch (error) {
            showNotification('Ошибка загрузки баланса', 'error');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const handleTopUp = async () => {
        if (!amount || parseInt(amount.replace(/\s/g, '')) <= 0) {
            showNotification('Введите корректную сумму', 'error');
            return;
        }
        setIsTopUpLoading(true);
        try {
            const { data } = await api.post('/wallet/top-up', { amount: parseInt(amount.replace(/\s/g, '')) }, { withCredentials: true });
            hasCheckedPayment.current = false;
            if (data && typeof data === 'string' && data.startsWith('http')) {
                window.location.href = data;
            } else {
                throw new Error('Некорректный URL для пополнения');
            }
        } catch (error) {
            showNotification('Ошибка при пополнении: ' + (error.response?.data?.message || error.message), 'error');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        } finally {
            setIsTopUpLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!Array.isArray(cartItems) || !cartItems.length) {
            showNotification('Корзина пуста', 'error');
            return;
        }
        setIsCheckoutLoading(true);
        try {
            const finalCost = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 249 - Math.floor(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1);
            const response = await api.post('/orders/checkout', { cartItems, finalCost }, { withCredentials: true });
            if (response.status === 200) {
                setCartItems([]);
                const variations = [
                    'Товары успешно куплены!',
                    'Готово! Заказ успешно оформлен.',
                    'Успех! Товары куплены.',
                    'Заказ оформлен. Отлично!'
                ];
                showNotification(variations[Math.floor(Math.random() * variations.length)]);
                await fetchWallet();
                if (fetchCart) await fetchCart();
            }
        } catch (error) {
            showNotification('Ошибка при оформлении заказа: ' + (error.response?.data?.message || error.message), 'error');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        } finally {
            setIsCheckoutLoading(false);
        }
    };

    const checkPaymentStatus = async (transactionId) => {
        try {
            const { data } = await api.get(`/wallet/check-payment/${transactionId}`, { withCredentials: true });
            if (data.status === 'COMPLETED') {
                showNotification('Пополнение успешно');
                await fetchWallet();
                if (fetchCart) await fetchCart();
            } else {
                showNotification('Пополнение не удалось', 'error');
            }
            navigate('/cart', { replace: true });
        } catch (error) {
            showNotification('Ошибка проверки платежа', 'error');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const formatInputAmount = (value) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        if (!cleanValue) return '';
        const formatted = parseInt(cleanValue).toLocaleString('ru-RU');
        return `${formatted} ₽`;
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        const cleanValue = value.replace(/[^0-9]/g, '');
        setAmount(formatInputAmount(cleanValue));
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

    const { totalCost, deliveryCost, discount, finalCost } = useMemo(() => {
        const totalCost = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
        const deliveryCost = 249;
        const discount = Math.floor(totalCost * 0.1);
        return {
            totalCost,
            deliveryCost,
            discount,
            finalCost: totalCost + deliveryCost - discount
        };
    }, [cartItems]);

    return (
        <div className="wallet">
            <div className="wallet-balance-section">
                <div className="balance">
                    <img src={WalletIcon} alt="wallet"/>
                    <p>{formatPrice(balance)} ₽</p>
                </div>
                <div className="top-up-container">
                    <input
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Сумма"
                        className="input-field"
                        disabled={isTopUpLoading}
                    />
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            handleTopUp();
                        }}
                        className="top-up-link"
                        disabled={isTopUpLoading}
                    >
                        {isTopUpLoading ? 'Загрузка...' : 'Пополнить'}
                    </a>
                </div>
            </div>
            <div className="wallet-info-section">
                <div className="info-header">
                    <div className="skibidi-title">
                        <h3>Оплата заказа</h3>
                        <p className="text-placeholder">-10%</p>
                    </div>
                    <div className="radio-group">
                        <div className="custom-radio">
                            <input type="radio" id="payment-on-delivery" name="payment" value="on-delivery"
                                   defaultChecked/>
                            <span className="radio-mark"></span>
                            <label htmlFor="payment-on-delivery">При получении</label>
                        </div>
                        <div className="custom-radio">
                            <input type="radio" id="payment-immediate" name="payment" value="immediate"/>
                            <span className="radio-mark"></span>
                            <label htmlFor="payment-immediate">Сразу</label>
                        </div>
                    </div>
                    <div className="input">
                        <label htmlFor="email">Адрес почтового отделения</label>
                        <input type="email" name="email" id="email" required/>
                    </div>
                    <div className="input">
                        <label htmlFor="index">Почтовый индекс</label>
                        <input type="text" name="index" id="index" required/>
                    </div>
                </div>
                <div className="info-details">
                    <h3>Детали заказа</h3>
                    <div className="details">
                        <p>Товары ({Array.isArray(cartItems) ? cartItems.length : 0} шт.)</p>
                        <p>{formatPrice(totalCost)} ₽</p>
                    </div>
                    <div className="details">
                        <p>Доставка</p>
                        <p>{formatPrice(deliveryCost)} ₽</p>
                    </div>
                    <div className="details">
                        <p>Скидка</p>
                        <p>- {formatPrice(discount)} ₽</p>
                    </div>
                </div>
                <div className="total-and-button">
                    <div className="total">
                        <p>Итого</p>
                        <p>{formatPrice(finalCost)} ₽</p>
                    </div>
                    <button
                        className="button primary"
                        onClick={handleCheckout}
                        disabled={finalCost > balance || !Array.isArray(cartItems) || !cartItems.length || isCheckoutLoading}
                    >
                        {isCheckoutLoading ? 'Обработка...' : 'Оформить заказ'}
                    </button>
                </div>
            </div>
            {notificationState !== 'hidden' && (
                <div className={`notification ${notificationState}`}>
                    <img src={successIcon} alt="notification"/>
                    <span>{notificationMessage}</span>
                </div>
            )}
        </div>
    );
};

export default Wallet;