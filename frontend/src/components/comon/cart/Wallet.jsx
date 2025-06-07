import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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

    const { register, handleSubmit, formState: { errors } } = useForm({
        mode: 'onSubmit',
        defaultValues: {
            deliveryAddress: '',
            postalCode: ''
        }
    });

    const showNotification = (message, type = 'success') => {
        console.log(`[Wallet] Showing notification: ${message}, type: ${type}`);
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => {
            console.log('[Wallet] Notification state changing to hiding');
            setNotificationState('hiding');
        }, 3000);
        setTimeout(() => {
            console.log('[Wallet] Notification state changing to hidden');
            setNotificationState('hidden');
        }, 3500);
    };

    const fetchWallet = async () => {
        console.log('[Wallet] Fetching wallet balance for user:', user?.id);
        try {
            const { data } = await api.get('/wallet', { withCredentials: true });
            console.log('[Wallet] Wallet fetch successful, balance:', data.balance);
            setLocalBalance(data.balance);
            setBalance(data.balance);
        } catch (error) {
            console.error('[Wallet] Error fetching wallet:', error);
            showNotification('Ошибка загрузки баланса', 'error');
            if (error.response?.status === 401) {
                console.log('[Wallet] Unauthorized, logging out');
                onLogout();
                navigate('/login');
            }
        }
    };

    const handleTopUp = async () => {
        console.log('[Wallet] Initiating top-up with amount:', amount);
        if (!amount || parseInt(amount.replace(/\s/g, '')) <= 0) {
            console.log('[Wallet] Invalid amount entered');
            showNotification('Введите корректную сумму', 'error');
            return;
        }
        setIsTopUpLoading(true);
        try {
            console.log('[Wallet] Sending top-up request');
            const { data } = await api.post('/wallet/top-up', { amount: parseInt(amount.replace(/\s/g, '')) }, { withCredentials: true });
            console.log('[Wallet] Top-up response:', data);
            hasCheckedPayment.current = false;
            if (data && typeof data === 'string' && data.startsWith('http')) {
                console.log('[Wallet] Redirecting to payment URL:', data);
                window.location.href = data;
            } else {
                throw new Error('Некорректный URL для пополнения');
            }
        } catch (error) {
            console.error('[Wallet] Top-up error:', error);
            showNotification('Ошибка при пополнении: ' + (error.response?.data?.message || error.message), 'error');
            if (error.response?.status === 401) {
                console.log('[Wallet] Unauthorized during top-up, logging out');
                onLogout();
                navigate('/login');
            }
        } finally {
            console.log('[Wallet] Top-up loading complete');
            setIsTopUpLoading(false);
        }
    };

    const handleCheckout = async (formData) => {
        console.log('[Wallet] Initiating checkout, cartItems:', cartItems, 'formData:', formData);
        if (!Array.isArray(cartItems) || !cartItems.length) {
            console.log('[Wallet] Cart is empty or invalid');
            showNotification('Корзина пуста', 'error');
            return;
        }
        setIsCheckoutLoading(true);
        try {
            console.log('[Wallet] Calculating final cost');
            const finalCost = cartItems.reduce((sum, item) => {
                console.log('[Wallet] Reducing item for totalCost:', item);
                return sum + (item.price * item.quantity);
            }, 0) + 249 - Math.floor(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1);
            console.log('[Wallet] Final cost calculated:', finalCost);

            console.log('[Wallet] Using form data:', formData);
            const { deliveryAddress, postalCode } = formData;

            console.log('[Wallet] Grouping items by seller for notifications');
            const sellerNotifications = {};
            cartItems.forEach((item, index) => {
                console.log(`[Wallet] Processing cart item ${index}:`, item);
                const sellerId = item.userId;
                console.log(`[Wallet] Seller ID for item ${index}:`, sellerId);
                if (!sellerId) {
                    console.error(`[Wallet] No sellerId found for item ${index}:`, item);
                    return;
                }
                if (!sellerNotifications[sellerId]) {
                    sellerNotifications[sellerId] = {
                        sellerId,
                        announcementIds: [],
                        quantity: 0,
                        totalPrice: 0,
                        deliveryAddress,
                        postalCode
                    };
                }
                sellerNotifications[sellerId].announcementIds.push(item.announcementId);
                sellerNotifications[sellerId].quantity += item.quantity;
                sellerNotifications[sellerId].totalPrice += item.price * item.quantity;
                console.log(`[Wallet] Updated sellerNotifications for seller ${sellerId}:`, sellerNotifications[sellerId]);
            });

            console.log('[Wallet] Sending notifications for sellers:', Object.keys(sellerNotifications));
            for (const notification of Object.values(sellerNotifications)) {
                console.log('[Wallet] Sending notification:', notification);
                await api.post('/notifications', notification, { withCredentials: true });
                console.log('[Wallet] Notification sent successfully');
            }

            console.log('[Wallet] Sending checkout request');
            const response = await api.post('/orders/checkout', { cartItems, finalCost }, { withCredentials: true });
            console.log('[Wallet] Checkout response:', response);
            if (response.status === 200) {
                console.log('[Wallet] Checkout successful, clearing cart');
                setCartItems([]);
                const variations = [
                    'Товары успешно куплены!',
                    'Готово! Заказ успешно оформлен.',
                    'Успех! Товары куплены.',
                    'Заказ оформлен. Отлично!'
                ];
                const successMessage = variations[Math.floor(Math.random() * variations.length)];
                console.log('[Wallet] Showing success notification:', successMessage);
                showNotification(successMessage);
                await fetchWallet();
                if (fetchCart) await fetchCart();
            }
        } catch (error) {
            console.error('[Wallet] Checkout error:', error);
            showNotification('Ошибка при оформлении заказа: ' + (error.response?.data?.message || error.message), 'error');
            if (error.response?.status === 401) {
                console.log('[Wallet] Unauthorized during checkout, logging out');
                onLogout();
                navigate('/login');
            }
        } finally {
            console.log('[Wallet] Checkout loading complete');
            setIsCheckoutLoading(false);
        }
    };

    const checkPaymentStatus = async (transactionId) => {
        console.log('[Wallet] Checking payment status for transaction:', transactionId);
        try {
            const { data } = await api.get(`/wallet/check-payment/${transactionId}`, { withCredentials: true });
            console.log('[Wallet] Payment status response:', data);
            if (data.status === 'COMPLETED') {
                console.log('[Wallet] Payment completed successfully');
                showNotification('Пополнение успешно');
                await fetchWallet();
                if (fetchCart) await fetchCart();
            } else {
                console.log('[Wallet] Payment failed');
                showNotification('Пополнение не удалось', 'error');
            }
            navigate('/cart', { replace: true });
        } catch (error) {
            console.error('[Wallet] Error checking payment status:', error);
            showNotification('Ошибка проверки платежа', 'error');
            if (error.response?.status === 401) {
                console.log('[Wallet] Unauthorized during payment check, logging out');
                onLogout();
                navigate('/login');
            }
        }
    };

    const formatInputAmount = (value) => {
        console.log('[Wallet] Formatting input amount:', value);
        const cleanValue = value.replace(/[^0-9]/g, '');
        if (!cleanValue) return '';
        const formatted = parseInt(cleanValue).toLocaleString('ru-RU');
        return `${formatted} ₽`;
    };

    const handleAmountChange = (e) => {
        console.log('[Wallet] Handling amount change, input value:', e.target.value);
        const value = e.target.value;
        const cleanValue = value.replace(/[^0-9]/g, '');
        setAmount(formatInputAmount(cleanValue));
    };

    useEffect(() => {
        console.log('[Wallet] useEffect triggered, location:', location);
        fetchWallet();
        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transactionId');
        console.log('[Wallet] Transaction ID from URL:', transactionId);
        if (transactionId && !hasCheckedPayment.current) {
            console.log('[Wallet] Checking payment status');
            hasCheckedPayment.current = true;
            checkPaymentStatus(transactionId);
        }
    }, [location]);

    const { totalCost, deliveryCost, discount, finalCost } = useMemo(() => {
        console.log('[Wallet] Calculating cart totals, cartItems:', cartItems);
        const totalCost = Array.isArray(cartItems) ? cartItems.reduce((sum, item) => {
            console.log('[Wallet] Reducing item for totalCost:', item);
            return sum + (item.price * item.quantity);
        }, 0) : 0;
        const deliveryCost = 249;
        const discount = Math.floor(totalCost * 0.1);
        console.log('[Wallet] Calculated totals: totalCost:', totalCost, 'deliveryCost:', deliveryCost, 'discount:', discount);
        return {
            totalCost,
            deliveryCost,
            discount,
            finalCost: totalCost + deliveryCost - discount
        };
    }, [cartItems]);

    console.log('[Wallet] Rendering component, state:', { balance, amount, notificationState, isTopUpLoading, isCheckoutLoading });

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
                            console.log('[Wallet] Top-up link clicked');
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
                        <label htmlFor="deliveryAddress">Адрес почтового отделения</label>
                        <input
                            type="text"
                            id="deliveryAddress"
                            {...register('deliveryAddress', {
                                required: 'Адрес обязателен'
                            })}
                            className={errors.deliveryAddress ? 'input-field error' : 'input-field'}
                        />
                    </div>
                    <div className="input">
                        <label htmlFor="postalCode">Почтовый индекс</label>
                        <input
                            type="text"
                            id="postalCode"
                            {...register('postalCode', {
                                required: 'Почтовый индекс обязателен',
                                pattern: {
                                    value: /^\d{6}$/,
                                    message: 'Индекс должен состоять из 6 цифр'
                                },
                                maxLength: {
                                    value: 6,
                                    message: 'Индекс должен содержать ровно 6 цифр'
                                }
                            })}
                            className={errors.postalCode ? 'input-field error' : 'input-field'}
                        />
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
                        onClick={handleSubmit(handleCheckout)}
                        disabled={finalCost > balance || !Array.isArray(cartItems) || !cartItems.length || isCheckoutLoading}
                    >
                        {isCheckoutLoading ? 'Обработка...' : 'Оформить заказ'}
                    </button>
                    <div className="error-container">
                        {errors.deliveryAddress && (
                            <span className="error-message" style={{ marginTop: '10px' }}>
                                {errors.deliveryAddress.message}
                            </span>
                        )}
                        {errors.postalCode && (
                            <span className="error-message" style={{ marginTop: '10px' }}>
                                {errors.postalCode.message}
                            </span>
                        )}
                    </div>
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