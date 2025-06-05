// AnnouncementsList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../../api';
import icons from '../../../../assets/icons/icons';
import successIcon from "../../../../assets/icons/sucsses.svg";

const AnnouncementsList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const abortControllerRef = useRef(null); // Для отмены запросов

    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    const showNotification = (title, action) => {
        const variations = [
            `Объявление "${title}" теперь ${action}!`,
            `Готово! "${title}" успешно ${action}.`,
            `Успех! Объявление "${title}" ${action}.`,
            `"${title}" теперь ${action}. Отлично!`
        ];
        const message = variations[Math.floor(Math.random() * variations.length)];
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 3000);
        setTimeout(() => setNotificationState('hidden'), 3500);
    };

    const fetchData = async () => {
        // Отменяем предыдущий запрос, если он существует
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Создаем новый AbortController
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setLoading(true);
        try {
            const url = selectedStatus ? `/announcements?status=${selectedStatus}` : '/announcements?status=ACTIVE,BUSINESS';
            const { data } = await api.get(url, { withCredentials: true, signal });
            if (!Array.isArray(data)) {
                throw new Error('Полученные данные не являются массивом');
            }
            setData(
                data.map((a) => ({
                    ...a,
                    imageUrls: a.imageUrls || [],
                    views: a.views || 0,
                    commentsCount: a.commentsCount || 0,
                }))
            );
            setLoading(false);
            setError(null); // Сбрасываем ошибку при успешной загрузке
        } catch (e) {
            if (e.name === 'AbortError') {
                console.log('Запрос отменен:', e);
                setLoading(false); // Сбрасываем loading, но не показываем ошибку
                return;
            }
            console.error('Ошибка загрузки объявлений:', e);
            if (e.response?.status === 401) {
                setError('Неавторизован');
                navigate('/');
            } else {
                setError(e.message || 'Ошибка загрузки объявлений');
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        // Выполняем запрос только если компонент смонтирован
        let isMounted = true;
        fetchData();

        // Очистка при размонтировании
        return () => {
            isMounted = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [selectedStatus]); // Убрали navigate из зависимостей

    const handleStatusChange = async (id, newStatus) => {
        const announcement = data.find((a) => a.id === id);
        if (!announcement) return;

        const actionLabel = {
            ARCHIVED: 'архивировано',
            ACTIVE: 'активное',
            RESTORED: 'восстановлено'
        }[newStatus];

        if (!window.confirm(`${newStatus === 'ARCHIVED' ? 'Архивировать' : newStatus === 'ACTIVE' ? 'Опубликовать' : 'Восстановить'} объявление "${announcement.title}"?`)) {
            return;
        }

        try {
            const { data: updated } = await api.put(
                `/announcements/${id}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            const newAnnouncementStatus = updated?.status || newStatus;

            setData((prevData) =>
                prevData.filter((a) => {
                    if (a.id === id) {
                        if (selectedStatus === null) {
                            return ['ACTIVE', 'BUSINESS'].includes(newAnnouncementStatus);
                        }
                        return newAnnouncementStatus === selectedStatus;
                    }
                    return true;
                })
            );

            showNotification(announcement.title, actionLabel);
        } catch (e) {
            console.error(`Ошибка при изменении статуса на ${newStatus}:`, e);
            if (e.response?.status === 401) {
                setError('Неавторизован');
                navigate('/');
            } else {
                setError(`Ошибка при ${newStatus === 'ARCHIVED' ? 'архивировании' : newStatus === 'ACTIVE' ? 'публикации' : 'восстановлении'}`);
            }
        }
    };

    const handleDelete = async (id) => {
        const announcement = data.find((a) => a.id === id);
        if (!announcement) return;

        if (!window.confirm(`Удалить объявление "${announcement.title}"?`)) return;

        try {
            await api.delete(`/announcements/${id}`, { withCredentials: true });
            setData(data.filter((a) => a.id !== id));
            showNotification(announcement.title, 'удалено');
        } catch (e) {
            console.error('Ошибка удаления:', e);
            if (e.response?.status === 401) {
                setError('Неавторизован');
                navigate('/');
            } else {
                setError('Ошибка при удалении объявления');
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            const isClickInsidePopup = e.target.closest('.popup') || e.target.closest('.icon-dots');
            if (!isClickInsidePopup) setOpenMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Обработчик переключения статуса с блокировкой во время загрузки
    const handleStatusSelect = (status) => {
        if (loading) return; // Блокируем переключение, если идет загрузка
        setSelectedStatus(status);
    };

    return (
        <div className="product-content">
            <h2>Мои объявления</h2>
            <div className="status-filter">
                <button
                    className={`condition-chip ${selectedStatus === null ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                    onClick={() => handleStatusSelect(null)}
                    disabled={loading}
                >
                    <span>Активные</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'BUSINESS' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                    onClick={() => handleStatusSelect('BUSINESS')}
                    disabled={loading}
                >
                    <span>Бизнес</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'DRAFT' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                    onClick={() => handleStatusSelect('DRAFT')}
                    disabled={loading}
                >
                    <span>Черновики</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'ARCHIVED' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                    onClick={() => handleStatusSelect('ARCHIVED')}
                    disabled={loading}
                >
                    <span>Архив</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'SOLD' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                    onClick={() => handleStatusSelect('SOLD')}
                    disabled={loading}
                >
                    <span>Проданные</span>
                </button>
            </div>
            {loading ? (
                <div className="text-center loading">Загрузка...</div>
            ) : error ? (
                <div className="error-block">
                    <p className="error-text">{error}</p>
                    {error !== 'Неавторизован' && (
                        <button
                            className="button"
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                                fetchData();
                            }}
                        >
                            Повторить
                        </button>
                    )}
                </div>
            ) : !data.length ? (
                <p className="text-placeholder">
                    Пусто :( Давайте{' '}
                    <Link to={`/profile/ads/select-category`} className="nav-link">
                        создадим
                    </Link>{' '}
                    ваше первое объявление!
                </p>
            ) : (
                <div className="grid">
                    {data.map((a) => (
                        <div key={a.id} className="container-product">
                            {a.imageUrls?.length > 0 && (
                                <Link to={`/profile/ads/${a.id}`} className="image-container">
                                    <img src={a.imageUrls[0]} alt={`Preview ${a.id}`} className="preview-image"/>
                                </Link>
                            )}
                            <div className="product-desc">
                                <div className="header-product">
                                    <div className="header-product title-quantity">
                                        <Link to={`/profile/ads/${a.id}`}>
                                            <h3>{a.title}</h3>
                                        </Link>
                                        <p>Осталось в наличии: {a.quantity === 1 ? '1 шт.' : `${a.quantity} шт.`}</p>
                                    </div>
                                    <div className="icon-dots" ref={menuRef}>
                                        <div className="nav-link" onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenu(openMenu === a.id ? null : a.id);
                                        }}>
                                            <icons.dots className="menu-icon"/>
                                        </div>
                                        {openMenu === a.id && (
                                            <div className="popup">
                                                <Link to={`/profile/ads/edit/${a.id}`} className="nav-link">
                                                    <icons.pen className="menu-icon"/>
                                                    Изменить объявление
                                                </Link>
                                                {a.status === 'ACTIVE' && (
                                                    <div className="nav-link"
                                                         onClick={() => handleStatusChange(a.id, 'ARCHIVED')}>
                                                        <icons.archive className="menu-icon"/>
                                                        Переместить в архив
                                                    </div>
                                                )}
                                                {a.status === 'BUSINESS' && (
                                                    <>
                                                        <Link to={`/announcements/stats/${a.id}`} className="nav-link">
                                                            <icons.chart className="menu-icon"/>
                                                            Общая статистика
                                                        </Link>
                                                        <div className="nav-link"
                                                             onClick={() => handleStatusChange(a.id, 'ARCHIVED')}>
                                                            <icons.archive className="menu-icon"/>
                                                            Переместить в архив
                                                        </div>
                                                    </>
                                                )}
                                                {a.status === 'DRAFT' && (
                                                    <>
                                                        <div className="nav-link"
                                                             onClick={() => handleStatusChange(a.id, 'ACTIVE')}>
                                                            <icons.publish className="menu-icon"/>
                                                            Опубликовать
                                                        </div>
                                                        <div className="nav-link"
                                                             onClick={() => handleStatusChange(a.id, 'ARCHIVED')}>
                                                            <icons.archive className="menu-icon"/>
                                                            Переместить в архив
                                                        </div>
                                                    </>
                                                )}
                                                {a.status === 'ARCHIVED' && (
                                                    <>
                                                        <div className="nav-link"
                                                             onClick={() => handleStatusChange(a.id, 'RESTORED')}>
                                                            <icons.rest className="menu-icon"/>
                                                            Восстановить
                                                        </div>
                                                        <div className="nav-link" onClick={() => handleDelete(a.id)}>
                                                            <icons.delete className="menu-icon"/>
                                                            Удалить
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="footer-product-container">
                                    <div className="price-condition">
                                        <p className="price">{formatPrice(a.price)} ₽</p>
                                        <p className={`condition ${a.status !== 'BUSINESS' ? 'hidden' : ''}`}>
                                            Бизнес
                                        </p>
                                    </div>
                                    <div className="stats">
                                        <p>
                                            <icons.eye className="menu-icon"/>
                                            {a.views}
                                        </p>
                                        <p>
                                            <icons.commentCount className="menu-icon"/>
                                            {a.commentsCount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {notificationState !== 'hidden' && (
                <div className={`notification ${notificationState}`}>
                    <img src={successIcon} alt="notification"/>
                    <span>{notificationMessage}</span>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsList;