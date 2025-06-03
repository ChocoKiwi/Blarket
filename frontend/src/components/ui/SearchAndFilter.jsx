import React, { useState, useRef, useEffect } from 'react';
import api from '../../api';
import '../../App.scss';
import Search from '../../assets/icons/search.svg';

const SearchAndFilter = ({ userId, onSearchResults, selectedSortValue = 'popularity' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [categories, setCategories] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const inputRef = useRef(null);
    const popupRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const storedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        setRecentSearches(storedSearches.slice(0, 6));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
                setIsPopupOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '' && isPopupOpen) {
            setCompletions([]);
            setCategories([]);
            return;
        }

        const fetchSuggestions = async () => {
            try {
                // Fetch dynamic completions
                const completionRes = await api.get('/announcements/dynamic-completions', {
                    params: { query: searchQuery },
                    withCredentials: true
                });
                let suggestions = completionRes.data || [];

                // Fetch categories from search
                const categoryRes = await api.get('/categories/search', {
                    params: { query: searchQuery },
                    withCredentials: true
                });
                const searchCategories = categoryRes.data.map(category => ({
                    id: category.id,
                    name: category.name,
                    parentName: category.parent ? category.parent.name : null,
                }));

                // Fetch categories by product
                const productCategoryRes = await api.get('/announcements/categories-by-product', {
                    params: { query: searchQuery },
                    withCredentials: true
                });
                const productCategories = productCategoryRes.data.map(category => ({
                    id: category.id,
                    name: category.name,
                    parentName: category.parent ? category.parent.name : null,
                }));

                // Combine and deduplicate categories
                const combinedCategories = [...searchCategories, ...productCategories];
                const uniqueCategories = Array.from(
                    new Map(combinedCategories.map(cat => [cat.id, cat])).values()
                );
                setCategories(uniqueCategories);

                // Fetch product titles if query matches a category
                const lowerQuery = searchQuery.trim().toLowerCase();
                const isCategoryMatch = uniqueCategories.some(cat =>
                    cat.name.toLowerCase().includes(lowerQuery) ||
                    (cat.parentName && cat.parentName.toLowerCase().includes(lowerQuery))
                );
                if (isCategoryMatch) {
                    const announcementsRes = await api.get('/announcements/global-search', {
                        params: { query: searchQuery },
                        withCredentials: true
                    });
                    const productTitles = announcementsRes.data
                        .map(ann => ann.title)
                        .filter(title => title && !suggestions.includes(title))
                        .slice(0, 5);
                    suggestions = [...suggestions, ...productTitles];
                }

                setCompletions(suggestions.slice(0, 5));
            } catch (err) {
                console.error('Ошибка при получении подсказок:', err);
                setCompletions([]);
                setCategories([]);
            }
        };

        if (searchQuery.trim() !== '') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(fetchSuggestions, 300);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [searchQuery, isPopupOpen]);

    const saveRecentSearch = (query) => {
        if (!query.trim()) return;
        let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        searches = [query, ...searches.filter((s) => s !== query)].slice(0, 6);
        localStorage.setItem('recentSearches', JSON.stringify(searches));
        setRecentSearches(searches);
    };

    const performSearch = async (query = searchQuery) => {
        try {
            const url = query.trim()
                ? `/announcements/global-search?query=${encodeURIComponent(query)}&sort=${selectedSortValue}`
                : `/announcements/all-except-current?sort=${selectedSortValue}`;
            const response = await api.get(url, { withCredentials: true });
            if (typeof onSearchResults === 'function') {
                onSearchResults(response.data || []);
            }
            saveRecentSearch(query);
            setIsPopupOpen(false);
        } catch (err) {
            console.error('Ошибка при поиске:', err);
            if (typeof onSearchResults === 'function') {
                onSearchResults([]);
            }
            setIsPopupOpen(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    };

    const handleSearchClick = () => {
        performSearch();
    };

    const handleItemClick = (value) => {
        setSearchQuery(value);
        setIsPopupOpen(true);
    };

    const handleFocus = () => {
        setIsPopupOpen(true);
    };

    return (
        <section className="search-and-filter">
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Поиск по названию или категории"
                    className="search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyPress={handleKeyPress}
                    onFocus={handleFocus}
                    ref={inputRef}
                    aria-label="Поиск"
                />
                <button
                    type="button"
                    className="search-button"
                    onClick={handleSearchClick}
                    aria-label="Выполнить поиск"
                >
                    <img src={Search} alt="Иконка поиска" />
                </button>
            </div>
            {isPopupOpen && (
                <>
                    <div className="search-overlay" aria-hidden="true" />
                    <div className="search-popup" ref={popupRef}>
                        <div className="popup-content">
                            {searchQuery.trim() === '' ? (
                                recentSearches.length > 0 && (
                                    <section className="popup-section">
                                        <h3>Недавние запросы</h3>
                                        <ul className="popup-list">
                                            {recentSearches.map((search, index) => (
                                                <li
                                                    key={index}
                                                    onClick={() => handleItemClick(search)}
                                                    role="option"
                                                    aria-selected="false"
                                                >
                                                    {search}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )
                            ) : (
                                <>
                                    {(categories.length > 0 || completions.length > 0) && (
                                        <h3>Подсказки</h3>
                                    )}
                                    {categories.length > 0 && (
                                        <section className="popup-section">
                                            <ul className="popup-list category-list">
                                                {categories.slice(0, 7).map((category) => (
                                                    <li
                                                        className="category"
                                                        key={category.id}
                                                        onClick={() => handleItemClick(category.name)}
                                                        role="option"
                                                        aria-selected="false"
                                                    >
                                                        {category.parentName
                                                            ? `${category.parentName} > ${category.name}`
                                                            : category.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                    {completions.length > 0 && (
                                        <section className="popup-section">
                                            <ul className="popup-list">
                                                {completions.map((completion, index) => (
                                                    <li
                                                        key={index}
                                                        onClick={() => handleItemClick(completion)}
                                                        role="option"
                                                        aria-selected="false"
                                                    >
                                                        {completion}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </section>
    );
};

export default SearchAndFilter;