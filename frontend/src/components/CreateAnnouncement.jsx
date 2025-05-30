// CreateAnnouncement.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../api';
import icons from '../assets/icons/icons';
import imageCompression from 'browser-image-compression';
import successIcon from '../assets/icons/sucsses.svg'; // Иконка для уведомлений

const CreateAnnouncement = ({ user, setUser, onLogout, isEditMode = false }) => {
    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
        defaultValues: {
            title: '',
            description: '',
            price: '',
            quantity: '',
            address: '',
            itemCondition: 'NEW', // Значение по умолчанию
        },
    });
    const [imagePreviews, setImagePreviews] = useState([null, null, null]);
    const [dragOver, setDragOver] = useState([false, false, false]);
    const [formError, setFormError] = useState(null);
    const [formattedPrice, setFormattedPrice] = useState('');
    const [formattedQuantity, setFormattedQuantity] = useState('');
    const [notificationMessage, setNotificationMessage] = useState(''); // Для уведомлений
    const [notificationState, setNotificationState] = useState('hidden'); // Для уведомлений

    const navigate = useNavigate();
    const { id } = useParams();
    const { state } = useLocation();
    const categoryId = state?.categoryId;

    const itemCondition = watch('itemCondition');

    // Форматирование и очистка входных данных
    const formatPriceInput = (value) =>
        value ? value.toString().replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽' : '';
    const formatQuantityInput = (value) => (value ? value.toString().replace(/[^\d]/g, '') + ' шт' : '');
    const unformatInput = (value) => value.toString().replace(/[^\d]/g, '');

    // Уведомления
    const showNotification = (title, action) => {
        const variations = [
            `Объявление "${title}" теперь ${action}!`,
            `Готово! "${title}" успешно ${action}.`,
            `Успех! Объявление "${title}" ${action}.`,
            `"${title}" теперь ${action}. Отлично!`
        ];
        const message = variations[Math.floor(Math.random() * variations.length)];
        setNotificationMessage(message);
        setNotificationState('visible');
        setTimeout(() => setNotificationState('hiding'), 3000);
        setTimeout(() => setNotificationState('hidden'), 3500);
    };

    // Загрузка данных для редактирования
    useEffect(() => {
        if (isEditMode && id) {
            const fetchAnnouncement = async () => {
                try {
                    const response = await api.get(`/announcements/${id}`, { withCredentials: true });
                    const announcement = response.data;
                    setValue('title', announcement.title || '');
                    setValue('description', announcement.description || '');
                    setValue('price', announcement.price || '');
                    setValue('quantity', announcement.quantity || '');
                    setValue('address', announcement.address || '');
                    // Проверяем condition и устанавливаем допустимое значение
                    const validConditions = ['NEW', 'USED', 'BUYSELL'];
                    const condition = validConditions.includes(announcement.condition) ? announcement.condition : 'NEW';
                    setValue('itemCondition', condition, { shouldValidate: true });
                    setFormattedPrice(announcement.price ? formatPriceInput(announcement.price) : '');
                    setFormattedQuantity(announcement.quantity ? formatQuantityInput(announcement.quantity) : '');

                    let images = [null, null, null];
                    if (announcement.imageUrls && Array.isArray(announcement.imageUrls)) {
                        images = announcement.imageUrls.slice(0, 3).concat(Array(3 - announcement.imageUrls.slice(0, 3).length).fill(null));
                    }
                    setImagePreviews(images);
                } catch (error) {
                    console.error('Ошибка при загрузке объявления:', error);
                    setFormError('Не удалось загрузить объявление');
                    navigate('/profile/ads');
                }
            };
            fetchAnnouncement();
        }
    }, [id, isEditMode, setValue, navigate]);

    // Отслеживание изменений цены и количества
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

    // Обработка загрузки изображений с сжатием
    const handleImageChange = async (index, file) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onloadend = () => {
                    const updatedPreviews = [...imagePreviews];
                    updatedPreviews[index] = reader.result;
                    setImagePreviews(updatedPreviews);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Ошибка при сжатии изображения:', error);
                setFormError('Не удалось обработать изображение');
            }
        }
    };

    const handleFileInput = (index, event) => {
        const file = event.target.files[0];
        handleImageChange(index, file);
    };

    const handleDrop = (index, event) => {
        event.preventDefault();
        setDragOver((prev) => prev.map((val, i) => (i === index ? false : val)));
        const file = event.dataTransfer.files[0];
        handleImageChange(index, file);
    };

    const handleDragOver = (index, event) => {
        event.preventDefault();
        setDragOver((prev) => prev.map((val, i) => (i === index ? true : val)));
    };

    const handleDragLeave = (index) => {
        setDragOver((prev) => prev.map((val, i) => (i === index ? false : val)));
    };

    // Отправка формы
    const onSubmit = async (data, isDraft = false) => {
        if (!categoryId && !isEditMode) {
            setFormError('Выберите категорию');
            return;
        }

        const formData = {
            title: data.title || null,
            description: data.description || null,
            price: data.price ? parseFloat(unformatInput(data.price)) : null,
            quantity: data.quantity ? parseInt(unformatInput(data.quantity)) : null,
            address: data.address || null,
            itemCondition: data.itemCondition || null,
            imageUrls: imagePreviews.filter((url) => url !== null),
            categoryId: categoryId || data.categoryId,
            deliveryOptions: [],
        };

        try {
            const headers = {
                'Content-Type': 'application/json',
                withCredentials: true,
            };

            if (isEditMode && id) {
                await api.put(`/announcements/${id}${isDraft ? '/draft' : ''}`, formData, { headers });
                showNotification(data.title, isDraft ? 'сохранено как черновик' : 'обновлено');
            } else {
                await api.post(`/announcements${isDraft ? '/draft' : ''}`, formData, { headers });
                showNotification(data.title, isDraft ? 'сохранено как черновик' : 'опубликовано');
            }
            reset();
            setImagePreviews([null, null, null]);
            setFormattedPrice('');
            setFormattedQuantity('');
            setFormError(null);
            navigate('/profile/ads');
        } catch (error) {
            console.error('Ошибка при сохранении объявления:', error);
            setFormError(error.response?.data?.message || 'Ошибка при сохранении объявления');
        }
    };

    // Сообщения об ошибках
    const getErrorMessage = (errors) => {
        if (errors.title) return 'Поле "Название" обязательно.';
        if (errors.address) return 'Поле "Адрес" обязательно.';
        if (errors.itemCondition) return 'Выберите состояние.';
        if (errors.price) return 'Укажите цену.';
        if (errors.quantity) return 'Укажите количество.';
        return 'Проверьте введенные данные.';
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
                <h2>{isEditMode ? 'Редактировать объявление' : 'Создать объявление'}</h2>
                <div className="annoucement">
                    <div className="update-container for-ads">
                        <div className="input three-image-container">
                            <div className="phone-date-container">
                                <div
                                    className={`image-upload ${dragOver[0] ? 'drag-over' : ''}`}
                                    onDrop={(e) => handleDrop(0, e)}
                                    onDragOver={(e) => handleDragOver(0, e)}
                                    onDragLeave={() => handleDragLeave(0)}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileInput(0, e)}
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
                                    {[1, 2].map((index) => (
                                        <div
                                            key={index}
                                            className={`image-upload ${dragOver[index] ? 'drag-over' : ''}`}
                                            onDrop={(e) => handleDrop(index, e)}
                                            onDragOver={(e) => handleDragOver(index, e)}
                                            onDragLeave={() => handleDragLeave(index)}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileInput(index, e)}
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
                                    {['NEW', 'USED', 'BUYSELL'].map((condition) => (
                                        <div
                                            key={condition}
                                            className={`condition-chip ${itemCondition === condition ? 'selected' : ''}`}
                                            onClick={() => setValue('itemCondition', condition, { shouldValidate: true })}
                                        >
                                            <input
                                                type="radio"
                                                value={condition}
                                                {...register('itemCondition', { required: 'Выберите состояние' })}
                                                className="hidden"
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
                                        onChange={(e) => {
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
                                        onChange={(e) => {
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
                <div className="button-container">
                    <button type="submit" className="primary">
                        {isEditMode ? 'Изменить' : 'Опубликовать'}
                    </button>
                    <button
                        type="button"
                        className="secondary"
                        onClick={handleSubmit((data) => onSubmit(data, true))}
                    >
                        В черновик
                    </button>
                </div>
                {(Object.keys(errors).length > 0 || formError) && (
                    <div className="error-block">
                        <p className="error-text">{formError || getErrorMessage(errors)}</p>
                    </div>
                )}
                {notificationState !== 'hidden' && (
                    <div className={`notification ${notificationState}`}>
                        <img src={successIcon} alt="notification" />
                        <span>{notificationMessage}</span>
                    </div>
                )}
            </form>
        </div>
    );
};

export default CreateAnnouncement;