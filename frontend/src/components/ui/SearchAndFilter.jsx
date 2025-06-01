// src/components/ui/SearchAndFilter.jsx
import React, { useState, useRef, useEffect } from 'react';
import api from '../../api';
import '../../App.scss';
import Search from '../../assets/icons/search.svg';

const SearchAndFilter = () => {
    const [selectedSortValue] = useState(null);
    const timeoutRef = useRef(null);

    // Отправка запроса на сервер при изменении сортировки
    useEffect(() => {
        if (selectedSortValue) {
            const fetchSortedData = async () => {
                try {
                    // Пример запроса: отправляем параметр сортировки
                    await api.get(`/announcements?sort=${selectedSortValue}`, {
                        withCredentials: true,
                    });
                    // Ответ не обрабатываем, так как сортировка товаров в ProfileProductList.jsx
                } catch (err) {
                    console.error('Ошибка при сортировке:', err);
                }
            };
            fetchSortedData();
        }
    }, [selectedSortValue]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current); // Очищаем таймаут
            }
        };
    }, []);

    return (
        <div className="search-and-filter">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Поиск по названию или категории"
                    className="search-input"
                />
                <img src={Search} alt="Search" />
            </div>
        </div>
    );
};

export default SearchAndFilter;