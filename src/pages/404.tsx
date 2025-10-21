import React from 'react';
import { Link } from 'react-router-dom';

const Custom404: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 safe-area-all flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-primary-900 mb-4">Page Not Found</h2>
          <p className="text-secondary-700 mb-6">
            Sorry Friend, the page you're looking for doesn't exist.
          </p>
          <Link 
            to="/" 
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Custom404;
