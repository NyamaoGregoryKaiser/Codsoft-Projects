import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAuthenticated, removeTokens, getUserInfo } from '../api/auth';

const Header = () => {
    const navigate = useNavigate();
    const loggedIn = isAuthenticated();
    const userInfo = getUserInfo();

    const handleLogout = () => {
        removeTokens();
        navigate('/login');
    };

    return (
        <header style={headerStyle}>
            <h1 style={logoStyle}>
                <Link to="/" style={linkStyle}>CMS Project</Link>
            </h1>
            <nav style={navStyle}>
                <Link to="/" style={linkStyle}>Home</Link>
                {loggedIn ? (
                    <>
                        <span style={{color: 'white', marginRight: '15px'}}>Hello, {userInfo?.username}</span>
                        <button onClick={handleLogout} style={buttonStyle}>Logout</button>
                    </>
                ) : (
                    <Link to="/login" style={linkStyle}>Login</Link>
                )}
            </nav>
        </header>
    );
};

const headerStyle = {
    background: '#333',
    color: '#fff',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

const logoStyle = {
    margin: 0,
};

const navStyle = {
    display: 'flex',
    alignItems: 'center',
};

const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    margin: '0 10px',
    padding: '5px 10px',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease',
};

const buttonStyle = {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'background-color 0.3s ease',
};


export default Header;