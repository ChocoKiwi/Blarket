// src/components/HomePage.jsx
import React from 'react';
import Header from './ui/Header';
import ProfileProductList from './ui/ProfileProductList';
import '../App.scss';

const HomePage = ({ user, setUser, onLogout }) => {
    return (
        <div className="home-page">
            <Header user={user} setUser={setUser} />
            <main className="main-content">
                <ProfileProductList user={user} onLogout={onLogout} isHomePage />
            </main>
        </div>
    );
};

export default HomePage;