import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import api from '../../api';
import Header from '../comon/Header';
import EditProfile from '../comon/EditProfile';
import CategorySelector from '../comon/CategorySelector';
import CreateAnnouncement from '../comon/CreateAnnouncement';
import AnnouncementsList from '../comon/AnnouncementsList';
import AnnouncementCard from '../comon/AnnouncementCard'; // Добавляем импорт
import UserAvatar from '../../assets/icons/user-avatar.svg';
import icons from '../../assets/icons/icons';

const MyAds = () => <div>Мои объявления</div>;

const getRoleDisplayName = (roles) => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return 'Пользователь';
    }
    const normalizedRoles = roles.map(role => role.toUpperCase());
    if (normalizedRoles.includes('ADMIN')) return 'Администратор';
    if (normalizedRoles.includes('PRO')) return 'Предприниматель';
    if (normalizedRoles.includes('USER')) return 'Пользователь';
    return 'Не определено';
};

function ProfileMenu({ user, handleLogout, handleAvatarChange }) {
    const navLinks = [
        { path: '/profile/info', name: 'Персональная информация', icon: 'user' },
        { path: '/profile/ads', name: 'Мои объявления', icon: 'bag' },
    ];
    const location = useLocation();
    const isInfoPage = location.pathname === '/profile/info';

    const roles = user?.roles || [];

    return (
        <div className="profile-menu">
            <div className="avatar-text-container">
                <div className={`avatar-container ${isInfoPage ? 'editable' : ''}`}>
                    <img
                        src={user?.avatar || UserAvatar}
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
                    <p className="name">{user?.name || 'Без имени'}</p>
                    <p className="role">{getRoleDisplayName(roles)}</p>
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
                    <Link to="/profile/ads/select-category" className="button">
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
                    setUser(prevUser => ({
                        ...prevUser,
                        avatar: base64String
                    }));
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
            <Header user={user} setUser={setUser}/>
            <div className="profile-content">
                <Routes>
                    <Route path="/" element={<EditProfile user={user} setUser={setUser} onLogout={onLogout}/>} />
                    <Route path="/info" element={<EditProfile user={user} setUser={setUser} onLogout={onLogout}/>} />
                    <Route path="/ads/select-category" element={<CategorySelector/>} />
                    <Route path="/ads/create" element={<CreateAnnouncement user={user} setUser={setUser} onLogout={onLogout}/>} />
                    <Route path="/ads/edit/:id" element={<CategorySelector isEditMode={true} announcementId={useLocation().pathname.split('/').pop()}/>} />
                    <Route path="/ads/edit-form/:id" element={<CreateAnnouncement user={user} setUser={setUser} onLogout={onLogout} isEditMode={true}/>} />
                    <Route path="/ads" element={<AnnouncementsList user={user} setUser={setUser} onLogout={onLogout}/>} />
                    <Route path="/ads/:id" element={<AnnouncementCard/>} /> {/* Добавляем маршрут */}
                </Routes>
            </div>
            <ProfileMenu user={user} handleLogout={handleLogout} handleAvatarChange={handleAvatarChange}/>
        </div>
    );
}

export default Profile;