import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import Header from '../Header';
import '../../../App.scss';

const BuySellStatic = ({ user, onLogout, setUser }) => {
    const [transactions, setTransactions] = useState([]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const fetchTransactionHistory = async () => {
        try {
            const { data } = await api.get('/wallet/history', { withCredentials: true });
            setTransactions(data);
        } catch (error) {
            setMessage('Ошибка загрузки истории транзакций');
            if (error.response?.status === 401) {
                onLogout();
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchTransactionHistory();
    }, []);

    const getOperationName = (transaction) => {
        if (transaction.announcementTitle) {
            return `Покупка товара\n(${transaction.announcementTitle})`;
        }
        return 'Пополнение счёта';
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const formatPrice = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'decimal',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatus = (transaction) => {
        switch (transaction.status) {
            case 'COMPLETED':
                return 'Завершено';
            case 'PENDING':
                return 'Ожидание';
            case 'FAILED':
                return 'Неудачно';
            default:
                return 'Неизвестно';
        }
    };

    return (
            <div className="stats-content">
                {message && <p className="stats-message">{message}</p>}
                <table className="transaction-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Операция</th>
                        <th>Статус</th>
                        <th>Дата</th>
                        <th>Сумма</th>
                    </tr>
                    </thead>
                    <tbody>
                    {transactions.length ? (
                        transactions.map((tx) => (
                            <tr key={tx.id}>
                                <td>{tx.id}</td>
                                <td style={{ whiteSpace: 'pre-line' }}>{getOperationName(tx)}</td>
                                <td>{getStatus(tx)}</td>
                                <td>{formatDate(tx.createdAt)}</td>
                                <td className={'price'}>{formatPrice(tx.amount)} ₽</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5">Нет транзакций</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
    );
};

export default BuySellStatic;