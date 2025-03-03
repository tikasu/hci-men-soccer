'use client';

import { useState, useEffect } from 'react';
import { useTeam, usePlayersByTeamId } from '@/lib/hooks/useTeams';
import { useStandingByTeamId, useStandings } from '@/lib/hooks/useMatches';
import { useInsightsByTypeAndId, useGenerateTeamInsight, useAIInsightsEnabled } from '@/lib/hooks/useAIInsights';
import { useAuth } from '@/lib/hooks/useAuth';
import { Player } from '@/lib/types';
import { useRouter } from 'next/navigation';

// Define sort types
type SortField = 'name' | 'position' | 'goals' | 'assists' | 'gamesPlayed';
type SortDirection = 'asc' | 'desc';

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [teamId, setTeamId] = useState<string>('');
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { data: team, isLoading: isLoadingTeam, error: teamError } = useTeam(teamId);
  const { data: players, isLoading: isLoadingPlayers } = usePlayersByTeamId(teamId);
  const { data: standing } = useStandingByTeamId(teamId);
  const { data: allStandings } = useStandings();
  const { data: insights } = useInsightsByTypeAndId('team', teamId);
  const { data: isAIEnabled } = useAIInsightsEnabled();
  const generateInsight = useGenerateTeamInsight();

  const [activeTab, setActiveTab] = useState<'roster' | 'stats' | 'insights'>('roster');
  
  // Add sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Check if AI insights are available
  const isAIUnavailable = insights && insights.length > 0 && 
    insights[0].content.includes("AI insights are not available");

  // Find team ranking
  const teamRanking = allStandings ? allStandings.findIndex(s => s.teamId === teamId) + 1 || '-' : '-';

  // Load the ID from params when component mounts
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setTeamId(resolvedParams.id);
      } catch (err) {
        console.error('Error resolving params:', err);
      }
    };
    
    loadParams();
  }, [params]);

  if (isLoadingTeam) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (teamError || !team) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Failed to load team information. Please try again later.</span>
      </div>
    );
  }

  const handleGenerateInsight = () => {
    generateInsight.mutate(teamId);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort players based on current sort settings
  const sortedPlayers = players ? [...players].sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;

    // Get values based on sort field
    switch (sortField) {
      case 'name':
        valueA = a.name;
        valueB = b.name;
        break;
      case 'position':
        valueA = a.position;
        valueB = b.position;
        break;
      case 'goals':
        valueA = a.stats.goals;
        valueB = b.stats.goals;
        break;
      case 'assists':
        valueA = a.stats.assists;
        valueB = b.stats.assists;
        break;
      case 'gamesPlayed':
        valueA = a.stats.gamesPlayed;
        valueB = b.stats.gamesPlayed;
        break;
      default:
        valueA = a.name;
        valueB = b.name;
    }

    // Compare values based on direction
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    } else {
      return sortDirection === 'asc' 
        ? (valueA as number) - (valueB as number) 
        : (valueB as number) - (valueA as number);
    }
  }) : [];

  // Helper to render sort indicator
  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
        
        {standing && (
          <div className="mb-4 flex items-center space-x-4">
            <div>
              <span className="font-semibold text-green-800">Rank</span>
              <span className="ml-1 text-green-600">{teamRanking}</span>
            </div>
            <div>
              <span className="font-semibold text-blue-800">Points</span>
              <span className="ml-1 text-blue-600">{standing.points}</span>
            </div>
            <div>
              <span className="font-semibold text-purple-800">Record</span>
              <span className="ml-1 text-purple-600">({standing.won}W - {standing.drawn}D - {standing.lost}L)</span>
            </div>
          </div>
        )}
        
        {insights && insights.length > 0 && !isAIUnavailable && (
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <p className="italic text-gray-700">{insights[0].content}</p>
          </div>
        )}
        
        {isAIUnavailable && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">AI Insights Unavailable:</strong>
            <span className="block sm:inline"> {insights[0].content}</span>
          </div>
        )}
        
        {isAIEnabled === false && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">AI Insights Disabled:</strong>
            <span className="block sm:inline"> AI insights are currently disabled in the system settings.</span>
          </div>
        )}
        
        {isAdmin && !isAIUnavailable && isAIEnabled !== false && (
          <button
            onClick={handleGenerateInsight}
            disabled={generateInsight.isPending}
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {generateInsight.isPending ? 'Generating...' : 'Generate AI Insight'}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('roster')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'roster'
                  ? 'border-b-2 border-green-700 text-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Roster
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-b-2 border-green-700 text-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Stats
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === 'insights'
                  ? 'border-b-2 border-green-700 text-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Insights
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'roster' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Team Roster</h2>
              
              {isLoadingPlayers ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-800"></div>
                </div>
              ) : sortedPlayers && sortedPlayers.length > 0 ? (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <table className="w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                        <th 
                          className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Name
                            {renderSortIndicator('name')}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-6 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('position')}
                        >
                          <div className="flex items-center">
                            Position
                            {renderSortIndicator('position')}
                          </div>
                        </th>
                        <th 
                          className="py-3 px-6 text-center cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('goals')}
                        >
                          <div className="flex items-center justify-center">
                            Goals
                            {renderSortIndicator('goals')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                      {sortedPlayers.map((player) => (
                        <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{player.name}</td>
                          <td className="py-3 px-6 text-left">{player.position}</td>
                          <td className="py-3 px-6 text-center">{player.stats.goals}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">No players found!</strong>
                  <span className="block sm:inline"> This team currently has no players on its roster.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Team Statistics</h2>
              
              {standing ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-600">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Season Summary</h3>
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-800 font-bold">{teamRanking}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">League Position</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-800 font-bold">{standing.points}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Points</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-800 font-bold">{standing.played}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Games Played</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-700">Wins</h3>
                        <span className="text-3xl font-bold text-green-600">{standing.won}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${(standing.won / standing.played) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Win rate: {standing.played > 0 ? Math.round((standing.won / standing.played) * 100) : 0}%
                      </p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-yellow-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-700">Draws</h3>
                        <span className="text-3xl font-bold text-yellow-600">{standing.drawn}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-yellow-500 h-2.5 rounded-full" 
                          style={{ width: `${(standing.drawn / standing.played) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Draw rate: {standing.played > 0 ? Math.round((standing.drawn / standing.played) * 100) : 0}%
                      </p>
                    </div>
                    
                    <div className="bg-white p-5 rounded-lg shadow-md border-t-4 border-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-700">Losses</h3>
                        <span className="text-3xl font-bold text-red-600">{standing.lost}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-red-500 h-2.5 rounded-full" 
                          style={{ width: `${(standing.lost / standing.played) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Loss rate: {standing.played > 0 ? Math.round((standing.lost / standing.played) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Goal Statistics */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Goal Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Goals Scored</span>
                          <span className="font-bold text-green-600">{standing.goalsFor}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-500 h-2.5 rounded-full" 
                            style={{ width: `${Math.min((standing.goalsFor / (standing.played * 3)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Avg: {standing.played > 0 ? (standing.goalsFor / standing.played).toFixed(1) : 0} per game
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Goals Conceded</span>
                          <span className="font-bold text-red-600">{standing.goalsAgainst}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-red-500 h-2.5 rounded-full" 
                            style={{ width: `${Math.min((standing.goalsAgainst / (standing.played * 3)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Avg: {standing.played > 0 ? (standing.goalsAgainst / standing.played).toFixed(1) : 0} per game
                        </p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Goal Difference</span>
                          <span className={`font-bold ${(standing.goalsFor - standing.goalsAgainst) > 0 ? 'text-green-600' : (standing.goalsFor - standing.goalsAgainst) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {standing.goalsFor - standing.goalsAgainst > 0 ? '+' : ''}{standing.goalsFor - standing.goalsAgainst}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full ${(standing.goalsFor - standing.goalsAgainst) > 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                            style={{ 
                              width: `${Math.min(Math.abs((standing.goalsFor - standing.goalsAgainst) / (standing.played * 2)) * 100, 100)}%`,
                              marginLeft: (standing.goalsFor - standing.goalsAgainst) >= 0 ? '50%' : `${50 - Math.min(Math.abs((standing.goalsFor - standing.goalsAgainst) / (standing.played * 2)) * 100, 50)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">No stats available!</strong>
                  <span className="block sm:inline"> This team hasn't played any matches yet.</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Team Insights</h2>
              
              {isAIEnabled === false ? (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">AI Insights Disabled:</strong>
                  <span className="block sm:inline"> AI insights are currently disabled in the system settings.</span>
                </div>
              ) : insights && insights.length > 0 ? (
                <div className="space-y-4">
                  {isAIUnavailable ? (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">AI Insights Unavailable:</strong>
                      <span className="block sm:inline"> {insights[0].content}</span>
                    </div>
                  ) : (
                    insights.map((insight) => (
                      <div key={insight.id} className="bg-white p-4 rounded-lg shadow">
                        <p className="text-gray-700">{insight.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Generated on {new Date(insight.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">No insights available!</strong>
                  <span className="block sm:inline"> No AI insights have been generated for this team yet.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 