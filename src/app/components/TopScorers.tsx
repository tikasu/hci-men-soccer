'use client';

import { useAllPlayersInLeague, useTeams } from '@/lib/hooks/useTeams';
import Link from 'next/link';

export default function TopScorers() {
  const { data: allPlayers, isLoading: isLoadingPlayers } = useAllPlayersInLeague();
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  
  const isLoading = isLoadingPlayers || isLoadingTeams;
  
  // Get top 5 goal scorers
  const topScorers = allPlayers 
    ? [...allPlayers]
        .sort((a, b) => b.stats.goals - a.stats.goals)
        .slice(0, 5)
    : [];
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 animate-pulse">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Top Goal Scorers</h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!topScorers.length) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Top Goal Scorers</h2>
        <p className="text-gray-500">No player statistics available yet.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Top Goal Scorers</h2>
        <Link 
          href="/stats" 
          className="text-sm text-green-700 hover:text-green-800 font-medium"
        >
          View All
        </Link>
      </div>
      
      <div className="space-y-3">
        {topScorers.map((player, index) => {
          const team = teams?.find(t => t.id === player.teamId);
          
          return (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-bold text-gray-700 mr-2">{index + 1}.</span>
                <div>
                  <span className="font-medium text-gray-900">{player.name}</span>
                  <span className="text-sm text-gray-500 block">
                    {team?.name || 'Unknown Team'}
                  </span>
                </div>
              </div>
              <div className="font-bold text-green-700">{player.stats.goals}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 