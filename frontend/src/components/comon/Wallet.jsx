import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WalletIcon from '../../assets/icons/solar_wallet-bold.svg';
import successIcon from '../../assets/icons/sucsses.svg';
import api from '../../api';
import '../../App.scss';

const Wallet = ({ user, onLogout, setBalance, cartItems, setCartItems, formatPrice }) => {
    const [balance, setLocalBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');
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
        if (!amount || parseInt(amount) <= 0) {
            showNotification('Введите корректную сумму', 'error');
            return;
        }
        try {
            const { data } = await api.post('/wallet/top-up', { amount: parseInt(amount) }, { withCredentials: true });
            hasCheckedPayment.current = false;
            window.location.href = data;
        } catch (error) {
            showNotification('Ошибка при пополнении: ' + (error.response?.data?.message || error.message), 'error');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const handleCheckout = async () => {
        if (!Array.isArray(cartItems) || !cartItems.length) {
            showNotification('Корзина пуста', 'error');
            return;
        }
        try {
            const response = await api.post('/orders/checkout', { cartItems }, { withCredentials: true });
            if (response.status === 200) {
                setCartItems([]); // Очищаем корзину на клиенте
                const variations = [
                    'Товары успешно куплены!',
                    'Готово! Заказ успешно оформлен.',
                    'Успех! Товары куплены.',
                    'Заказ оформлен. Отлично!'
                ];
                showNotification(variations[Math.floor(Math.random() * variations.length)]);
                await fetchWallet(); // Обновляем баланс
            }
        } catch (error) {
            showNotification('Ошибка при оформлении заказа: ' + (error.response?.data?.message || error.message), 'error');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const checkPaymentStatus = async (transactionId) => {
        try {
            const { data } = await api.get(`/wallet/check-payment/${transactionId}`, { withCredentials: true });
            if (data.status === 'COMPLETED') {
                showNotification('Пополнение успешно');
                await fetchWallet();
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

    useEffect(() => {
        fetchWallet();
        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transactionId');
        if (transactionId && !hasCheckedPayment.current) {
            hasCheckedPayment.current = true;
            checkPaymentStatus(transactionId);
        }
    }, [location]);

    const totalCost = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    const deliveryCost = 249;
    const discount = Math.floor(totalCost * 0.1);
    const finalCost = totalCost + deliveryCost - discount;

    return (
        <div className="wallet">
            <div className="wallet-balance-section">
                <div className="balance">
                    <div className="balance-info">
                        <img src={WalletIcon} />
                        <p>{formatPrice(balance)} ₽</p>
                    </div>
                    <div className="top-up-container">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Сумма"
                            className="input-field"
                        />
                        <button onClick={handleTopUp} className={'skibidi-button'}>Пополнить</button>
                    </div>
                </div>
            </div>
            <div className="wallet-info-section">
                <div className="info-header">
                    <div className={'skibidi-title'}>
                        <h3>Оплата заказа</h3>
                        <p className="text-placeholder">-10%</p>
                    </div>
                    <div className="radio-group">
                        <div className="custom-radio">
                            <input
                                type="radio"
                                id="payment-on-delivery"
                                name="payment"
                                value="on-delivery"
                            />
                            <span className="radio-mark"></span>
                            <label htmlFor="payment-on-delivery">При получении</label>
                        </div>
                        <div className="custom-radio">
                            <input
                                type="radio"
                                id="payment-immediate"
                                name="payment"
                                value="immediate"
                            />
                            <span className="radio-mark"></span>
                            <label htmlFor="payment-immediate">Сразу</label>
                        </div>
                    </div>
                    <div className="input">
                        <label htmlFor={"email"}>Адрес почтового отделения</label>
                        <input type="email" name="email" id="email" />
                    </div>
                    <div className="input">
                        <label htmlFor={"index"}>Почтовый индекс</label>
                        <input type="text" name={"index"} id="index" />
                    </div>
                </div>
                <div className="info-details">
                    <h3>Детали заказа</h3>
                    <div className="details">
                        <p>Товары ({Array.isArray(cartItems) ? cartItems.length : 0} шт.)</p>
                        <p>{formatPrice(totalCost)} руб.</p>
                    </div>
                    <div className="details">
                        <p>Доставка</p>
                        <p>{formatPrice(deliveryCost)} руб.</p>
                    </div>
                    <div className="details">
                        <p>Скидка</p>
                        <p>- {formatPrice(discount)} руб.</p>
                    </div>
                </div>
                <div className="total-and-button">
                    <div className="total">
                        <p>Итого</p>
                        <p>{formatPrice(finalCost)} руб.</p>
                    </div>
                    <button
                        className="button primary"
                        onClick={handleCheckout}
                        disabled={finalCost > balance || !Array.isArray(cartItems) || !cartItems.length}
                    >
                        Оформить заказ
                    </button>
                </div>
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

export default Wallet;