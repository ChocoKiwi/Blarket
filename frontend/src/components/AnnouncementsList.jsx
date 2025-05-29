// AnnouncementsList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import icons from '../assets/icons/icons';

const AnnouncementsList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null); // null для "Активные" (ACTIVE, BUSINESS)
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const formatPrice = (price) => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Если selectedStatus не указан, запрашиваем ACTIVE и BUSINESS
                const url = selectedStatus ? `/announcements?status=${selectedStatus}` : '/announcements?status=ACTIVE,BUSINESS';
                const { data } = await api.get(url, { withCredentials: true });
                if (!Array.isArray(data)) {
                    throw new Error('Полученные данные не являются массивом');
                }
                setData(
                    data.map((a) => ({
                        ...a,
                        imageUrls: a.imageUrls || [],
                        views: a.views || 0,
                        commentsCount: a.commentsCount || 0,
                        commentId: a.commentId || null,
                    }))
                );
                setLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки объявлений:', err);
                if (err.response?.status === 401) {
                    setError('Неавторизован');
                    navigate('/login');
                } else {
                    setError(err.message || 'Ошибка загрузки объявлений');
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [navigate, selectedStatus]);

    const handleArchive = async (id) => {
        if (!window.confirm('Архивировать объявление?')) return;
        try {
            await api.put(`/announcements/${id}/archive`, {}, { withCredentials: true });
            setData(data.filter((a) => a.id !== id));
        } catch (err) {
            console.error('Ошибка архивирования:', err);
            if (err.response?.status === 401) {
                setError('Неавторизован');
                navigate('/login');
            } else {
                setError('Ошибка при архивировании объявления');
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить объявление?')) return;
        try {
            await api.delete(`/announcements/${id}`, { withCredentials: true });
            setData(data.filter((a) => a.id !== id));
        } catch (err) {
            console.error('Ошибка удаления:', err);
            if (err.response?.status === 401) {
                setError('Неавторизован');
                navigate('/login');
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

    if (loading) return <div className="text-center">Загрузка...</div>;

    if (error) return (
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
    );

    return (
        <div className="product-content">
            <h2>Мои объявления</h2>
            <div className="status-filter">
                <button
                    className={`condition-chip ${selectedStatus === null ? 'selected' : ''}`}
                    onClick={() => setSelectedStatus(null)}
                >
                    <span>Активные</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'BUSINESS' ? 'selected' : ''}`}
                    onClick={() => setSelectedStatus('BUSINESS')}
                >
                    <span>Бизнес</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'DRAFT' ? 'selected' : ''}`}
                    onClick={() => setSelectedStatus('DRAFT')}
                >
                    <span>Черновики</span>
                </button>
                <button
                    className={`condition-chip ${selectedStatus === 'ARCHIVED' ? 'selected' : ''}`}
                    onClick={() => setSelectedStatus('ARCHIVED')}
                >
                    <span>Архивированные</span>
                </button>
            </div>
            {!data.length ? (
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
                                <div className="image-container">
                                    <img src={a.imageUrls[0]} alt={`Preview ${a.id}`} className="preview-image" />
                                </div>
                            )}
                            <div className="product-desc">
                                <div className="header-product">
                                    <div className="header-product title-quantity">
                                        <h3>{a.title}</h3>
                                        <p>Осталось в наличии: {a.quantity === 1 ? '1 шт.' : `${a.quantity} шт.`}</p>
                                        <p>Статус: {a.status}</p>
                                    </div>
                                    <div className="icon-dots" ref={menuRef}>
                                        <div className="nav-link" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === a.id ? null : a.id); }}>
                                            <icons.dots className="menu-icon" />
                                        </div>
                                        {openMenu === a.id && (
                                            <div className="popup">
                                                <Link to={`/profile/ads/edit/${a.id}`} className="nav-link">
                                                    <icons.pen className="menu-icon" /> Изменить объявление
                                                </Link>
                                                <Link to={`/announcements/stats/${a.id}`} className="nav-link">
                                                    <icons.chart className="menu-icon" /> Общая статистика
                                                </Link>
                                                <div className="nav-link" onClick={() => handleArchive(a.id)}>
                                                    <icons.archive className="menu-icon" /> Переместить в архив
                                                </div>
                                                <div className="nav-link" onClick={() => handleDelete(a.id)}>
                                                    <icons.delete className="menu-icon" /> Удалить
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="footer-product-container">
                                    <div className="price-condition">
                                        <p className="price">{formatPrice(a.price)} ₽</p>
                                        <p className={`condition ${['NEW', 'USED'].includes(a.condition) ? 'hidden' : ''}`}>
                                            {a.condition === 'BUYSELL' ? 'Бизнес' : 'Не указано'}
                                        </p>
                                    </div>
                                    <div className="stats">
                                        <p>
                                            <icons.eye className="menu-icon" /> {a.views}
                                        </p>
                                        <p>
                                            <icons.commentCount className="menu-icon" /> {a.commentsCount}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnnouncementsList;