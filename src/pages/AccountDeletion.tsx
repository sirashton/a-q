import React from 'react';

const AccountDeletion: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 safe-area-all">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-primary-900 mb-6">Account Deletion Policy</h1>
          
          <div className="space-y-4 text-secondary-700">
            <h2 className="text-xl font-semibold text-primary-800 mt-6">How to Delete Your Data</h2>
            <p>To delete all your data, uninstall the app from your device.</p>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">What Gets Deleted</h2>
            <ul className="list-disc pl-6 mt-2">
              <li>Country preference</li>
              <li>Notification settings</li>
              <li>App preferences</li>
            </ul>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">Contact</h2>
            <p>Need help? Contact us at <a href="mailto:hello@a-q.app" className="text-primary-600 underline">privacy@a-q.app</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
