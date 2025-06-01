// src/components/pages/Home.jsx
import React, { useState } from 'react';
import Header from '../comon/Header';
import ProfileProductList from '../comon/ProfileProductList';
import '../../App.scss';
import SearchAndFilter from "../ui/SearchAndFilter";

const Home = ({ user, setUser, onLogout }) => {
    return (
        <div className="main-container">
            <Header user={user} setUser={setUser} />
            <main className="profile-content">
                <SearchAndFilter/>
                <ProfileProductList user={user} onLogout={onLogout} isHomePage={true} />
            </main>
        </div>
    );
};

export default Home;