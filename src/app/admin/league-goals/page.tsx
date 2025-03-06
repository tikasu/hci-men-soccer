'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAllPlayersInLeague } from '@/lib/hooks/useTeams';
import BatchLeagueGoalsUpdate from '../components/BatchLeagueGoalsUpdate';
import BatchGoalkeeperStatsUpdate from '../components/BatchGoalkeeperStatsUpdate';

export default function LeagueGoalsPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: allPlayers, isLoading: isLoadingPlayers } = useAllPlayersInLeague();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'goals' | 'goalsAllowed'>('goals');

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  if (loading || isLoadingPlayers) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const handleBatchGoalsUpdateSuccess = () => {
    setSuccess('Player stats updated successfully!');
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  // Filter players based on active tab
  const filteredPlayers = allPlayers?.filter(player => 
    activeTab === 'goals' 
      ? player.position !== 'Goalkeeper' 
      : player.position === 'Goalkeeper'
  ) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-700 p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-white">League-Wide Player Stats Update</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{success}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <p className="text-gray-700 mb-4">
          This tool allows you to update player statistics in the league at once. 
          You can paste data from a spreadsheet, upload a CSV file, or use the template generator.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>Total players in league:</strong> {allPlayers?.length || 0}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'goals'
              ? 'border-b-2 border-green-700 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('goals')}
        >
          Field Player Goals
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'goalsAllowed'
              ? 'border-b-2 border-green-700 text-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('goalsAllowed')}
        >
          Goalkeeper Stats
        </button>
      </div>

      {filteredPlayers && filteredPlayers.length > 0 ? (
        activeTab === 'goals' ? (
          <BatchLeagueGoalsUpdate
            players={filteredPlayers}
            onSuccess={handleBatchGoalsUpdateSuccess}
            onCancel={handleCancel}
          />
        ) : (
          <BatchGoalkeeperStatsUpdate
            players={filteredPlayers}
            onSuccess={handleBatchGoalsUpdateSuccess}
            onCancel={handleCancel}
          />
        )
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">
            {activeTab === 'goals' 
              ? 'No field players found in the league.' 
              : 'No goalkeepers found in the league.'} 
            Please add players first.
          </span>
        </div>
      )}
    </div>
  );
} 