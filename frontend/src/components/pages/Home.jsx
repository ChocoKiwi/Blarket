// src/components/pages/Home.jsx
import React, { useState } from 'react';
import Header from '../comon/Header';
import ProfileProductList from '../comon/ProfileProductList';
import SearchAndFilter from '../ui/SearchAndFilter';
import '../../App.scss';

const Home = ({ user, setUser, onLogout }) => {
    const [searchResults, setSearchResults] = useState(null);

    const handleSearchResults = (results) => {
        console.log('Home: Received search results:', results);
        setSearchResults(results);
    };

    return (
        <div className="main-container">
            <Header user={user} setUser={setUser} />
            <main className="profile-content">
                <SearchAndFilter
                    userId={user?.id}
                    onSearchResults={handleSearchResults}
                    selectedSortValue={'popularity'}
                />
                <ProfileProductList
                    user={user}
                    onLogout={onLogout}
                    isHomePage={true}
                    externalAnnouncements={searchResults}
                />
            </main>
        </div>
    );
};

export default Home;