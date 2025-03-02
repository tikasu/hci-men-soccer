'use client';

import { useState, useEffect } from 'react';
import { useTeams } from '@/lib/hooks/useTeams';
import { Player } from '@/lib/types';
import Link from 'next/link';
import { getPlayersByTeamId } from '@/lib/services/teamService';

type StatCategory = 'goals' | 'assists';

export default function StatsPage() {
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [activeCategory, setActiveCategory] = useState<StatCategory>('goals');

  // Fetch players from all teams
  useEffect(() => {
    const fetchAllPlayers = async () => {
      if (!teams) return;
      
      setIsLoadingPlayers(true);
      
      try {
        // Use Promise.all to fetch players for each team directly from the service
        const playersPromises = teams.map(team => getPlayersByTeamId(team.id));
        const playersArrays = await Promise.all(playersPromises);
        const players = playersArrays.flat();
        
        setAllPlayers(players);
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    
    if (teams) {
      fetchAllPlayers();
    }
  }, [teams]);

  const sortedPlayers = [...(allPlayers || [])].sort((a, b) => {
    return b.stats[activeCategory] - a.stats[activeCategory];
  }); // Show all players instead of just top 20

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

  if (isLoadingTeams || isLoadingPlayers) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Player Statistics</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            {(['goals', 'assists'] as StatCategory[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`py-4 px-6 font-medium text-sm ${
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
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Rank</th>
                <th className="py-3 px-6 text-left">Player</th>
                <th className="py-3 px-6 text-left">Team</th>
                <th className="py-3 px-6 text-center">{getCategoryLabel(activeCategory)}</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player, index) => {
                  const team = teams?.find(t => t.id === player.teamId);
                  
                  return (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{index + 1}</td>
                      <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{player.name}</td>
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        <Link href={`/teams/${player.teamId}`} className="hover:text-green-700">
                          {team?.name || 'Unknown Team'}
                        </Link>
                      </td>
                      <td className="py-3 px-6 text-center font-bold">{player.stats[activeCategory]}</td>
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