// CategorySelector.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import icons from '../assets/icons/icons';
import '../App.scss';

const CategorySelector = ({ isEditMode = false, announcementId = null }) => {
    const [mainCategories, setMainCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedMainCategory, setSelectedMainCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories/top-level');
                setMainCategories(response.data);

                if (isEditMode && announcementId) {
                    const announcementResponse = await api.get(`/announcements/${announcementId}`);
                    const categoryId = announcementResponse.data.categoryId;
                    console.log('Category ID from announcement:', categoryId);
                    if (categoryId) {
                        const categoryResponse = await api.get(`/categories/with-parent/${categoryId}`);
                        const { parent, child } = categoryResponse.data;
                        console.log('Parent category:', parent);
                        console.log('Child category:', child);

                        if (parent) {
                            setSelectedMainCategory(parent);
                            setSelectedSubCategory(child);
                            const subResponse = await api.get(`/categories/subcategories/${parent.id}`);
                            setSubCategories(subResponse.data);
                        } else {
                            setSelectedMainCategory(child);
                            setSelectedSubCategory(null);
                            setSubCategories([]);
                        }
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('Ошибка при загрузке категорий:', err);
                setError('Не удалось загрузить категории');
                setLoading(false);
            }
        };
        fetchCategories();
    }, [isEditMode, announcementId]);

    useEffect(() => {
        console.log('Current selectedMainCategory:', selectedMainCategory);
        console.log('Current selectedSubCategory:', selectedSubCategory);
    }, [selectedMainCategory, selectedSubCategory]);

    const handleMainCategorySelect = async (category) => {
        setSelectedMainCategory(category);
        setSelectedSubCategory(null);
        setSubCategories([]);
        try {
            const response = await api.get(`/categories/subcategories/${category.id}`);
            setSubCategories(response.data);
        } catch (err) {
            console.error('Ошибка при загрузке подкатегорий:', err);
            setError('Не удалось загрузить подкатегории');
        }
    };

    const handleSubCategorySelect = (category) => {
        setSelectedSubCategory(category);
    };

    const handleReset = () => {
        setSelectedMainCategory(null);
        setSelectedSubCategory(null);
        setSubCategories([]);
        setError(null);
    };

    const handleNext = () => {
        if (!selectedSubCategory && !selectedMainCategory) {
            setError('Выберите категорию');
            return;
        }
        const categoryId = selectedSubCategory ? selectedSubCategory.id : selectedMainCategory.id;
        console.log('Переход с categoryId:', categoryId);
        navigate(isEditMode ? `/profile/ads/edit-form/${announcementId}` : '/profile/ads/create', {
            state: { categoryId }
        });
    };

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="category-selector">
            <h2>{isEditMode ? 'Изменить категорию' : 'Выберите категорию'}</h2>
            <div className="category-container">
                <div className="main-categories">
                    <h3>Основные категории</h3>
                    <div className="category-list animate-slide-in">
                        {mainCategories.map(category => (
                            <div
                                key={category.id}
                                className={`condition-chip ${selectedMainCategory?.id === category.id || (selectedSubCategory?.parent?.id === category.id) ? 'selected' : ''}`}
                                onClick={() => handleMainCategorySelect(category)}
                            >
                                <span>{category.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                    <div className="sub-categories animate-slide-in">
                        {subCategories.length > 0 && (
                        <h3>Подкатегории</h3>
                        )}
                        <div className="category-list">
                            {subCategories.map(category => (
                                <div
                                    key={category.id}
                                    className={`condition-chip ${selectedSubCategory?.id === category.id ? 'selected' : ''}`}
                                    onClick={() => handleSubCategorySelect(category)}
                                >
                                    <span>{category.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
            </div>
            <div className="button-container">
                <button className="primary" onClick={handleNext}>
                    Далее
                </button>
                <button className="secondary" onClick={handleReset}>
                    Сбросить
                </button>
            </div>
            {error && (
                <div className="error-block">
                    <p className="error-text">{error}</p>
                </div>
            )}
        </div>
    );
};

export default CategorySelector;