import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Star0 from '../assets/icons/star0.svg';
import Star1 from '../assets/icons/star1.svg';
import '../App.scss';

const Rating = ({ onClose, productTitle }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Placeholder for future server logic
        console.log({ title, description, rating });
        onClose();
    };

    return (
        <div className="rating-popup" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            width: '400px',
            maxWidth: '90%'
        }}>
            <div className="rating-header">
                <h3>Оставить отзыв для "{productTitle}"</h3>
                <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '20px' }}>
                    ×
                </button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="rating-stars" style={{ display: 'flex', gap: '5px', margin: '10px 0' }}>
                    {Array(5).fill().map((_, index) => (
                        <span
                            key={index}
                            onMouseEnter={() => setHoverRating(index + 1)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(index + 1)}
                            style={{ cursor: 'pointer' }}
                        >
              <img
                  src={(hoverRating || rating) > index ? Star1 : Star0}
                  alt={`star-${index + 1}`}
                  style={{ width: '24px', height: '24px' }}
              />
            </span>
                    ))}
                </div>
                <div className="form-group">
                    <label htmlFor="review-title">Заголовок</label>
                    <input
                        id="review-title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', margin: '5px 0' }}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="review-description">Описание</label>
                    <textarea
                        id="review-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', margin: '5px 0', minHeight: '100px' }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        background: '#007bff',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Отправить
                </button>
            </form>
        </div>
    );
};

Rating.propTypes = {
    onClose: PropTypes.func.isRequired,
    productTitle: PropTypes.string.isRequired,
};

export default Rating;