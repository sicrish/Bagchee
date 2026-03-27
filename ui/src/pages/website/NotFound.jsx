import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
      <BookOpen className="w-16 h-16 text-primary opacity-40 mb-6" />
      <h1 className="text-6xl font-display font-bold text-primary mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-text-main mb-4">Page Not Found</h2>
      <p className="text-gray-500 max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-primary text-white px-8 py-3 font-bold uppercase text-sm tracking-wider hover:bg-primary-dark transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
