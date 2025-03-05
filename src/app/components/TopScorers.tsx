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
      <div className="animate-pulse">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!topScorers.length) {
    return (
      <div>
        <p className="text-sm text-gray-500">No player statistics available yet.</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="space-y-1.5">
        {topScorers.map((player, index) => {
          const team = teams?.find(t => t.id === player.teamId);
          
          return (
            <div key={player.id} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-green-100 transition-colors duration-200">
              <div className="flex items-center">
                <span className="font-bold text-green-700 mr-2 w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-xs">{index + 1}</span>
                <div>
                  <span className="font-medium text-gray-900 text-sm">{player.name}</span>
                  <span className="text-xs text-gray-500 block">
                    {team?.name || 'Unknown Team'}
                  </span>
                </div>
              </div>
              <div className="font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded text-xs">{player.stats.goals}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 