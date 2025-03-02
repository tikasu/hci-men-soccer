'use client';

import { useState } from 'react';
import { useStandings } from '@/lib/hooks/useMatches';
import { useMatches } from '@/lib/hooks/useMatches';
import { Standing, Match } from '@/lib/types';
import Link from 'next/link';
import React from 'react';

export default function StandingsPage() {
  const { data: standings, isLoading } = useStandings();
  const { data: allMatches } = useMatches();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
  // Function to filter matches by team ID
  const getTeamMatches = (teamId: string) => {
    if (!allMatches) return [];
    
    return allMatches.filter((match: Match) => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };
  
  // Function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  // Function to handle team row click
  const handleTeamClick = (teamId: string) => {
    if (selectedTeamId === teamId) {
      setSelectedTeamId(null); // Close if already open
    } else {
      setSelectedTeamId(teamId); // Open the clicked team
    }
  };
  
  // Function to get team name from ID
  const getTeamName = (teamId: string) => {
    const team = standings?.find(s => s.teamId === teamId);
    return team?.teamName || 'Unknown Team';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">League Standings</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-green-700 text-white uppercase text-sm leading-normal">
              <tr>
                <th className="py-3 px-6 text-left">Position</th>
                <th className="py-3 px-6 text-left">Team</th>
                <th className="py-3 px-6 text-center">Played</th>
                <th className="py-3 px-6 text-center">Won</th>
                <th className="py-3 px-6 text-center">Drawn</th>
                <th className="py-3 px-6 text-center">Lost</th>
                <th className="py-3 px-6 text-center">GF</th>
                <th className="py-3 px-6 text-center">GA</th>
                <th className="py-3 px-6 text-center">GD</th>
                <th className="py-3 px-6 text-center">Points</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {standings && standings.length > 0 ? (
                standings.map((standing: Standing, index: number) => (
                  <React.Fragment key={standing.teamId}>
                    <tr 
                      className={`border-b border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors ${index < 8 ? 'bg-green-50' : ''} ${selectedTeamId === standing.teamId ? 'bg-green-100' : ''}`}
                      onClick={() => handleTeamClick(standing.teamId)}
                    >
                      <td className="py-3 px-6 text-left">{index + 1}</td>
                      <td className="py-3 px-6 text-left font-medium flex items-center">
                        {standing.teamName}
                        <span className="ml-2 text-green-600">
                          {selectedTeamId === standing.teamId ? 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg> : 
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          }
                        </span>
                      </td>
                      <td className="py-3 px-6 text-center">{standing.played}</td>
                      <td className="py-3 px-6 text-center">{standing.won}</td>
                      <td className="py-3 px-6 text-center">{standing.drawn}</td>
                      <td className="py-3 px-6 text-center">{standing.lost}</td>
                      <td className="py-3 px-6 text-center">{standing.goalsFor}</td>
                      <td className="py-3 px-6 text-center">{standing.goalsAgainst}</td>
                      <td className="py-3 px-6 text-center">{standing.goalsFor - standing.goalsAgainst}</td>
                      <td className="py-3 px-6 text-center font-bold">{standing.points}</td>
                    </tr>
                    
                    {/* Team Schedule Panel */}
                    {selectedTeamId === standing.teamId && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <div className="bg-gray-50 p-4 border-b border-gray-200 animate-fadeIn">
                            <div className="mb-3 flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-green-800">
                                {standing.teamName} Schedule
                              </h3>
                              <Link 
                                href={`/teams/${standing.teamId}`} 
                                className="text-sm text-green-700 hover:text-green-900 flex items-center"
                              >
                                View Team Page
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </Link>
                            </div>
                            
                            <div className="overflow-x-auto">
                              {getTeamMatches(standing.teamId).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {getTeamMatches(standing.teamId).map((match: Match) => {
                                    const isHomeTeam = match.homeTeamId === standing.teamId;
                                    const opponent = isHomeTeam ? match.awayTeamName : match.homeTeamName;
                                    const isCompleted = match.isCompleted;
                                    const matchDate = new Date(match.date);
                                    const isPast = matchDate < new Date();
                                    
                                    return (
                                      <div 
                                        key={match.id} 
                                        className={`p-3 rounded-lg border ${
                                          isCompleted 
                                            ? (isHomeTeam && match.homeScore! > match.awayScore! || !isHomeTeam && match.awayScore! > match.homeScore!) 
                                              ? 'bg-green-50 border-green-200' 
                                              : (isHomeTeam && match.homeScore! < match.awayScore! || !isHomeTeam && match.awayScore! < match.homeScore!)
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-yellow-50 border-yellow-200'
                                            : 'bg-white border-gray-200'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="text-sm font-medium text-gray-600">
                                            {formatDate(match.date)}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {formatTime(match.date)}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <span className={`text-sm font-medium ${isHomeTeam ? 'font-bold' : ''}`}>
                                              {isHomeTeam ? 'vs' : '@'} {opponent}
                                            </span>
                                          </div>
                                          
                                          {isCompleted ? (
                                            <div className="flex items-center">
                                              <span className={`text-sm font-bold ${
                                                (isHomeTeam && match.homeScore! > match.awayScore! || !isHomeTeam && match.awayScore! > match.homeScore!)
                                                  ? 'text-green-600'
                                                  : (isHomeTeam && match.homeScore! < match.awayScore! || !isHomeTeam && match.awayScore! < match.homeScore!)
                                                    ? 'text-red-600'
                                                    : 'text-yellow-600'
                                              }`}>
                                                {isHomeTeam ? match.homeScore : match.awayScore} - {isHomeTeam ? match.awayScore : match.homeScore}
                                              </span>
                                              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100">
                                                {(isHomeTeam && match.homeScore! > match.awayScore! || !isHomeTeam && match.awayScore! > match.homeScore!)
                                                  ? 'W'
                                                  : (isHomeTeam && match.homeScore! < match.awayScore! || !isHomeTeam && match.awayScore! < match.homeScore!)
                                                    ? 'L'
                                                    : 'D'
                                                }
                                              </span>
                                            </div>
                                          ) : (
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              isPast ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {isPast ? 'Pending' : 'Upcoming'}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {match.location && (
                                          <div className="mt-2 text-xs text-gray-500">
                                            {match.location}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  No matches scheduled for this team.
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-4 px-6 text-center">
                    No standings data available yet. Check back after matches have been played.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-3">League Information</h2>
        <p className="text-gray-700 mb-4">
          The standings table shows each team's performance in the league, including games played, 
          results, goals, and total points. Teams are ranked by total points, with goal difference 
          as the first tiebreaker.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium text-green-700 mb-2">Points System</h3>
            <ul className="list-disc pl-5 text-gray-700">
              <li className="mb-1">Win: 3 points</li>
              <li className="mb-1">Draw: 1 point</li>
              <li className="mb-1">Loss: 0 points</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium text-green-700 mb-2">Key</h3>
            <ul className="space-y-1 text-gray-700">
              <li><span className="font-medium">GF</span>: Goals For</li>
              <li><span className="font-medium">GA</span>: Goals Against</li>
              <li><span className="font-medium">GD</span>: Goal Difference</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-medium text-green-700 mb-2">Top Teams</h3>
            <p className="text-gray-700">
              The top 8 teams (highlighted in green) qualify for the championship playoffs at the end of the season.
            </p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 1000px; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
} 