import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import EditProfile from '../components/EditProfile';

const MyAds = () => <div>Мои объявления</div>;

function ProfileMenu({ user, handleLogout, handleAvatarChange }) {
    const location = useLocation();

    return (
        <div className="profile-menu">
            {user.avatar ? (
                <div className="avatar-container">
                    <img
                        src={user.avatar}
                        alt="Avatar"
                        className="avatar"
                        onClick={() => document.getElementById('avatarInput').click()}
                        style={{ cursor: 'pointer' }}
                    />
                    <input
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                </div>
            ) : (
                <div className="avatar-container">
                    <img
                        src="/placeholder-avatar.png"
                        alt="Placeholder Avatar"
                        className="avatar"
                    />
                    <input
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                    <button onClick={() => document.getElementById('avatarInput').click()}>
                        Загрузить аватар
                    </button>
                </div>
            )}
            <p className="name">{user.name}</p>
            <p className="role">{user.role || 'Пользователь'}</p>
            <ul className="menu-list">
                <li>
                    <Link to="/profile/info" className={location.pathname === '/profile/info' ? 'active' : ''}>
                        Персональная информация
                    </Link>
                </li>
                <li>
                    <Link to="/profile/ads" className={location.pathname === '/profile/ads' ? 'active' : ''}>
                        Мои объявления
                    </Link>
                </li>
                <li>
                    <button onClick={handleLogout}>Выйти из аккаунта</button>
                </li>
            </ul>
        </div>
    );
}

function Profile({ onLogout }) {
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/user/me');
                if (response.data) {
                    setUser(response.data);
                } else {
                    throw new Error('Данные пользователя не получены');
                }
            } catch (err) {
                console.error('Ошибка при получении данных пользователя:', err);
                if (err.response?.status === 401) {
                    setError('Неавторизован');
                    onLogout();
                    navigate('/login');
                } else {
                    setError('Не удалось загрузить данные пользователя');
                }
            }
        };

        fetchUser();
    }, [onLogout, navigate]);

    const handleAvatarChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64String = reader.result;
                    try {
                        await api.post('/user/update', { ...user, avatar: base64String });
                        setUser({ ...user, avatar: base64String });
                    } catch (err) {
                        console.error('Ошибка при обновлении аватара:', err);
                        setError('Не удалось обновить аватар');
                    }
                };
                reader.readAsDataURL(file);
            } catch (err) {
                console.error('Ошибка при чтении файла:', err);
                setError('Не удалось загрузить изображение');
            }
        }
    };

    if (error) {
        return <div>{error}</div>;
    }

    if (!user) {
        return <div>Загрузка...</div>;
    }

    const handleLogout = async () => {
        try {
            await api.post('/logout');
            onLogout();
            navigate('/login');
        } catch (err) {
            console.error('Ошибка при выходе:', err);
            onLogout();
            navigate('/login');
        }
    };

    return (
        <div className="main-container">
            <Header />
            <div className="profile-content">
                <Routes>
                    <Route path="/ads" element={<MyAds />} />
                    <Route path="/" element={<EditProfile />} />
                    <Route path="/info" element={<EditProfile />} />
                </Routes>
            </div>
            <ProfileMenu user={user} handleLogout={handleLogout} handleAvatarChange={handleAvatarChange} />
        </div>
    );
}

export default Profile;