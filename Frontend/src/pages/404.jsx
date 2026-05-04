import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-300">
      <section className="max-w-md w-full bg-white dark:bg-gray-800 shadow-md rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white">404</h1>
        <p className="mt-2 text-slate-600 dark:text-gray-400">Page not found</p>

        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg px-5 py-3 bg-primary text-white font-medium shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          Return to Home Page
        </Link>
      </section>
    </main>
  );
}
