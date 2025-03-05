'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAllPlayersInLeague } from '@/lib/hooks/useTeams';
import BatchLeagueGoalsUpdate from '../components/BatchLeagueGoalsUpdate';

export default function LeagueGoalsPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: allPlayers, isLoading: isLoadingPlayers } = useAllPlayersInLeague();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('Player goals updated successfully!');
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-700 p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-white">League-Wide Player Goals Update</h1>
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
          This tool allows you to update goals for all players in the league at once. 
          You can paste data from a spreadsheet, upload a CSV file, or use the template generator.
        </p>
        <p className="text-gray-700 mb-4">
          <strong>Total players in league:</strong> {allPlayers?.length || 0}
        </p>
      </div>

      {allPlayers && allPlayers.length > 0 ? (
        <BatchLeagueGoalsUpdate
          players={allPlayers}
          onSuccess={handleBatchGoalsUpdateSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">No players found in the league. Please add players first.</span>
        </div>
      )}
    </div>
  );
} 