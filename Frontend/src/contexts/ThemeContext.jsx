import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
const THEMES = ['light', 'dark'];

const getNextTheme = (currentTheme) => {
    const currentIndex = THEMES.indexOf(currentTheme);
    if (currentIndex === -1) return 'light';
    return THEMES[(currentIndex + 1) % THEMES.length];
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && THEMES.includes(savedTheme)) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => getNextTheme(prev));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
