import React, { useEffect, useState } from 'react';
import api from '../api';
import '../App.scss';

const NotificationDisplay = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/notifications/seller', { withCredentials: true });
            setNotifications(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки уведомлений');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    };

    if (loading) return <div className="text-center loading">Загрузка...</div>;
    if (error) return <div className="error-block"><p className="error-text">{error}</p></div>;
    if (!notifications.length) return <div className="cart-empty"><p>Нет уведомлений</p></div>;

    return (
        <div className="notifications-container">
            {notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                    <h3>Ваш товар {notification.announcementTitles.join(', ')} приобрели!</h3>
                    <p>Дата: {formatDate(notification.createdAt)}</p>
                    <p>Пользователь {notification.buyerName} успешно приобрел следующие товары:</p>
                    <ul>
                        {notification.announcementTitles.map((title, index) => (
                            <li key={index}>{title} ({notification.quantity} шт.)</li>
                        ))}
                    </ul>
                    <p>За цену: {notification.totalPrice} ₽</p>
                    <p>Доставку надлежит осуществить по адресу: {notification.deliveryAddress} {notification.postalCode}</p>
                </div>
            ))}
        </div>
    );
};

export default NotificationDisplay;