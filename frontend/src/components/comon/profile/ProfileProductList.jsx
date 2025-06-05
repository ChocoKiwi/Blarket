// src/components/ui/ProfileProductList.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api';
import ProductCard from '../../ui/ProductCard';
import SearchAndFilter from '../../ui/SearchAndFilter';
import '../../../App.scss';
import icons from '../../../assets/icons/icons';
import check from '../../../assets/icons/sucsses.svg';

const ProfileProductList = ({ user, onLogout, isHomePage = false, isPurchased = false, isDeferred = false, externalAnnouncements }) => {
    const { id: paramId } = useParams();
    const [announcements, setAnnouncements] = useState(externalAnnouncements || []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSort, setSelectedSort] = useState('самые популярные');
    const [selectedSortValue, setSelectedSortValue] = useState('popularity');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const timeoutRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const userId = isPurchased || isDeferred ? user?.id : (isHomePage ? null : paramId);
    const isOwnProfile = !isHomePage && !isPurchased && !isDeferred && user && userId && parseInt(userId) === user.id;

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
        if (!isHomePage && !isPurchased && !isDeferred && userId) {
            const fetchUserData = async () => {
                try {
                    const response = await api.get(`/user/${userId}`, { withCredentials: true });
                    setUserData(response.data);
                } catch (err) {
                    console.error('Ошибка загрузки данных пользователя:', err);
                }
            };
            fetchUserData();
        }
    }, [userId, isHomePage, isPurchased, isDeferred]);

    useEffect(() => {
        if (!externalAnnouncements) {
            const fetchAnnouncements = async () => {
                setLoading(true);
                try {
                    let url;
                    if (isPurchased) {
                        url = `/orders/purchased?sort=${selectedSortValue}`;
                    } else if (isDeferred) {
                        url = `/cart?itemStatus=DEFERRED&sort=${selectedSortValue}`;
                    } else if (isHomePage) {
                        url = `/announcements/all-except-current?sort=${selectedSortValue}`;
                    } else if (userId) {
                        url = selectedStatus
                            ? `/announcements/user/${userId}?status=${selectedStatus}&sort=${selectedSortValue}`
                            : `/announcements/user/${userId}?status=ACTIVE,BUSINESS&sort=${selectedSortValue}`;
                    } else {
                        throw new Error('Пользователь не определён');
                    }
                    const response = await api.get(url, { withCredentials: true });
                    const data = response.data || [];
                    const normalizedData = data.map((item) => {
                        let imageUrls = [];
                        if (isPurchased || isDeferred) {
                            // Для CartItemDTO imageUrl может быть JSON-строкой или строкой
                            try {
                                const parsed = JSON.parse(item.imageUrl || '[]');
                                imageUrls = Array.isArray(parsed) ? parsed : [item.imageUrl];
                            } catch {
                                imageUrls = item.imageUrl ? [item.imageUrl] : [];
                            }
                        } else {
                            // Для AnnouncementDTO imageUrls — строка с запятыми
                            imageUrls = typeof item.imageUrls === 'string' && item.imageUrls
                                ? item.imageUrls.split(',')
                                : (Array.isArray(item.imageUrls) ? item.imageUrls : []);
                        }

                        return {
                            id: item.announcementId || item.id,
                            imageUrls,
                            title: item.announcementTitle || item.title,
                            authorName: item.authorName || userData?.name || 'Без имени',
                            price: item.price ? parseFloat(item.price) : 0,
                            condition: getConditionText(item.condition),
                            quantitySold: item.quantitySold || item.quantity || 0,
                            userId: item.userId || (userData?.id ?? user?.id),
                            status: item.status || 'ACTIVE',
                        };
                    });
                    setAnnouncements(normalizedData);
                    setLoading(false);
                    setError(null);
                } catch (err) {
                    console.error('Ошибка загрузки данных:', err);
                    if (err.response?.status === 401) {
                        setError('Неавторизован');
                        onLogout();
                    } else if (err.response?.status === 404) {
                        setError('Данные не найдены');
                    } else {
                        setError('Ошибка загрузки данных: ' + err.message);
                    }
                    setLoading(false);
                }
            };
            fetchAnnouncements();
        } else {
            setAnnouncements(externalAnnouncements || []);
            setLoading(false);
        }
    }, [userId, selectedStatus, selectedSortValue, onLogout, isHomePage, isPurchased, isDeferred, userData, user, externalAnnouncements]);

    const handleSearchResults = (searchResults) => {
        const normalizedResults = searchResults.map((item) => {
            let imageUrls = [];
            if (isPurchased || isDeferred) {
                try {
                    const parsed = JSON.parse(item.imageUrl || '[]');
                    imageUrls = Array.isArray(parsed) ? parsed : [item.imageUrl];
                } catch {
                    imageUrls = item.imageUrl ? [item.imageUrl] : [];
                }
            } else {
                imageUrls = typeof item.imageUrls === 'string' && item.imageUrls
                    ? item.imageUrls.split(',')
                    : (Array.isArray(item.imageUrls) ? item.imageUrls : []);
            }

            return {
                id: item.announcementId || item.id,
                imageUrls,
                title: item.announcementTitle || item.title,
                authorName: item.authorName || userData?.name || 'Без имени',
                price: item.price ? parseFloat(item.price) : 0,
                condition: getConditionText(item.condition),
                quantitySold: item.quantitySold || item.quantity || 0,
                userId: item.userId || (userData?.id ?? user?.id),
                status: item.status || 'ACTIVE',
            };
        });
        setAnnouncements(normalizedResults);
    };

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
        if (loading) return;
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
            {!isHomePage && !isPurchased && !isDeferred && (
                <SearchAndFilter
                    userId={userId}
                    onSearchResults={handleSearchResults}
                    selectedSortValue={selectedSortValue}
                />
            )}
            <div className="flex">
                <div className="title-sort">
                    <h2>
                        {isPurchased ? 'Купленные товары' : isDeferred ? 'Отложенные товары' : isHomePage ? 'Все объявления' : 'Объявления пользователя'}
                    </h2>
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
                                        <img src={check} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="newest"
                                    onClick={() => handleOptionSelect('самые новые', 'newest')}
                                >
                                    <span className="sort-option-text">самые новые</span>
                                    {selectedSort === 'самые новые' && (
                                        <img src={check} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="expensive"
                                    onClick={() => handleOptionSelect('сначала дорогие', 'expensive')}
                                >
                                    <span className="sort-option-text">сначала дорогие</span>
                                    {selectedSort === 'сначала дорогие' && (
                                        <img src={check} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="cheapest"
                                    onClick={() => handleOptionSelect('сначала дешёвые', 'cheapest')}
                                >
                                    <span className="sort-option-text">сначала дешёвые</span>
                                    {selectedSort === 'сначала дешёвые' && (
                                        <img src={check} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="rating"
                                    onClick={() => handleOptionSelect('высокий рейтинг', 'rating')}
                                >
                                    <span className="sort-option-text">высокий рейтинг</span>
                                    {selectedSort === 'высокий рейтинг' && (
                                        <img src={check} alt="icon" />
                                    )}
                                </div>
                            </div>
                        </div>
                        {!isHomePage && !isPurchased && !isDeferred && (
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
                        )}
                    </div>
                </div>
                {announcements.length === 0 ? (
                    <p className="text-placeholder text-center">
                        {isPurchased ? 'Нет купленных товаров' : isDeferred ? 'Нет отложенных товаров' : 'Объявления отсутствуют'}
                    </p>
                ) : (
                    <div className="product-list">
                        {announcements.map((announcement) => (
                            <ProductCard
                                key={announcement.id}
                                id={announcement.id}
                                imageUrl={announcement.imageUrls?.[0] || ''}
                                title={announcement.title}
                                authorName={announcement.authorName}
                                price={announcement.price}
                                condition={announcement.condition}
                                quantitySold={announcement.quantitySold}
                                isOwnProfile={isOwnProfile}
                                userId={announcement.userId}
                                status={announcement.status}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileProductList;