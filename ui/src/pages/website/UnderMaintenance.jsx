import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

const UnderMaintenance = () => {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
      <Wrench className="w-16 h-16 text-primary opacity-40 mb-6" />
      <h1 className="text-4xl font-display font-bold text-primary mb-2">Under Maintenance</h1>
      <p className="text-gray-500 max-w-md mb-8">
        This page is currently under maintenance. We'll have it ready soon. Thank you for your patience.
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

export default UnderMaintenance;
