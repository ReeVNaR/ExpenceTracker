import React, { createContext, useState, useContext, useEffect } from 'react';

const PreferencesContext = createContext(null);

export const PreferencesProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD'); // 'USD' or 'INR'
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Load preferences from local storage
        const storedCurrency = localStorage.getItem('currency');
        const storedTheme = localStorage.getItem('theme');

        if (storedCurrency) setCurrency(storedCurrency);
        if (storedTheme) {
            setTheme(storedTheme);
        } else {
            // Default to dark
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        // Apply theme to html element
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('currency', currency);
    }, [currency]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const getCurrencySymbol = () => {
        return currency === 'USD' ? '$' : '₹';
    };

    return (
        <PreferencesContext.Provider value={{ currency, setCurrency, theme, toggleTheme, getCurrencySymbol }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => useContext(PreferencesContext);
