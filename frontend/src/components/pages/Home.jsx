// src/components/pages/Home.jsx
import React, { useState } from 'react';
import Header from '../comon/Header';
import ProfileProductList from '../comon/ProfileProductList';
import SearchAndFilter from "../ui/SearchAndFilter";
import '../../App.scss';

const Home = ({ user, setUser, onLogout }) => {
    const [searchResults, setSearchResults] = useState(null); // null вместо []
    const [selectedSortValue, setSelectedSortValue] = useState('popularity');

    const handleSearchResults = (results) => {
        console.log('Home: Received search results:', results); // Для отладки
        setSearchResults(results);
    };

    return (
        <div className="main-container">
            <Header user={user} setUser={setUser} />
            <main className="profile-content">
                <SearchAndFilter
                    userId={user?.id}
                    onSearchResults={handleSearchResults}
                    selectedSortValue={selectedSortValue}
                />
                <ProfileProductList
                    user={user}
                    onLogout={onLogout}
                    isHomePage={true}
                    externalAnnouncements={searchResults} // Передаём только если поиск выполнен
                />
            </main>
        </div>
    );
};

export default Home;