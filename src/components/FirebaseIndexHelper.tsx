import React from 'react';

interface FirebaseIndexHelperProps {
  isVisible: boolean;
}

const FirebaseIndexHelper: React.FC<FirebaseIndexHelperProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-yellow-600 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">Firebase Index Required</p>
          <p className="text-sm">
            This page requires a Firebase index that may not be set up yet. Please create the index by clicking the link in the console error message, or go to the Firebase console and create the following index:
          </p>
          <ul className="list-disc ml-5 mt-2 text-sm">
            <li>Collection: <code>playoffMatches</code></li>
            <li>Fields to index: <code>round</code> (Ascending), <code>matchNumber</code> (Ascending)</li>
          </ul>
          <p className="text-sm mt-2">
            The page will work with reduced functionality until the index is created. Firebase may take a few minutes to build the index after creation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirebaseIndexHelper; 