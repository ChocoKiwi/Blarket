import React from 'react';
import panaImage from '../assets/pana.svg'; // Импортируем изображение

function ImageContainer({ imageType }) {
    const altText = imageType === 'register' ? 'Регистрация' : 'Логин';

    return (
        <div className="image-container">
            <img src={panaImage} alt={altText} />
        </div>
    );
}

export default ImageContainer;