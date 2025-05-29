import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api';
import icons from '../assets/icons/icons';

const CreateAnnouncement = ({ user, setUser, onLogout, isEditMode = false }) => {
    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
    const [imagePreviews, setImagePreviews] = useState([null, null, null]);
    const [dragOver, setDragOver] = useState([false, false, false]);
    const itemCondition = watch('itemCondition');
    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useLocation();
    const categoryId = state?.categoryId;

    const handleImageChange = (index, file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedPreviews = [...imagePreviews];
                updatedPreviews[index] = reader.result;
                setImagePreviews(updatedPreviews);
            };
            reader.readAsDataURL(file);
        }
    };

    const formatPriceInput = value => (value ? value.toString().replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽' : '');
    const formatQuantityInput = value => (value ? value.toString().replace(/[^\d]/g, '') + ' шт' : '');
    const unformatInput = value => value.toString().replace(/[^\d]/g, '');

    const [formattedPrice, setFormattedPrice] = useState('');
    const [formattedQuantity, setFormattedQuantity] = useState('');
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        if (isEditMode && id) {
            const fetchAnnouncement = async () => {
                try {
                    const response = await api.get(`/announcements/${id}`);
                    const announcement = response.data;
                    setValue('title', announcement.title);
                    setValue('description', announcement.description);
                    setValue('price', announcement.price);
                    setValue('quantity', announcement.quantity);
                    setValue('address', announcement.address);
                    setValue('itemCondition', announcement.itemCondition); // Исправлено с 'conditions' на 'itemCondition'
                    setFormattedPrice(formatPriceInput(announcement.price));
                    setFormattedQuantity(formatQuantityInput(announcement.quantity));

                    let images = [null, null, null];
                    if (announcement.imageUrls && Array.isArray(announcement.imageUrls)) {
                        images = announcement.imageUrls.slice(0, 3).concat(Array(3 - announcement.imageUrls.slice(0, 3).length).fill(null));
                    }
                    setImagePreviews(images);
                } catch (error) {
                    console.error('Ошибка при загрузке объявления:', error);
                    navigate('/profile/ads');
                }
            };
            fetchAnnouncement();
        }
    }, [id, isEditMode, setValue, navigate]);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'price') {
                const raw = unformatInput(value.price ?? '');
                setFormattedPrice(formatPriceInput(raw));
            } else if (name === 'quantity') {
                const raw = unformatInput(value.quantity ?? '');
                setFormattedQuantity(formatQuantityInput(raw));
            }
        });
        return () => subscription.unsubscribe();
    }, [watch]);

    const handleFileInput = (index, event) => {
        const file = event.target.files[0];
        handleImageChange(index, file);
    };

    const handleDrop = (index, event) => {
        event.preventDefault();
        setDragOver(prev => prev.map((val, i) => (i === index ? false : val)));
        const file = event.dataTransfer.files[0];
        handleImageChange(index, file);
    };

    const handleDragOver = (index, event) => {
        event.preventDefault();
        setDragOver(prev => prev.map((val, i) => (i === index ? true : val)));
    };

    const handleDragLeave = index => {
        setDragOver(prev => prev.map((val, i) => (i === index ? false : val)));
    };

    const onSubmit = async data => {
        if (!categoryId) {
            setFormError('Выберите категорию');
            return;
        }

        const formData = {
            title: data.title,
            description: data.description,
            price: parseFloat(unformatInput(data.price)),
            quantity: parseInt(unformatInput(data.quantity)),
            address: data.address,
            itemCondition: data.itemCondition,
            imageUrls: imagePreviews.filter(url => url !== null),
            categoryId: categoryId
        };

        try {
            if (isEditMode && id) {
                await api.put(`/announcements/${id}`, formData, { withCredentials: true });
            } else {
                await api.post('/announcements', formData, { withCredentials: true });
            }
            reset();
            setImagePreviews([null, null, null]);
            setFormattedPrice('');
            setFormattedQuantity('');
            navigate('/profile/ads');
        } catch (error) {
            console.error('Ошибка при сохранении объявления:', error);
            setFormError('Ошибка при сохранении объявления');
        }
    };

    const getErrorMessage = errors => {
        if (errors.title) return 'Поле "Название" обязательно.';
        if (errors.address) return 'Поле "Адрес" обязательно.';
        if (errors.itemCondition) return 'Выберите состояние.';
        if (errors.price) return 'Укажите цену.';
        if (errors.quantity) return 'Укажите количество.';
        return 'Проверьте введенные данные.';
    };

    const handleReset = () => {
        reset();
        setImagePreviews([null, null, null]);
        setFormattedPrice('');
        setFormattedQuantity('');
        setFormError(null);
    };

    return (
        <div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <h2>{isEditMode ? 'Редактировать объявление' : 'Создать объявление'}</h2>
                <div className='annoucement'>
                    <div className="update-container for-ads">
                        <div className="input three-image-container">
                            <div className="phone-date-container">
                                <div
                                    className={`image-upload ${dragOver[0] ? 'drag-over' : ''}`}
                                    onDrop={e => handleDrop(0, e)}
                                    onDragOver={e => handleDragOver(0, e)}
                                    onDragLeave={() => handleDragLeave(0)}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileInput(0, e)}
                                        className="hidden"
                                        id="image-upload-0"
                                    />
                                    <label htmlFor="image-upload-0" className="upload-label">
                                        {imagePreviews[0] ? (
                                            <img src={imagePreviews[0]} alt="Preview 1" className="preview-image" />
                                        ) : (
                                            <div className="upload-placeholder first">
                                                <img src={icons.camera} alt="Camera" />
                                            </div>
                                        )}
                                    </label>
                                </div>
                                <div className="image-group">
                                    {[1, 2].map(index => (
                                        <div
                                            key={index}
                                            className={`image-upload ${dragOver[index] ? 'drag-over' : ''}`}
                                            onDrop={e => handleDrop(index, e)}
                                            onDragOver={e => handleDragOver(index, e)}
                                            onDragLeave={() => handleDragLeave(index)}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => handleFileInput(index, e)}
                                                className="hidden"
                                                id={`image-upload-${index}`}
                                            />
                                            <label htmlFor={`image-upload-${index}`} className="upload-label">
                                                {imagePreviews[index] ? (
                                                    <img src={imagePreviews[index]} alt={`Preview ${index + 1}`} className="preview-image" />
                                                ) : (
                                                    <div className="upload-placeholder">
                                                        <img src={icons.camera} alt="Camera" />
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="other-container">
                            <div className="input conditions">
                                <div className="phone-date-container">
                                    {['NEW', 'USED', 'BUYSELL'].map(condition => (
                                        <div
                                            key={condition}
                                            className={`condition-chip ${itemCondition === condition ? 'selected' : ''}`} // Исправлено с 'conditions' на 'condition'
                                            onClick={() => setValue('itemCondition', condition, { shouldValidate: true })}
                                        >
                                            <input
                                                type="radio"
                                                value={condition}
                                                {...register('itemCondition', { required: 'Выберите состояние' })}
                                                className="hidden"
                                                checked={itemCondition === condition}
                                            />
                                            <span>{condition === 'NEW' ? 'Новое' : condition === 'USED' ? 'Б/у' : 'Купли/Продажа'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="input">
                                <label>Название</label>
                                <input {...register('title', { required: 'Это поле обязательно' })} />
                            </div>
                            <div className="input description">
                                <label>Описание</label>
                                <textarea {...register('description')} />
                            </div>
                            <div className="phone-date-container">
                                <div className="input">
                                    <label>Цена</label>
                                    <input
                                        type="text"
                                        value={formattedPrice}
                                        onChange={e => {
                                            const raw = unformatInput(e.target.value);
                                            setValue('price', raw, { shouldValidate: true });
                                            setFormattedPrice(formatPriceInput(raw));
                                        }}
                                        onBlur={() => {
                                            setFormattedPrice(formatPriceInput(unformatInput(formattedPrice)));
                                        }}
                                        onFocus={() => {
                                            const raw = unformatInput(formattedPrice);
                                            setFormattedPrice(raw);
                                        }}
                                    />
                                </div>
                                <div className="input">
                                    <label>Количество</label>
                                    <input
                                        type="text"
                                        value={formattedQuantity}
                                        onChange={e => {
                                            const raw = unformatInput(e.target.value);
                                            setValue('quantity', raw, { shouldValidate: true });
                                            setFormattedQuantity(formatQuantityInput(raw));
                                        }}
                                        onBlur={() => {
                                            setFormattedQuantity(formatQuantityInput(unformatInput(formattedQuantity)));
                                        }}
                                        onFocus={() => {
                                            const raw = unformatInput(formattedQuantity);
                                            setFormattedQuantity(raw);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="input">
                        <label>Адрес</label>
                        <input {...register('address', { required: 'Это поле обязательно' })} />
                    </div>
                </div>
                <div>
                    <div className="button-container">
                        <button type="submit" className="primary">{isEditMode ? 'Изменить' : 'Опубликовать'}</button>
                        <button type="button" className="secondary" onClick={handleReset}>Сбросить</button>
                    </div>
                    {(Object.keys(errors).length > 0 || formError) && (
                        <div className="error-block">
                            <p className="error-text">{formError || getErrorMessage(errors)}</p>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreateAnnouncement;