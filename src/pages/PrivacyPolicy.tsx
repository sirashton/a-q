import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary-50 safe-area-all">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-primary-900 mb-6">Privacy Policy</h1>
          
          <div className="space-y-4 text-secondary-700">
            <h2 className="text-xl font-semibold text-primary-800 mt-6">Data Collection</h2>
            <p>This app stores minimal data locally on your device:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Country preference</li>
              <li>Notification settings</li>
            </ul>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">Data Usage</h2>
            <p>Your data is used only to provide the app's functionality. No personal information is transmitted to external servers.</p>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">Data Deletion</h2>
            <p>To delete your data, simply uninstall the app or use the reset option in settings. See our <Link to="/account-deletion" className="text-primary-600 underline">Account Deletion Policy</Link> for details.</p>

            <h2 className="text-xl font-semibold text-primary-800 mt-6">Contact</h2>
            <p>Questions? Contact us at <a href="mailto:hello@a-q.app" className="text-primary-600 underline">privacy@a-q.app</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
