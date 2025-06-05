// src/components/comon/Wallet.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api'; // Используем api вместо axios для единообразия

const Wallet = ({ user, onLogout, setBalance }) => {
    const [balance, setLocalBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const hasCheckedPayment = useRef(false);

    const fetchWallet = async () => {
        try {
            const { data } = await api.get('/wallet', { withCredentials: true });
            setLocalBalance(data.balance);
            setBalance(data.balance); // Обновляем баланс в Cart
        } catch (error) {
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            } else {
                setMessage('Ошибка загрузки баланса');
            }
        }
    };

    const fetchTransactionHistory = async () => {
        try {
            const { data } = await api.get('/wallet/history', { withCredentials: true });
            setTransactions(data);
        } catch (error) {
            setMessage('Ошибка загрузки истории транзакций');
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
            window.location.href = data; // Редирект на ЮMoney
        } catch (error) {
            setMessage('Ошибка при пополнении: ' + (error.response?.data?.message || error.message));
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
                setMessage('Пополнение успешно');
                await fetchWallet(); // Обновляем баланс
            } else {
                setMessage('Пополнение не удалось');
            }
            await fetchTransactionHistory();
            navigate('/cart', { replace: true }); // Редирект на /cart
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
        fetchTransactionHistory();

        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transactionId');
        if (transactionId && !hasCheckedPayment.current) {
            hasCheckedPayment.current = true;
            checkPaymentStatus(transactionId);
        }
    }, [location]);

    return (
        <div className="wallet">
            <h3>Кошелёк</h3>
            <p>Текущий баланс: {balance} руб.</p>
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
            {message && <p className="wallet-message">{message}</p>}
            <h4>История транзакций</h4>
            <ul className="transaction-list">
                {transactions.length ? (
                    transactions.map((tx) => (
                        <li key={tx.id}>
                            Сумма: {tx.amount} руб., Статус: {tx.status}, Дата: {new Date(tx.createdAt).toLocaleString()}
                        </li>
                    ))
                ) : (
                    <li>Нет транзакций</li>
                )}
            </ul>
        </div>
    );
};

export default Wallet;