import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import EditProfile from '../components/EditProfile';

const MyAds = () => <div>Мои объявления</div>;

function ProfileMenu({ user, handleLogout }) {
    const location = useLocation();

    return (
        <div className="profile-menu">
            <img src={user.avatar || '/placeholder-avatar.png'} alt="Avatar" className="avatar" />
            <p className="name">{user.name}</p>
            <p className="role">{user.role}</p>
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
            <div className="profile-container">
                <div className="profile-content">
                    <Routes>
                        <Route path="/ads" element={<MyAds />} />
                        <Route path="/" element={<EditProfile />} />
                        <Route path="/info" element={<EditProfile />} />
                    </Routes>
                </div>
                <ProfileMenu user={user} handleLogout={handleLogout} />
            </div>
        </div>
    );
}

export default Profile;