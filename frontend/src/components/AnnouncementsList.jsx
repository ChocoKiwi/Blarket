import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import icons from '../assets/icons/icons';

/**
 * Компонент для отображения списка объявлений пользователя.
 */
const AnnouncementsList = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const formatPrice = price => price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get('/announcements', { withCredentials: true });
                if (!Array.isArray(data)) {
                    throw new Error('Полученные данные не являются массивом');
                }
                setData(data.map(a => ({
                    ...a,
                    imageUrls: a.imageUrls || [],
                    views: a.views || 0,
                    commentsCount: a.commentsCount || 0,
                    commentId: a.commentId || null
                })));
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
    }, [navigate]);

    const handleDelete = async id => {
        if (!window.confirm('Удалить объявление?')) return;
        try {
            await api.delete(`/announcements/${id}`, { withCredentials: true });
            setData(data.filter(a => a.id !== id));
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
        const handleClickOutside = e => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) return <div className="text-center py-8">Загрузка...</div>;

    if (error) return (
        <div className="text-center py-8 text-red-500">
            {error}
            {error !== 'Неавторизован' && (
                <button
                    className="ml-4 text-blue-500 underline"
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
            <h2 className="text">Мои объявления</h2>
            {!data.length ? (
                <p className="text-gray-500">
                    Пусто :( Давайте <Link to={`/profile/ads/create`} className="nav-link">создадим</Link> ваше первое объявление!
                </p>
            ) : (
                <div className="grid">
                    {data.map(a => (
                        <div key={a.id} className="container-product">
                            {a.imageUrls?.length > 0 && (
                                <div className="image-container product-image">
                                    <img src={a.imageUrls[0]} alt={`Preview ${a.id}`} className="w-full h-48 object-cover rounded" />
                                </div>
                            )}
                            <div className="product-desc">
                                <div className="header-product">
                                    <div className="header-product title-quantity">
                                        <h3 className="title">{a.title}</h3>
                                        <p>Осталось в наличии: {a.quantity === 1 ? '1 шт.' : `${a.quantity} шт.`}</p>
                                    </div>
                                    <div className="icon-dots" ref={menuRef}>
                                        <div className="nav-link" onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === a.id ? null : a.id); }}>
                                            <icons.dots className="menu-icon icon-dots" />
                                        </div>
                                        {openMenu === a.id && (
                                            <div className="popup">
                                                <Link to={`/profile/ads/edit/${a.id}`} className="nav-link">
                                                    <icons.pen className="menu-icon icon-edit" /> Изменить объявление
                                                </Link>
                                                <Link to={`/announcements/stats/${a.id}`} className="nav-link">
                                                    <icons.chart className="menu-icon icon-stats" /> Общая статистика
                                                </Link>
                                                <div className="nav-link" onClick={() => handleDelete(a.id)}>
                                                    <icons.delete className="menu-icon icon-delete" /> Переместить в архив
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="footer-product-container">
                                    <div className="price-condition">
                                        <p className="price">{formatPrice(a.price)} ₽</p>
                                        <p className={`condition ${['NEW', 'USED'].includes(a.condition) ? 'hidden' : ''}`}>
                                            {a.condition ? 'Бизнес' : 'Не указано'}
                                        </p>
                                    </div>
                                    <div className="stats">
                                        <p><icons.eye className="menu-icon icon-edit" /> {a.views}</p>
                                        <p><icons.commentCount className="menu-icon icon-edit" /> {a.commentsCount}</p>
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