'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStandings, useRecalculateAllTeamStandings, useUpdateTeamManualRanking } from '@/lib/hooks/useMatches';
import { Standing } from '@/lib/types';

export default function AdminStandingsPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: standings, isLoading: isLoadingStandings } = useStandings();
  const recalculateAllStandingsMutation = useRecalculateAllTeamStandings();
  const updateTeamManualRankingMutation = useUpdateTeamManualRanking();
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isEditingRanks, setIsEditingRanks] = useState(false);
  const [manualRanks, setManualRanks] = useState<Record<string, number>>({});
  const [selectedTeams, setSelectedTeams] = useState<Record<string, boolean>>({});
  const [showColumnHelp, setShowColumnHelp] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Initialize manual ranks from existing data
  useEffect(() => {
    if (standings) {
      const initialRanks: Record<string, number> = {};
      const initialSelected: Record<string, boolean> = {};
      
      standings.forEach((standing, index) => {
        initialRanks[standing.teamId] = standing.manualRank || index + 1;
        initialSelected[standing.teamId] = !!standing.manuallyRanked;
      });
      
      setManualRanks(initialRanks);
      setSelectedTeams(initialSelected);
    }
  }, [standings]);

  const handleRecalculateAllStandings = async () => {
    try {
      setIsRecalculating(true);
      setError('');
      setSuccess('');
      
      await recalculateAllStandingsMutation.mutateAsync();
      
      setSuccess('All team standings have been recalculated successfully.');
    } catch (err) {
      console.error('Error recalculating standings:', err);
      setError('Failed to recalculate standings.');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleToggleEditRanks = () => {
    setIsEditingRanks(!isEditingRanks);
    setError('');
    setSuccess('');
  };

  const handleRankChange = (teamId: string, rank: number) => {
    setManualRanks(prev => ({
      ...prev,
      [teamId]: rank
    }));
  };

  const handleTeamSelectionChange = (teamId: string, selected: boolean) => {
    setSelectedTeams(prev => ({
      ...prev,
      [teamId]: selected
    }));
  };

  const handleSaveManualRanks = async () => {
    try {
      setError('');
      setSuccess('');
      
      // First, reset all teams to automatic ranking
      if (standings) {
        for (const standing of standings) {
          if (standing.manuallyRanked) {
            await updateTeamManualRankingMutation.mutateAsync({
              teamId: standing.teamId,
              manuallyRanked: false
            });
          }
        }
      }
      
      // Then apply manual rankings to selected teams
      const selectedTeamIds = Object.entries(selectedTeams)
        .filter(([_, selected]) => selected)
        .map(([teamId]) => teamId);
      
      for (const teamId of selectedTeamIds) {
        await updateTeamManualRankingMutation.mutateAsync({
          teamId,
          manuallyRanked: true,
          manualRank: manualRanks[teamId]
        });
      }
      
      setSuccess('Manual rankings saved successfully.');
      setIsEditingRanks(false);
    } catch (err) {
      console.error('Error saving manual rankings:', err);
      setError('Failed to save manual rankings.');
    }
  };

  const handleCancelEditRanks = () => {
    // Reset to original values
    if (standings) {
      const initialRanks: Record<string, number> = {};
      const initialSelected: Record<string, boolean> = {};
      
      standings.forEach((standing, index) => {
        initialRanks[standing.teamId] = standing.manualRank || index + 1;
        initialSelected[standing.teamId] = !!standing.manuallyRanked;
      });
      
      setManualRanks(initialRanks);
      setSelectedTeams(initialSelected);
    }
    
    setIsEditingRanks(false);
    setError('');
    setSuccess('');
  };

  if (loading || isLoadingStandings) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">League Standings</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRecalculateAllStandings}
            disabled={isRecalculating || isEditingRanks}
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isRecalculating ? 'Recalculating...' : 'Recalculate All Standings'}
          </button>
          {isEditingRanks ? (
            <>
              <button
                onClick={handleSaveManualRanks}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Save Manual Rankings
              </button>
              <button
                onClick={handleCancelEditRanks}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleEditRanks}
              disabled={isRecalculating}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              Edit Manual Rankings
            </button>
          )}
        </div>
      </div>

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

      {isEditingRanks && (
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 p-4 rounded-md mb-4">
          <p className="font-medium">Manual Ranking Mode</p>
          <p>Select teams you want to manually rank and set their position. Teams not selected will be automatically ranked based on points and goal difference.</p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-700">Team Standings</h2>
          <button 
            onClick={() => setShowColumnHelp(!showColumnHelp)}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Column Help
          </button>
        </div>
        
        {showColumnHelp && (
          <div className="bg-blue-50 p-3 text-xs text-blue-800 border-b border-blue-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><strong>Pos</strong>: Position</div>
              <div><strong>P</strong>: Played</div>
              <div><strong>W</strong>: Won</div>
              <div><strong>D</strong>: Drawn</div>
              <div><strong>L</strong>: Lost</div>
              <div><strong>GF</strong>: Goals For</div>
              <div><strong>GA</strong>: Goals Against</div>
              <div><strong>GD</strong>: Goal Difference</div>
              <div><strong>Pts</strong>: Points</div>
              <div><strong>Type</strong>: Ranking Type</div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white text-sm table-fixed">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs leading-normal">
              <tr>
                {isEditingRanks && (
                  <th className="py-2 px-1 text-center w-8">
                    <span className="sr-only">Select</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </th>
                )}
                <th className="py-2 px-1 text-center w-8">Pos</th>
                {isEditingRanks && (
                  <th className="py-2 px-1 text-center w-14">Rank</th>
                )}
                <th className="py-2 px-2 text-left">Team</th>
                <th className="py-1 px-1 text-center w-8">P</th>
                <th className="py-1 px-1 text-center w-8">W</th>
                <th className="py-1 px-1 text-center w-8">D</th>
                <th className="py-1 px-1 text-center w-8">L</th>
                <th className="py-1 px-1 text-center w-8">GF</th>
                <th className="py-1 px-1 text-center w-8">GA</th>
                <th className="py-1 px-1 text-center w-8">GD</th>
                <th className="py-1 px-1 text-center w-12">Pts</th>
                {!isEditingRanks && (
                  <th className="py-2 px-1 text-center w-16">Type</th>
                )}
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs">
              {standings && standings.length > 0 ? (
                standings.map((standing: Standing, index: number) => (
                  <tr key={standing.teamId} className={`border-b border-gray-200 hover:bg-gray-50 ${standing.manuallyRanked ? 'bg-blue-50' : ''}`}>
                    {isEditingRanks && (
                      <td className="py-1 px-1 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTeams[standing.teamId] || false}
                          onChange={(e) => handleTeamSelectionChange(standing.teamId, e.target.checked)}
                          className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="py-1 px-1 text-center font-medium">{index + 1}</td>
                    {isEditingRanks && (
                      <td className="py-1 px-1 text-center">
                        <input
                          type="number"
                          min="1"
                          max={standings.length}
                          value={manualRanks[standing.teamId] || index + 1}
                          onChange={(e) => handleRankChange(standing.teamId, parseInt(e.target.value))}
                          disabled={!selectedTeams[standing.teamId]}
                          className="w-10 px-1 py-0.5 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </td>
                    )}
                    <td className="py-1 px-2 text-left font-medium truncate max-w-[150px]" title={standing.teamName}>
                      {standing.teamName}
                    </td>
                    <td className="py-1 px-1 text-center">{standing.played}</td>
                    <td className="py-1 px-1 text-center">{standing.won}</td>
                    <td className="py-1 px-1 text-center">{standing.drawn}</td>
                    <td className="py-1 px-1 text-center">{standing.lost}</td>
                    <td className="py-1 px-1 text-center">{standing.goalsFor}</td>
                    <td className="py-1 px-1 text-center">{standing.goalsAgainst}</td>
                    <td className="py-1 px-1 text-center">{standing.goalsFor - standing.goalsAgainst}</td>
                    <td className="py-1 px-1 text-center font-bold">{standing.points}</td>
                    {!isEditingRanks && (
                      <td className="py-1 px-1 text-center">
                        {standing.manuallyRanked ? (
                          <span className="bg-blue-100 text-blue-800 py-0.5 px-1 rounded-full text-xs whitespace-nowrap">
                            M-{standing.manualRank}
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 py-0.5 px-1 rounded-full text-xs whitespace-nowrap">
                            Auto
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isEditingRanks ? 13 : 12} className="py-3 px-2 text-center">
                    No standings data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-2">About Standings</h2>
        <p className="text-gray-700">
          Standings are automatically calculated and updated when matches are marked as completed. 
          The standings table shows each team's performance in the league, including games played, 
          results, goals, and total points.
        </p>
        <div className="mt-4">
          <h3 className="font-medium">Points System:</h3>
          <ul className="list-disc pl-5 mt-2">
            <li>Win: 3 points</li>
            <li>Draw: 1 point</li>
            <li>Loss: 0 points</li>
          </ul>
        </div>
        <div className="mt-4">
          <h3 className="font-medium">Manual Ranking:</h3>
          <p className="mt-2">
            As an administrator, you can manually adjust team rankings for special cases like 
            head-to-head tiebreakers or other league rules. Manual rankings will override the 
            automatic point-based ranking. This is only visible to administrators - users will 
            see the final standings without knowing which teams were manually ranked.
          </p>
        </div>
      </div>
    </div>
  );
} 