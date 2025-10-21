import React from 'react';

const AccountDeletion: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 safe-area-all">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-primary-900 mb-6">Account Deletion Policy</h1>
          
          <div className="space-y-4 text-secondary-700">
            <h2 className="text-xl font-semibold text-primary-800 mt-6">Data Storage</h2>
            <p>This app stores all data locally on your device. We don't collect, store, or have access to any of your personal information on our servers.</p>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">How to Delete Your Data</h2>
            <div className="space-y-2">
              <p><strong>Mobile App:</strong> Uninstall the app from your device.</p>
              <p><strong>Web App:</strong> Clear your browser's local storage for this site. Your preferences will persist until you manually clear them.</p>
              <p className="text-sm text-secondary-600">
                Need help? See this guide: <a href="https://www.lifewire.com/how-to-clear-browser-cache-2617980" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">How to Clear Browser Data</a>
              </p>
            </div>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">What Gets Deleted</h2>
            <ul className="list-disc pl-6 mt-2">
              <li>Country preference</li>
              <li>Notification settings</li>
              <li>App preferences</li>
            </ul>
            <p className="text-sm text-secondary-600 mt-2">All data is stored locally on your device only.</p>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">Contact</h2>
            <p>Need help? Contact us at <a href="mailto:hello@a-q.app" className="text-primary-600 underline">privacy@a-q.app</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
