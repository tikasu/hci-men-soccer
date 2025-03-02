'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { isAdminLimitReached, verifyAdminSecretCode } from '@/lib/services/userService';

export default function SetupAdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [adminLimitReached, setAdminLimitReached] = useState(false);

  // Redirect if not authenticated - use useEffect instead of doing it during render
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Check if admin limit is reached
  useEffect(() => {
    const checkAdminLimit = async () => {
      try {
        const limitReached = await isAdminLimitReached();
        setAdminLimitReached(limitReached);
        if (limitReached) {
          setError('Maximum number of administrators has been reached. Contact an existing administrator for access.');
        }
      } catch (err) {
        console.error('Error checking admin limit:', err);
      }
    };

    if (isAuthenticated && !loading) {
      checkAdminLimit();
    }
  }, [isAuthenticated, loading]);

  const makeAdmin = async () => {
    if (!user) return;
    
    setProcessing(true);
    setError('');
    setMessage('');
    
    try {
      // Check if admin limit is reached
      const limitReached = await isAdminLimitReached();
      if (limitReached) {
        setError('Maximum number of administrators has been reached. Contact an existing administrator for access.');
        setProcessing(false);
        return;
      }

      // Verify secret code
      const isCodeValid = await verifyAdminSecretCode(secretCode);
      if (!isCodeValid) {
        setError('Invalid administrator secret code. Please try again or contact an existing administrator.');
        setProcessing(false);
        return;
      }
      
      // Update the user's role to admin
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { 
        role: 'admin',
        active: true 
      });
      
      setMessage('You are now an admin! Please log out and log back in to see the admin dashboard.');
      
      // Refresh the page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err) {
      console.error('Error making user admin:', err);
      setError('Failed to make you an admin. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  // Show loading instead of returning null
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Setup Admin Account</h1>
          
          <p className="mb-4">
            This page allows you to make yourself an admin. You will need the administrator secret code to proceed.
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{message}</span>
            </div>
          )}
          
          {!adminLimitReached && (
            <div className="mt-6">
              <div className="mb-4">
                <label htmlFor="secretCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Administrator Secret Code
                </label>
                <input
                  id="secretCode"
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter secret code"
                />
              </div>
              
              <button
                onClick={makeAdmin}
                disabled={processing || !secretCode}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Make Me Admin'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 