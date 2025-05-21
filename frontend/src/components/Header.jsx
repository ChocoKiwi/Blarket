import { Link } from 'react-router-dom';
import logoImage from '../assets/logo/short-logo.svg';
import icons from '../assets/icons/icons';

function Header() {
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
                    <Link key={path} to={path} className="nav-link">
                        <img src={icons[icon]} alt={`${name} icon`} className={`icon-${icon}`} />
                        {name}
                    </Link>
                ))}
            </nav>
        </header>
    );
}

export default Header;