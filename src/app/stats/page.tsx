'use client';

import { useState, useEffect } from 'react';
import { useTeams, useAllPlayersInLeague } from '@/lib/hooks/useTeams';
import { Player } from '@/lib/types';
import Link from 'next/link';

type StatCategory = 'goals' | 'goalsAllowed';
type SortField = 'name' | 'team' | 'stats' | 'games' | 'average';
type SortDirection = 'asc' | 'desc';

export default function StatsPage() {
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: allPlayers, isLoading: isLoadingPlayers } = useAllPlayersInLeague();
  const [activeCategory, setActiveCategory] = useState<StatCategory>('goals');
  const [sortField, setSortField] = useState<SortField>('stats');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Set initial sort field and direction based on active category
  useEffect(() => {
    if (activeCategory === 'goalsAllowed') {
      setSortField('average');
      setSortDirection('asc');
    } else {
      setSortField('stats');
      setSortDirection('desc');
    }
  }, [activeCategory]);

  // Filter players based on active category
  const filteredPlayers = allPlayers ? allPlayers.filter(player => {
    if (activeCategory === 'goalsAllowed') {
      return player.position === 'Goalkeeper';
    } else {
      return player.position !== 'Goalkeeper';
    }
  }) : [];

  // Set appropriate sort field and direction when changing categories
  const handleCategoryChange = (category: StatCategory) => {
    setActiveCategory(category);
    if (category === 'goalsAllowed') {
      // For goalkeepers, default to sorting by average (lowest first)
      setSortField('average');
      setSortDirection('asc');
    } else {
      // For field players, default to sorting by goals (highest first)
      setSortField('stats');
      setSortDirection('desc');
    }
  };

  const handleSort = (field: SortField) => {
    if (field === 'stats') {
      // For stats field, set appropriate direction based on category
      setSortField(field);
      // For goalsAllowed, lower is better (ascending)
      setSortDirection(activeCategory === 'goalsAllowed' ? 'asc' : 'desc');
    } else if (field === 'average' && activeCategory === 'goalsAllowed') {
      // For average in Golden Glove, lower is better (ascending)
      setSortField(field);
      setSortDirection('asc');
    } else if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default direction
      setSortField(field);
      setSortDirection(field === 'games' ? 'desc' : 'asc');
    }
  };

  // Calculate average goals allowed per game
  const getAverageGoalsAllowed = (player: Player): number => {
    if (!player.stats.gamesPlayed || player.stats.gamesPlayed === 0) return 0;
    return (player.stats.goalsAllowed || 0) / player.stats.gamesPlayed;
  };

  // First, create a ranking map based on the active category
  const getPlayerRankings = () => {
    if (!filteredPlayers.length) return new Map<string, number>();
    
    const rankMap = new Map<string, number>();
    
    // Sort players by the active stat category
    const statSortedPlayers = [...filteredPlayers].sort((a, b) => {
      if (activeCategory === 'goalsAllowed') {
        // For goalkeepers, rank primarily by average goals allowed
        const aAverage = getAverageGoalsAllowed(a);
        const bAverage = getAverageGoalsAllowed(b);
        
        if (aAverage === bAverage) {
          // If averages are the same, use total goals allowed as tiebreaker
          return (a.stats.goalsAllowed || 0) - (b.stats.goalsAllowed || 0);
        }
        
        // Lower average is better
        return aAverage - bAverage;
      } else {
        // For field players, higher goals is better
        return b.stats[activeCategory] - a.stats[activeCategory];
      }
    });
    
    // Assign ranks (handling ties)
    let currentRank = 1;
    let previousAverage = -1;
    let previousGoalsAllowed = -1;
    
    statSortedPlayers.forEach((player, index) => {
      if (activeCategory === 'goalsAllowed') {
        const average = getAverageGoalsAllowed(player);
        const goalsAllowed = player.stats.goalsAllowed || 0;
        
        // If this average is different from the previous one, update the rank
        if (average !== previousAverage || goalsAllowed !== previousGoalsAllowed) {
          currentRank = index + 1;
        }
        
        previousAverage = average;
        previousGoalsAllowed = goalsAllowed;
      } else {
        const score = player.stats[activeCategory];
        
        // For field players, just consider goals
        if (score !== previousAverage && index > 0) {
          currentRank = index + 1;
        }
        
        previousAverage = score;
      }
      
      rankMap.set(player.id, currentRank);
    });
    
    return rankMap;
  };

  const playerRankings = getPlayerRankings();

  // Sort players based on active category and user preferences
  const sortedPlayers = filteredPlayers.length ? [...filteredPlayers].sort((a, b) => {
    // For stats field, sort based on the active category
    if (sortField === 'stats') {
      if (activeCategory === 'goalsAllowed') {
        // For goalkeepers, sort by average goals allowed (lower is better)
        return getAverageGoalsAllowed(a) - getAverageGoalsAllowed(b);
      } else {
        // For field players, higher goals is better
        return b.stats[activeCategory] - a.stats[activeCategory];
      }
    } else if (sortField === 'games') {
      // For games played, higher is typically considered better
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return multiplier * ((a.stats.gamesPlayed || 0) - (b.stats.gamesPlayed || 0));
    } else if (sortField === 'average' && activeCategory === 'goalsAllowed') {
      // For average goals allowed, lower is better
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return multiplier * (getAverageGoalsAllowed(a) - getAverageGoalsAllowed(b));
    }
    
    // For other fields, respect the sort direction
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    
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
      case 'goalsAllowed':
        return 'Golden Glove';
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
            {(['goals', 'goalsAllowed'] as StatCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
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
                {activeCategory === 'goalsAllowed' && (
                  <>
                    <th className="py-2 sm:py-3 px-3 sm:px-6 text-center">
                      <button 
                        onClick={() => handleSort('games')}
                        className="flex items-center justify-center font-semibold focus:outline-none mx-auto"
                      >
                        Games {getSortIcon('games')}
                      </button>
                    </th>
                    <th className="py-2 sm:py-3 px-3 sm:px-6 text-center">
                      <button 
                        onClick={() => handleSort('stats')}
                        className="flex items-center justify-center font-semibold focus:outline-none mx-auto"
                      >
                        Goals Allowed {getSortIcon('stats')}
                      </button>
                    </th>
                    <th className="py-2 sm:py-3 px-3 sm:px-6 text-center">
                      <button 
                        onClick={() => handleSort('average')}
                        className="flex items-center justify-center font-semibold focus:outline-none mx-auto"
                      >
                        Average (GA/Game) {getSortIcon('average')}
                      </button>
                    </th>
                  </>
                )}
                {activeCategory === 'goals' && (
                  <th className="py-2 sm:py-3 px-3 sm:px-6 text-center">
                    <button 
                      onClick={() => handleSort('stats')}
                      className="flex items-center justify-center font-semibold focus:outline-none mx-auto"
                    >
                      Goals {getSortIcon('stats')}
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs sm:text-sm">
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player) => {
                  const team = teams?.find(t => t.id === player.teamId);
                  const playerRank = playerRankings.get(player.id) || 0;
                  const statValue = activeCategory === 'goalsAllowed' 
                    ? (player.stats.goalsAllowed || 0) 
                    : player.stats[activeCategory];
                  const averageValue = getAverageGoalsAllowed(player);
                  
                  return (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-left">{playerRank}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-left font-medium">{player.name}</td>
                      <td className="py-2 sm:py-3 px-3 sm:px-6 text-left">
                        <Link href={`/teams/${player.teamId}`} className="hover:text-green-700">
                          {team?.name || 'Unknown Team'}
                        </Link>
                      </td>
                      {activeCategory === 'goalsAllowed' && (
                        <>
                          <td className="py-2 sm:py-3 px-3 sm:px-6 text-center">{player.stats.gamesPlayed || 0}</td>
                          <td className="py-2 sm:py-3 px-3 sm:px-6 text-center font-bold">{statValue}</td>
                          <td className="py-2 sm:py-3 px-3 sm:px-6 text-center">{averageValue.toFixed(2)}</td>
                        </>
                      )}
                      {activeCategory === 'goals' && (
                        <td className="py-2 sm:py-3 px-3 sm:px-6 text-center font-bold">{statValue}</td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={activeCategory === 'goalsAllowed' ? 6 : 4} className="py-6 text-center text-gray-500">
                    {activeCategory === 'goalsAllowed' 
                      ? 'No goalkeeper statistics available' 
                      : 'No player statistics available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {activeCategory === 'goalsAllowed' && (
        <div className="mt-4 text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
          <p><strong>Note:</strong> The Golden Glove ranking is based on average goals allowed per game (GA/Game). Lower averages are better. In case of a tie in average, total goals allowed is used as a tiebreaker.</p>
        </div>
      )}
    </div>
  );
} 