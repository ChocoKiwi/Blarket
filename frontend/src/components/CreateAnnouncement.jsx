import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api';

const CreateAnnouncement = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [imagePreviews, setImagePreviews] = useState([null, null, null]);

    const handleImageChange = (index, event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const updatedPreviews = [...imagePreviews];
                updatedPreviews[index] = reader.result;
                setImagePreviews(updatedPreviews);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        const formData = {
            title: data.title,
            description: data.description,
            price: parseFloat(data.price),
            quantity: parseInt(data.quantity),
            address: data.address,
            itemCondition: data.itemCondition,
            imageUrls: imagePreviews.filter(url => url !== null),
        };

        try {
            const response = await api.post('/announcements', formData, {
                withCredentials: true,
            });
            console.log(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="edit-profile-container">
            <h2>Создать объявление</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="update-container">
                <div className="input">
                    <label>Название</label>
                    <input {...register('title', { required: true })} />
                    {errors.title && <span>Это поле обязательно</span>}
                </div>
                <div className="input">
                    <label>Описание</label>
                    <textarea {...register('description')} />
                </div>
                <div className="input">
                    <label>Цена</label>
                    <input type="number" step="0.01" {...register('price', { required: true })} />
                    {errors.price && <span>Это поле обязательно</span>}
                </div>
                <div className="input">
                    <label>Количество</label>
                    <input type="number" {...register('quantity', { required: true })} />
                    {errors.quantity && <span>Это поле обязательно</span>}
                </div>
                <div className="input">
                    <label>Город</label>
                    <input {...register('address', { required: true })} />
                    {errors.address && <span>Это поле обязательно</span>}
                </div>
                <div className="update-container">
                    <label>Состояние</label>
                    <div className="phone-date-container">
                        {['NEW', 'USED', 'BUYSELL'].map((condition) => (
                            <div className="custom-radio" key={condition}>
                                <input
                                    type="radio"
                                    value={condition}
                                    {...register('itemCondition', { required: true })}
                                    id={`itemCondition-${condition}`}
                                />
                                <span className="radio-mark"></span>
                                <label htmlFor={`itemCondition-${condition}`}>
                                    {condition === 'NEW' ? 'Новое' : condition === 'USED' ? 'Б/у' : 'Купли/Продажа'}
                                </label>
                            </div>
                        ))}
                    </div>
                    {errors.itemCondition && <span>Выберите состояние</span>}
                </div>
                <div className="update-container">
                    <label>Изображения (максимум 3)</label>
                    <div className="phone-date-container">
                        {[0, 1, 2].map((index) => (
                            <div className="input" key={index}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageChange(index, e)}
                                />
                                {imagePreviews[index] && (
                                    <img
                                        src={imagePreviews[index]}
                                        alt={`Preview ${index + 1}`}
                                        style={{ maxWidth: '100px', marginTop: '10px' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="button-container">
                    <button type="submit" className="primary">Создать объявление</button>
                </div>
            </form>
        </div>
    );
};

export default CreateAnnouncement;