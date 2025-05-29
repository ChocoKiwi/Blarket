import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import api from '../api';
import Header from '../components/Header';
import EditProfile from '../components/EditProfile';
import UserAvatar from '../assets/icons/user-avatar.svg';
import icons from "../assets/icons/icons";
import CreateAnnouncement from "../components/CreateAnnouncement";
import AnnouncementsList from "../components/AnnouncementsList";

const MyAds = () => <div>Мои объявления</div>;

function ProfileMenu({ user, handleLogout, handleAvatarChange }) {
    const navLinks = [
        { path: '/profile/info', name: 'Персональная информация', icon: 'user' },
        { path: '/profile/ads', name: 'Мои объявления', icon: 'bag' },
    ];
    const location = useLocation();
    const isInfoPage = location.pathname === '/profile/info';

    return (
        <div className="profile-menu">
            <div className="avatar-text-container">
                <div className={`avatar-container ${isInfoPage ? 'editable' : ''}`}>
                    <img
                        src={user.avatar || UserAvatar}
                        alt="Avatar"
                        className="avatar"
                        onClick={isInfoPage ? () => document.getElementById('avatarInput').click() : null}
                        style={{ cursor: isInfoPage ? 'pointer' : 'default' }}
                        onError={() => console.error('Ошибка загрузки аватарки в ProfileMenu')}
                    />
                    {isInfoPage && (
                        <>
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
                        </>
                    )}
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
                        className={`nav-link ${location.pathname.startsWith(path) ? 'active' : ''}`}
                    >
                        {icons[icon]({ className: `menu-icon icon-${icon}` })}
                        {name}
                    </Link>
                ))}
                <a href="#" className="nav-link" onClick={e => { e.preventDefault(); handleLogout(); }}>
                    {icons['exit']({ className: 'menu-icon icon-exit' })}
                    Выйти из аккаунта
                </a>
            </nav>
            {location.pathname === '/profile/ads' && (
                <div className="button-container">
                    <Link to="/profile/ads/create" className="button">
                        Новое объявление
                    </Link>
                </div>
            )}
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
                    console.log('Profile fetchUser response:', response.data);
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

    const handleAvatarChange = async event => {
        const file = event.target.files[0];
        if (file) {
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result;
                    console.log('Base64 avatar:', base64String);
                    setUser({ ...user, avatar: base64String });
                };
                reader.readAsDataURL(file);
            } catch (err) {
                console.error('Ошибка при чтении файла:', err);
                setError('Не удалось загрузить изображение');
            }
        }
    };

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

    if (error) return <div>{error}</div>;
    if (!user) return <div>Загрузка...</div>;

    return (
        <div className="main-container">
            <Header user={user} setUser={setUser} />
            <div className="profile-content">
                <Routes>
                    <Route path="/" element={<EditProfile user={user} setUser={setUser} onLogout={onLogout} />} />
                    <Route path="/info" element={<EditProfile user={user} setUser={setUser} onLogout={onLogout} />} />
                    <Route path="/ads/create" element={<CreateAnnouncement user={user} setUser={setUser} onLogout={onLogout} />} />
                    <Route path="/ads/edit/:id" element={<CreateAnnouncement user={user} setUser={setUser} onLogout={onLogout} isEditMode />} />
                    <Route path="/ads" element={<AnnouncementsList user={user} setUser={setUser} onLogout={onLogout} />} />
                </Routes>
            </div>
            <ProfileMenu user={user} handleLogout={handleLogout} handleAvatarChange={handleAvatarChange} />
        </div>
    );
}

export default Profile;