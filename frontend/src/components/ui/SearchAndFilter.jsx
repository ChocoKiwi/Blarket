// src/components/ui/SearchAndFilter.jsx
import React, { useState, useRef } from 'react';
import api from '../../api';
import '../../App.scss';
import Search from '../../assets/icons/search.svg';

const SearchAndFilter = ({ userId, onSearchResults, selectedSortValue }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef(null);

    // Функция для выполнения поиска
    const performSearch = async () => {
        try {
            if (!userId) {
                onSearchResults([]);
                return;
            }
            // Если запрос пустой, запрашиваем все объявления пользователя
            const url = searchQuery.trim()
                ? `/announcements/user/${userId}/search?query=${encodeURIComponent(searchQuery)}&sort=${selectedSortValue}`
                : `/announcements/user/${userId}?status=ACTIVE,BUSINESS&sort=${selectedSortValue}`;
            const response = await api.get(url, {
                withCredentials: true,
            });
            onSearchResults(response.data || []);
        } catch (err) {
            console.error('Ошибка при поиске:', err);
            onSearchResults([]); // В случае ошибки возвращаем пустой список
        }
    };

    // Обработка изменения текста в поле ввода
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Обработка нажатия Enter
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    };

    // Обработка клика по иконке поиска
    const handleSearchClick = () => {
        performSearch();
    };

    return (
        <div className="search-and-filter">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Поиск по названию или категории"
                    className="search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    ref={inputRef}
                />
                <img
                    src={Search}
                    alt="Search"
                    onClick={handleSearchClick}
                    style={{ cursor: 'pointer' }} // Делаем иконку кликабельной
                />
            </div>
        </div>
    );
};

export default SearchAndFilter;