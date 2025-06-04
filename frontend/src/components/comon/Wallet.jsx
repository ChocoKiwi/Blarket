import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const Wallet = ({ user, onLogout }) => {
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [transactions, setTransactions] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();
    const hasCheckedPayment = useRef(false);

    useEffect(() => {
        console.log('useEffect triggered, location.search:', location.search);
        fetchWallet();
        fetchTransactionHistory();

        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transactionId');

        if (transactionId && !hasCheckedPayment.current) {
            console.log('Checking payment status for transactionId:', transactionId);
            hasCheckedPayment.current = true;
            checkPaymentStatus(transactionId);
            navigate('/wallet', { replace: true });
        }
    }, [location]);

    const fetchWallet = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/wallet', { withCredentials: true });
            setBalance(response.data.balance);
        } catch (error) {
            console.error('Ошибка получения баланса:', error);
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const fetchTransactionHistory = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/wallet/history', { withCredentials: true });
            setTransactions(response.data);
        } catch (error) {
            console.error('Ошибка получения истории транзакций:', error);
        }
    };

    const handleTopUp = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setMessage('Введите корректную сумму');
            return;
        }

        try {
            console.log('Initiating top-up with amount:', amount);
            const response = await axios.post('http://localhost:8080/api/wallet/top-up', { amount: parseFloat(amount) }, { withCredentials: true });
            hasCheckedPayment.current = false;
            console.log('Redirecting to YooMoney confirmation URL:', response.data);
            window.location.href = response.data;
        } catch (error) {
            setMessage('Ошибка при инициализации платежа: ' + (error.response?.data?.message || error.message));
            console.error('Error initiating top-up:', error);
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    const checkPaymentStatus = async (transactionId) => {
        try {
            console.log('Sending check-payment request for transactionId:', transactionId);
            const response = await axios.get(`http://localhost:8080/api/wallet/check-payment/${transactionId}`, { withCredentials: true });
            console.log('Payment status response:', response.data);
            if (response.data.status === 'COMPLETED') {
                setMessage('Транзакция успешна');
                await fetchWallet(); // Обновляем баланс с сервера
            } else {
                setMessage('Транзакция не удалась');
            }
            fetchTransactionHistory();
        } catch (error) {
            setMessage('Ошибка проверки статуса платежа');
            console.error('Error checking payment status:', error);
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    return (
        <div>
            <h2>Кошелёк</h2>
            <p>Текущий баланс: {balance} руб.</p>
            <div>
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Сумма пополнения"
                />
                <button onClick={handleTopUp}>Симулировать платёж</button>
            </div>
            {message && <p>{message}</p>}
            <h3>История транзакций</h3>
            <ul>
                {transactions.map(tx => (
                    <li key={tx.id}>
                        Сумма: {tx.amount} руб., Статус: {tx.status}, Дата: {new Date(tx.createdAt).toLocaleString()}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Wallet;