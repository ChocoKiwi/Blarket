import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import EditProfile from '../components/EditProfile';
import UserAvatar from '../assets/icons/user-avatar.svg'
import icons from "../assets/icons/icons";

const MyAds = () => <div>Мои объявления</div>;

function ProfileMenu({ user, handleLogout, handleAvatarChange }) {
    const navLinks = [
        { path: '/profile/info', name: 'Персональная информация', icon: 'user' },
        { path: '/profile/ads', name: 'Мои объявления', icon: 'bag' },
    ];
    const location = useLocation();

    return (
        <div className="profile-menu">
            <div className="avatar-text-container">
                <div className="avatar-container">
                    <img
                        src={user.avatar || UserAvatar}
                        alt="Avatar"
                        className="avatar"
                        onClick={() => document.getElementById('avatarInput').click()}
                        style={{ cursor: 'pointer' }}
                    />
                    <img
                        src={icons.editAvatar}
                        alt="Edit Avatar"
                        className="edit-avatar-icon"
                        onClick={() => document.getElementById('avatarInput').click()}
                    />
                    <input
                        type="file"
                        id="avatarInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                </div>
                <div className="username-container">
                    <p className="name">{user.name}</p>
                    <p className="role">{user.role || 'Пользователь'}</p>
                </div>
            </div>
            <nav className="nav">
                {navLinks.map(({ path, name, icon }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`nav-link ${location.pathname === path ? 'active' : ''}`}
                    >
                        {icons[icon]({ className: `menu-icon icon-${icon}` })}
                        {name}
                    </Link>
                ))}
                <a href="#" className="nav-link" onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                }}>
                    {icons['exit']({ className: 'menu-icon icon-exit' })}
                    Выйти из аккаунта
                </a>
            </nav>
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
                    <Route path="/" element={<EditProfile setUser={setUser} onLogout={onLogout} />} />
                    <Route path="/info" element={<EditProfile setUser={setUser} onLogout={onLogout} />} />
                </Routes>
            </div>
            <ProfileMenu user={user} handleLogout={handleLogout} handleAvatarChange={handleAvatarChange} />
        </div>
    );
}

export default Profile;