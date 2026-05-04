import React, { useState } from 'react';
import Navigation from './Navigation';
import { Menu, Stethoscope, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row transition-colors duration-300">
      {/* Mobile Top Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between lg:hidden sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-1.5 rounded-lg">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">HealthAI</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <Navigation isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />

      <main className="flex-1 lg:ml-64 p-4 md:p-8 min-h-screen dark:text-gray-100 text-gray-900">
        {children}
      </main>
    </div>
  );
};

export default Layout;
