'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getSettings, updateSettings } from '@/lib/services/settingsService';
import { Settings } from '@/lib/types';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await getSettings();
        setSettings(settingsData);
        
        // Check if OpenAI API key is set in environment variables
        const openAIKey = process.env.OPENAI_API_KEY;
        setHasOpenAIKey(!!openAIKey);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setSettings(prev => {
      if (!prev) return prev;
      
      if (type === 'checkbox') {
        return {
          ...prev,
          [name]: (e.target as HTMLInputElement).checked
        };
      }
      
      if (name === 'pointsForWin' || name === 'pointsForDraw' || name === 'pointsForLoss' || name === 'maxAdminUsers') {
        return {
          ...prev,
          [name]: parseInt(value) || 0
        };
      }
      
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!settings) return;

    try {
      await updateSettings(settings);
      setSuccess('Settings updated successfully!');
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Failed to update settings');
    }
  };

  if (loading || isLoading || (!isAuthenticated || !isAdmin)) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Failed to load settings. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">League Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="leagueName" className="block text-sm font-medium text-gray-700 mb-1">
                League Name
              </label>
              <input
                type="text"
                id="leagueName"
                name="leagueName"
                value={settings.leagueName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label htmlFor="currentSeason" className="block text-sm font-medium text-gray-700 mb-1">
                Current Season
              </label>
              <input
                type="text"
                id="currentSeason"
                name="currentSeason"
                value={settings.currentSeason}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g. Winter 2025"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Use format: [Season] [Year] (e.g. Fall 2024, Winter 2025, Spring 2025)</p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Points System</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label htmlFor="pointsForWin" className="block text-sm font-medium text-gray-700 mb-1">
                Points for Win
              </label>
              <input
                type="number"
                id="pointsForWin"
                name="pointsForWin"
                value={settings.pointsForWin}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label htmlFor="pointsForDraw" className="block text-sm font-medium text-gray-700 mb-1">
                Points for Draw
              </label>
              <input
                type="number"
                id="pointsForDraw"
                name="pointsForDraw"
                value={settings.pointsForDraw}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label htmlFor="pointsForLoss" className="block text-sm font-medium text-gray-700 mb-1">
                Points for Loss
              </label>
              <input
                type="number"
                id="pointsForLoss"
                name="pointsForLoss"
                value={settings.pointsForLoss}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="maxAdminUsers" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Admin Users
              </label>
              <input
                type="number"
                id="maxAdminUsers"
                name="maxAdminUsers"
                value={settings.maxAdminUsers}
                onChange={handleInputChange}
                min="1"
                max="20"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Limit the number of admin users allowed in the system.
              </p>
            </div>
            <div>
              <label htmlFor="adminSecretCode" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Secret Code
              </label>
              <input
                type="text"
                id="adminSecretCode"
                name="adminSecretCode"
                value={settings.adminSecretCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Secret code required to become an admin. Change this regularly for security.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="signupEnabled"
                name="signupEnabled"
                checked={settings.signupEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="signupEnabled" className="ml-2 block text-sm text-gray-700">
                Enable User Signup
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              When disabled, new users cannot create accounts. Existing users can still log in.
            </p>
          </div>

          <h2 className="text-xl font-semibold mb-4">AI Features</h2>
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAIInsights"
                name="enableAIInsights"
                checked={settings.enableAIInsights}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="enableAIInsights" className="ml-2 block text-sm text-gray-700">
                Enable AI Insights
              </label>
            </div>
            
            {!hasOpenAIKey && (
              <div className="mt-2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Warning:</strong>
                <span className="block sm:inline"> OpenAI API key is not set. AI insights will not work until you add an API key to your .env.local file.</span>
              </div>
            )}
            
            <p className="mt-2 text-sm text-gray-500">
              When enabled, the system will use AI to generate insights about teams, players, and matches.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 