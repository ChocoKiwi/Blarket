import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api';
import logoImage from '../assets/logo/short-logo.svg';
import icons from '../assets/icons/icons';
import userAvatar from "../assets/icons/user-avatar.svg";

function Header() {
    const [user, setUser] = useState(null);
    const location = useLocation();

    const fetchUser = async () => {
        try {
            const response = await api.get('/user/me');
            if (response.data) {
                setUser(response.data);
            }
        } catch (err) {
            console.error('Ошибка при получении пользователя для Header:', err);
        }
    };

    useEffect(() => {
        fetchUser(); // Первоначальная загрузка
        const interval = setInterval(fetchUser, 5000); // Опрос каждые 5 секунд
        return () => clearInterval(interval); // Очистка интервала при размонтировании
    }, []);

    const navLinks = [
        { path: '/home', name: 'Главная', icon: 'home' },
        { path: '/cart', name: 'Корзина', icon: 'cart' },
        { path: '/messages', name: 'Сообщения', icon: 'messages' },
        { path: '/settings', name: 'Настройки', icon: 'settings' },
        { path: '/notifications', name: 'Уведомления', icon: 'notifications' },
    ];

    return (
        <header className="header">
            <div className="logo">
                <img src={logoImage} alt="Logo" />
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
                {user && (
                    <Link
                        to="/profile/info"
                        className={`nav-link profile-link ${location.pathname.startsWith('/profile') ? 'active' : ''}`}
                    >
                        <img
                            src={user.avatar || userAvatar}
                            alt="Аватар"
                            className="nav-avatar"
                        />
                        Профиль
                    </Link>
                )}
            </nav>
        </header>
    );
}

export default Header;