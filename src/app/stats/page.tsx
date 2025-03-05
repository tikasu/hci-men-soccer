'use client';

import { useState } from 'react';
import { useTeams, useAllPlayersInLeague } from '@/lib/hooks/useTeams';
import { Player } from '@/lib/types';
import Link from 'next/link';

type StatCategory = 'goals' | 'assists';
type SortField = 'name' | 'team' | 'stats';
type SortDirection = 'asc' | 'desc';

export default function StatsPage() {
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: allPlayers, isLoading: isLoadingPlayers } = useAllPlayersInLeague();
  const [activeCategory, setActiveCategory] = useState<StatCategory>('goals');
  const [sortField, setSortField] = useState<SortField>('stats');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default direction
      setSortField(field);
      // Always sort stats in descending order by default (highest first)
      setSortDirection(field === 'stats' ? 'desc' : 'asc');
    }
  };

  // First, create a ranking map based on the active category
  const getPlayerRankings = () => {
    if (!allPlayers) return new Map<string, number>();
    
    const rankMap = new Map<string, number>();
    
    // Sort players by the active stat category (descending)
    const statSortedPlayers = [...allPlayers].sort((a, b) => 
      b.stats[activeCategory] - a.stats[activeCategory]
    );
    
    // Assign ranks (handling ties)
    let currentRank = 1;
    let previousScore = -1;
    
    statSortedPlayers.forEach((player, index) => {
      const score = player.stats[activeCategory];
      
      // If this score is different from the previous one, update the rank
      if (score !== previousScore && index > 0) {
        currentRank = index + 1;
      }
      
      rankMap.set(player.id, currentRank);
      previousScore = score;
    });
    
    return rankMap;
  };

  const playerRankings = getPlayerRankings();

  // Always sort by the active stat category first, then apply user's sort preference
  const sortedPlayers = allPlayers ? [...allPlayers].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
    if (sortField === 'stats') {
      // Apply the sort direction to stats sorting as well
      return multiplier * (b.stats[activeCategory] - a.stats[activeCategory]);
    }
    
    if (sortField === 'name') {
      return multiplier * a.name.localeCompare(b.name);
    } else if (sortField === 'team') {
      const teamA = teams?.find(t => t.id === a.teamId)?.name || '';
      const teamB = teams?.find(t => t.id === b.teamId)?.name || '';
      return multiplier * teamA.localeCompare(teamB);
    }
    
    return 0;
  }) : [];

  const getCategoryLabel = (category: StatCategory): string => {
    switch (category) {
      case 'goals':
        return 'Goals';
      case 'assists':
        return 'Assists';
      default:
        return '';
    }
  };

  const getSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoadingTeams || isLoadingPlayers) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-green-900">Player Statistics</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px justify-center">
            {(['goals', 'assists'] as StatCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`py-3 px-4 sm:py-4 sm:px-6 font-medium text-sm ${
                  activeCategory === category
                    ? 'border-b-2 border-green-700 text-green-700'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-green-700 text-white uppercase text-xs sm:text-sm leading-normal">
                <th className="py-2 sm:py-3 px-3 sm:px-6 text-left">Rank</th>
                <th className="py-2 sm:py-3 px-3 sm:px-6 text-left">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center font-semibold focus:outline-none"
                  >
                    Player {getSortIcon('name')}
                  </button>
                </th>
                <th className="py-2 sm:py-3 px-3 sm:px-6 text-left">
                  <button 
                    onClick={() => handleSort('team')}
                    className="flex items-center font-semibold focus:outline-none"
                  >
                    Team {getSortIcon('team')}
                  </button>
                </th>
                <th className="py-2 sm:py-3 px-3 sm:px-6 text-center">
                  <button 
                    onClick={() => handleSort('stats')}
                    className="flex items-center justify-center font-semibold focus:outline-none mx-auto"
                  >
                    {getCategoryLabel(activeCategory)} {getSortIcon('stats')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs sm:text-sm">
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player) => {
                  const team = teams?.find(t => t.id === player.teamId);
                  const playerRank = playerRankings.get(player.id) || 0;
                  
                  return (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-left">{playerRank}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-left font-medium">{player.name}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-left">
                        <Link href={`/teams/${player.teamId}`} className="hover:text-green-700">
                          {team?.name || 'Unknown Team'}
                        </Link>
                      </td>
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-center font-bold">{player.stats[activeCategory]}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">
                    No player statistics available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 