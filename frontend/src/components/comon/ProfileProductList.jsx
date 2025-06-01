import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api';
import ProductCard from '../ui/ProductCard';
import SearchAndFilter from '../ui/SearchAndFilter';
import '../../App.scss';
import icons from '../../assets/icons/icons';
import check from '../../assets/icons/sucsses.svg';

const ProfileProductList = ({ user, onLogout }) => {
    const { id } = useParams();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSort, setSelectedSort] = useState('самые популярные');
    const [selectedSortValue, setSelectedSortValue] = useState('popularity');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null); // Для фильтрации ACTIVE,BUSINESS
    const timeoutRef = useRef(null);
    const [userData, setUserData] = useState(null);

    // Функция для получения текста состояния товара
    const getConditionText = (condition) => {
        switch (condition) {
            case 'NEW':
                return 'Новое';
            case 'USED':
                return 'Б/У';
            case 'BUYSELL':
                return 'Перепродажа';
            default:
                return 'Не указано';
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get(`/user/${id}`, {
                    withCredentials: true,
                });
                setUserData(response.data);
            } catch (err) {
                console.error('Ошибка загрузки данных пользователя:', err);
            }
        };
        fetchUserData();
    }, [id]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            try {
                const url = selectedStatus
                    ? `/announcements/user/${id}?status=${selectedStatus}&sort=${selectedSortValue}`
                    : `/announcements/user/${id}?status=ACTIVE,BUSINESS&sort=${selectedSortValue}`;
                const response = await api.get(url, {
                    withCredentials: true,
                });
                setAnnouncements(response.data || []);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки объявлений:', err);
                if (err.response?.status === 401) {
                    setError('Неавторизован');
                    onLogout();
                } else if (err.response?.status === 404) {
                    setError('Пользователь или объявления не найдены');
                } else {
                    setError('Ошибка загрузки объявлений');
                }
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, [id, selectedStatus, selectedSortValue, onLogout]);

    const handleOptionSelect = (option, value) => {
        setSelectedSort(option);
        setSelectedSortValue(value);
        setIsMenuOpen(false);
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsMenuOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsMenuOpen(false);
        }, 200);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleStatusSelect = (status) => {
        if (loading) return; // Block status change during loading
        setSelectedStatus(status);
    };

    if (loading) {
        return <div className="text-center loading">Загрузка...</div>;
    }

    if (error) {
        return (
            <div className="error-block">
                <p className="error-text">{error}</p>
                <button className="button" onClick={() => window.location.reload()}>
                    Повторить
                </button>
            </div>
        );
    }

    return (
        <div className="profile-product-list">
            <SearchAndFilter />
            <div className='flex'>
                <div className='title-sort'>
                    <h2>Объявления пользователя</h2>
                    <div className="filter-sort-container">
                        <div
                            className="sort-container"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <img src={icons.sort} alt="sort" />
                            <div className="sort-button">{selectedSort}</div>
                            <div
                                className={`sort-menu ${isMenuOpen ? 'sort-menu--open' : ''}`}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div
                                    className="sort-option"
                                    data-value="popularity"
                                    onClick={() => handleOptionSelect('самые популярные', 'popularity')}
                                >
                                    <span className="sort-option-text">самые популярные</span>
                                    {selectedSort === 'самые популярные' && (
                                        <img src={check} alt='icon' />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="newest"
                                    onClick={() => handleOptionSelect('самые новые', 'newest')}
                                >
                                    <span className="sort-option-text">самые новые</span>
                                    {selectedSort === 'самые новые' && (
                                        <img src={check} alt='icon' />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="expensive"
                                    onClick={() => handleOptionSelect('сначала дорогие', 'expensive')}
                                >
                                    <span className="sort-option-text">сначала дорогие</span>
                                    {selectedSort === 'сначала дорогие' && (
                                        <img src={check} alt='icon' />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="cheapest"
                                    onClick={() => handleOptionSelect('сначала дешёвые', 'cheapest')}
                                >
                                    <span className="sort-option-text">сначала дешёвые</span>
                                    {selectedSort === 'сначала дешёвые' && (
                                        <img src={check} alt='icon' />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="rating"
                                    onClick={() => handleOptionSelect('высокий рейтинг', 'rating')}
                                >
                                    <span className="sort-option-text">высокий рейтинг</span>
                                    {selectedSort === 'высокий рейтинг' && (
                                        <img src={check} alt='icon' />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="status-filter">
                            <button
                                className={`condition-chip ${selectedStatus === null ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                                onClick={() => handleStatusSelect(null)}
                                disabled={loading}
                            >
                                <span>Активные</span>
                            </button>
                            <button
                                className={`condition-chip ${selectedStatus === 'SOLD' ? 'selected' : ''} ${loading ? 'disabled' : ''}`}
                                onClick={() => handleStatusSelect('SOLD')}
                                disabled={loading}
                            >
                                <span>Проданные</span>
                            </button>
                        </div>
                    </div>
                </div>
                {announcements.length === 0 ? (
                    <p className="text-placeholder">Объявления отсутствуют</p>
                ) : (
                    <div className="product-list">
                        {announcements.map((announcement) => (
                            <ProductCard
                                key={announcement.id}
                                id={announcement.id}
                                imageUrl={announcement.imageUrls?.[0] || ''}
                                title={announcement.title}
                                authorName={userData?.name || 'Без имени'}
                                price={announcement.price ? parseFloat(announcement.price) : 0}
                                condition={getConditionText(announcement.condition)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileProductList;