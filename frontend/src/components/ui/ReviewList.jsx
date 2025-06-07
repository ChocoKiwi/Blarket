import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import Star0 from '../../assets/icons/star0.svg';
import Star1 from '../../assets/icons/star1.svg';
import '../../App.scss';

const ReviewList = () => {
    const { id } = useParams(); // Используем 'id' вместо 'productId'
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('[ReviewList] Извлечённые параметры маршрута:', { id });

        if (!id || id === 'undefined') {
            console.error('[ReviewList] Неверный или отсутствующий ID товара:', id);
            setError('Неверный ID товара');
            setLoading(false);
            return;
        }

        const fetchReviews = async () => {
            console.log('[ReviewList] Запрос отзывов для announcementId:', id);
            setLoading(true);
            try {
                const response = await api.get(`/ratings/announcement/${id}`, { withCredentials: true });
                console.log('[ReviewList] Ответ API:', response.data, response.status);
                setReviews(response.data || []);
                setLoading(false);
            } catch (e) {
                const errorMessage = e.response?.data[0]?.message || 'Ошибка загрузки отзывов';
                console.error('[ReviewList] Ошибка при загрузке:', {
                    message: errorMessage,
                    status: e.response?.status,
                    errorDetails: e.message,
                });
                setError(errorMessage);
                setLoading(false);
            }
        };

        fetchReviews();
    }, [id]);

    if (loading) {
        return <div className="text-center">Загрузка</div>;
    }

    if (error) {
        return <div className="error-block"><p className="error-text">{error}</p></div>;
    }

    if (reviews.length === 0) {
        console.log('[ReviewList] Отзывы отсутствуют для announcementId:', id);
        return <p className="text-center">Отзывы</p>;
    }

    return (
        <div className="review-list" style={{ marginTop: '20px' }}>
            <h3>Отзывы</h3>
            {reviews.map((review) => (
                <div key={review.id} className="Review-item" style={{
                    borderBottom: '1px solid black',
                    padding: '15px 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <div className="Review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                                src={review.userAvatar || '/path/to/default-avatar.jpg'}
                                alt="User Avatar"
                                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                            />
                            <div>
                                <span className="user-name" style={{ fontWeight: 'bold' }}>{review.userName || 'Без имени'}</span>
                                <span className="user-type" style={{ color: '#666', fontSize: '14px' }}>{review.userType || 'Пользователь'}</span>
                            </div>
                        </div>
                        <span className="Review-date" style={{ color: '#666', fontSize: '14px' }}>
              {new Date(review.createdAt).toLocaleDateString('ru-RU')}
            </span>
                    </div>
                    <div className="Review-content">
                        <h4 className="Review-title" style={{ margin: '10px 0' }}>{review.title}</h4>
                        <p className="Review-description">{review.description}</p>
                        <div className="Review-stars" style={{ display: 'flex', gap: '5px', margin: '10px 0' }}>
                            {Array(5).fill().map((_, index) => (
                                <img
                                    key={index}
                                    src={index < review.stars ? Star1 : Star0}
                                    alt={`star-${index + 1}`}
                                    style={{ width: '20px', height: '20px' }}
                                />
                            ))}
                        </div>
                        {review.imageUrls && review.imageUrls.length > 0 && (
                            <div className="Review-images" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {review.imageUrls.map((imageUrl, index) => (
                                    <img
                                        key={index}
                                        src={imageUrl}
                                        alt={`Review Image ${index + 1}`}
                                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReviewList;