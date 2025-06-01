import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../../api';
import logoImage from '../../assets/logo/short-logo.svg';
import icons from '../../assets/icons/icons';
import userAvatar from "../../assets/icons/user-avatar.svg";

function Header({ user, setUser }) {
    const location = useLocation();

    const fetchUser = async () => {
        try {
            const response = await api.get('/user/me');
            if (response.data && typeof setUser === 'function') {
                console.log('Header fetchUser response:', response.data);
                setUser(response.data);
            } else {
                console.warn('setUser is not a function or response data is invalid');
            }
        } catch (err) {
            console.error('Ошибка при получении пользователя для Header:', err);
        }
    };

    useEffect(() => {
        if (!user) {
            fetchUser();
        }
    }, [user]);

    console.log('Header user.avatar:', user?.avatar);

    return (
        <header className="header">
            <div className="logo">
                <img src={logoImage} alt="Logo" />
            </div>
            <nav className="nav">
                {[
                    { path: '/', name: 'Главная', icon: 'home' },
                    { path: '/cart', name: 'Корзина', icon: 'cart' },
                    { path: '/messages', name: 'Сообщения', icon: 'messages' },
                    { path: '/notifications', name: 'Уведомления', icon: 'notifications' },
                ].map(({ path, name, icon }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`nav-link ${location.pathname === path ? 'active active-icon' : ''}`}
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
                            onError={() => console.error('Ошибка загрузки аватарки в Header')}
                        />
                        Профиль
                    </Link>
                )}
            </nav>
        </header>
    );
}

export default Header;