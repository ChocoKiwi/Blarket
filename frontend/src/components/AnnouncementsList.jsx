import React, { useState, useEffect } from 'react';
import api from '../api';

const AnnouncementsList = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnnouncements = async () => {
        try {
            const response = await api.get('/announcements', {
                withCredentials: true,
            });
            const parsedAnnouncements = response.data.map(announcement => ({
                ...announcement,
                imageUrls: announcement.imageUrls ? JSON.parse(announcement.imageUrls) : [],
            }));
            setAnnouncements(parsedAnnouncements);
            setLoading(false);
        } catch (err) {
            setError('Не удалось загрузить объявления. Пожалуйста, попробуйте снова.');
            setLoading(false);
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Вы уверены, что хотите удалить это объявление?')) {
            return;
        }

        try {
            await api.delete(`/announcements/${id}`, {
                withCredentials: true,
            });
            // Удаляем объявление из состояния
            setAnnouncements(announcements.filter(announcement => announcement.id !== id));
        } catch (err) {
            setError('Не удалось удалить объявление. Пожалуйста, попробуйте снова.');
            console.error(err);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                {error}
                <button
                    className="ml-4 text-blue-500 underline"
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetchAnnouncements();
                    }}
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Список объявлений</h2>
            {announcements.length === 0 ? (
                <p className="text-gray-500">Нет доступных объявлений.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="border rounded-lg shadow-md p-4 bg-white hover:shadow-lg transition"
                        >
                            <h3 className="text-lg font-semibold">{announcement.title}</h3>
                            <p className="text-gray-600 mt-2">{announcement.description}</p>
                            <div className="mt-4">
                                <p><strong>Цена:</strong> {announcement.price} ₽</p>
                                <p><strong>Количество:</strong> {announcement.quantity}</p>
                                <p><strong>Город:</strong> {announcement.address || 'Не указан'}</p>
                                <p><strong>Состояние:</strong> {
                                    announcement.itemCondition
                                        ? (announcement.itemCondition === 'NEW' ? 'Новое' :
                                            announcement.itemCondition === 'USED' ? 'Б/у' :
                                                'Купли/Продажа')
                                        : 'Не указано'
                                }</p>
                            </div>
                            {Array.isArray(announcement.imageUrls) && announcement.imageUrls.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {announcement.imageUrls.map((url, index) => (
                                        <img
                                            key={index}
                                            src={url}
                                            alt={`Announcement ${announcement.id} image ${index + 1}`}
                                            className="w-24 h-24 object-cover rounded"
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="mt-4">
                                <button
                                    onClick={() => handleDelete(announcement.id)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnnouncementsList;