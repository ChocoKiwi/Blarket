import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import Header from '../comon/Header';
import '../../App.scss';

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
        if (transaction.type === 'PURCHASE' && transaction.announcementTitle) {
            return `Покупка товара (${transaction.announcementTitle})`;
        }
        switch (transaction.status) {
            case 'COMPLETED':
                return 'Пополнение счёта';
            case 'PENDING':
                return 'Ожидание пополнения';
            case 'FAILED':
                return 'Неудавшееся пополнение';
            default:
                return 'Неизвестная операция';
        }
    };

    return (
        <div className="main-container">
            <Header user={user} setUser={setUser} />
            <div className="stats-content">
                <h3>Статистика операций</h3>
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
                                <td>{getOperationName(tx)}</td>
                                <td>{tx.status}</td>
                                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                                <td>{tx.amount} руб.</td>
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
        </div>
    );
};

export default BuySellStatic;