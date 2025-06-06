import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../api';
import ProductCard from './../../ui/ProductCard';
import SearchAndFilter from '../../ui/SearchAndFilter';
import '../../../App.scss';
import icons from '../../../assets/icons/icons';
import successIcon from '../../../assets/icons/sucsses.svg';

const ProfileProductList = ({ user, onLogout, isHomePage = false, isPurchased = false, isDeferred = false, externalAnnouncements }) => {
    const { id: paramId } = useParams();
    const [announcements, setAnnouncements] = useState(externalAnnouncements || []);
    const [loading, setLoading] = useState(true);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationState, setNotificationState] = useState('hidden');
    const [selectedSort, setSelectedSort] = useState('самые популярные');
    const [selectedSortValue, setSelectedSortValue] = useState('popularity');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const timeoutRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const userId = isPurchased || isDeferred ? user?.id : (isHomePage ? null : paramId);
    const isOwnProfile = !isHomePage && !isPurchased && !isDeferred && user && userId && parseInt(userId) === user.id;

    const showNotification = (message) => {
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 3000);
        setTimeout(() => setNotificationState('hidden'), 3500);
    };

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
                    showNotification('Ошибка загрузки данных пользователя');
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

                    // Check for duplicate IDs
                    const idCounts = data.reduce((acc, item) => {
                        const id = item.announcementId || item.id;
                        acc[id] = (acc[id] || 0) + 1;
                        return acc;
                    }, {});
                    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
                    if (duplicates.length > 0) {
                        console.warn('Duplicate IDs detected:', duplicates);
                    }

                    console.log('API response for deferred items:', data); // Log API response

                    const normalizedData = data.map((item, index) => {
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
                            cartItemId: isDeferred ? item.id : undefined,
                            orderId: item.orderId,
                            imageUrls,
                            title: item.announcementTitle || item.title,
                            authorName: item.authorName || userData?.name || 'Без имени',
                            price: item.price ? parseFloat(item.price) : 0,
                            condition: getConditionText(item.condition),
                            quantitySold: item.quantitySold || item.quantity || 0,
                            userId: item.userId || (userData?.id ?? user?.id),
                            status: isPurchased ? 'SOLD' : (item.status || 'ACTIVE'),
                            itemStatus: item.itemStatus || 'CART',
                            uniqueKey: isPurchased ? `${item.announcementId || item.id}-${item.orderId || index}` : item.announcementId || item.id,
                        };
                    });
                    setAnnouncements(normalizedData);
                    setLoading(false);
                } catch (err) {
                    console.error('Ошибка загрузки данных:', err);
                    if (err.response?.status === 401) {
                        showNotification('Неавторизован');
                        onLogout();
                    } else if (err.response?.status === 404) {
                        showNotification('Данные не найдены');
                    } else {
                        showNotification('Ошибка загрузки данных: ' + err.message);
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
        const normalizedResults = searchResults.map((item, index) => {
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
                cartItemId: isDeferred ? item.id : undefined,
                orderId: item.orderId,
                imageUrls,
                title: item.announcementTitle || item.title,
                authorName: item.authorName || userData?.name || 'Без имени',
                price: item.price ? parseFloat(item.price) : 0,
                condition: getConditionText(item.condition),
                quantitySold: item.quantitySold || item.quantity || 0,
                userId: item.userId || (userData?.id ?? user?.id),
                status: isPurchased ? 'SOLD' : (item.status || 'ACTIVE'),
                itemStatus: item.itemStatus || 'CART',
                uniqueKey: isPurchased ? `${item.announcementId || item.id}-${item.orderId || index}` : item.announcementId || item.id,
            };
        });
        setAnnouncements(normalizedResults);
    };

    const restoreItem = async (cartItemId, title) => {
        console.log('Restoring item with cartItemId:', cartItemId, 'title:', title);
        try {
            await api.put(`/cart/defer/${cartItemId}?defer=false`, null, { withCredentials: true });
            const updatedItems = announcements.filter((item) => item.cartItemId !== cartItemId);
            setAnnouncements(updatedItems);
            const variations = [
                `Товар "${title}" восстановлен!`,
                `Готово! "${title}" успешно восстановлен.`,
                `Успех! Товар "${title}" восстановлен.`,
                `"${title}" восстановлен. Отлично!`
            ];
            showNotification(variations[Math.floor(Math.random() * variations.length)]);
        } catch (e) {
            console.error('Restore error:', e);
            showNotification(e.response?.data?.message || 'Ошибка при восстановлении товара');
        }
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

    if (announcements.length === 0) {
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
                        {(!isPurchased && !isDeferred) && (
                            <h2>
                                {isHomePage ? 'Все объявления' : 'Объявления пользователя'}
                            </h2>
                        )}
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
                                            <img src={successIcon} alt="icon" />
                                        )}
                                    </div>
                                    <div
                                        className="sort-option"
                                        data-value="newest"
                                        onClick={() => handleOptionSelect('самые новые', 'newest')}
                                    >
                                        <span className="sort-option-text">самые новые</span>
                                        {selectedSort === 'самые новые' && (
                                            <img src={successIcon} alt="icon" />
                                        )}
                                    </div>
                                    <div
                                        className="sort-option"
                                        data-value="expensive"
                                        onClick={() => handleOptionSelect('сначала дорогие', 'expensive')}
                                    >
                                        <span className="sort-option-text">сначала дорогие</span>
                                        {selectedSort === 'сначала дорогие' && (
                                            <img src={successIcon} alt="icon" />
                                        )}
                                    </div>
                                    <div
                                        className="sort-option"
                                        data-value="cheapest"
                                        onClick={() => handleOptionSelect('сначала дешёвые', 'cheapest')}
                                    >
                                        <span className="sort-option-text">сначала дешёвые</span>
                                        {selectedSort === 'сначала дешёвые' && (
                                            <img src={successIcon} alt="icon" />
                                        )}
                                    </div>
                                    <div
                                        className="sort-option"
                                        data-value="rating"
                                        onClick={() => handleOptionSelect('высокий рейтинг', 'rating')}
                                    >
                                        <span className="sort-option-text">высокий рейтинг</span>
                                        {selectedSort === 'высокий рейтинг' && (
                                            <img src={successIcon} alt="icon" />
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
                    <p className="text-placeholder text-center">
                        {isPurchased ? 'Нет купленных товаров' : isDeferred ? 'Нет отложенных товаров' : 'Объявления отсутствуют'}
                    </p>
                </div>
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
                    {(!isPurchased && !isDeferred) && (
                        <h2>
                            {isHomePage ? 'Все объявления' : 'Объявления пользователя'}
                        </h2>
                    )}
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
                                        <img src={successIcon} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="newest"
                                    onClick={() => handleOptionSelect('самые новые', 'newest')}
                                >
                                    <span className="sort-option-text">самые новые</span>
                                    {selectedSort === 'самые новые' && (
                                        <img src={successIcon} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="expensive"
                                    onClick={() => handleOptionSelect('сначала дорогие', 'expensive')}
                                >
                                    <span className="sort-option-text">сначала дорогие</span>
                                    {selectedSort === 'сначала дорогие' && (
                                        <img src={successIcon} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="cheapest"
                                    onClick={() => handleOptionSelect('сначала дешёвые', 'cheapest')}
                                >
                                    <span className="sort-option-text">сначала дешёвые</span>
                                    {selectedSort === 'сначала дешёвые' && (
                                        <img src={successIcon} alt="icon" />
                                    )}
                                </div>
                                <div
                                    className="sort-option"
                                    data-value="rating"
                                    onClick={() => handleOptionSelect('высокий рейтинг', 'rating')}
                                >
                                    <span className="sort-option-text">высокий рейтинг</span>
                                    {selectedSort === 'высокий рейтинг' && (
                                        <img src={successIcon} alt="icon" />
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
                <div className="product-list">
                    {announcements.map((announcement) => (
                        <div key={announcement.uniqueKey} className="product-card-wrapper">
                            <ProductCard
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
                                itemStatus={announcement.itemStatus}
                                isPurchased={isPurchased}
                                isDeferred={isDeferred}
                                restoreItem={() => restoreItem(announcement.cartItemId, announcement.title)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {notificationState !== 'hidden' && (
                <div className={`notification ${notificationState}`}>
                    <img src={successIcon} alt="notification" />
                    <span>{notificationMessage}</span>
                </div>
            )}
        </div>
    );
};

export default ProfileProductList;