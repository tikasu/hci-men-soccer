'use client';

import { useState } from 'react';
import { useMatches } from '@/lib/hooks/useMatches';
import { usePlayoffMatches } from '@/lib/hooks/usePlayoffMatches';
import { Match, PlayoffMatch } from '@/lib/types';
import Link from 'next/link';
import PlayoffBracket from '@/components/PlayoffBracket';

export default function SchedulePage() {
  const { data: matches, isLoading } = useMatches();
  const { data: playoffMatches, isLoading: isLoadingPlayoffs } = usePlayoffMatches();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'playoffs'>('upcoming');
  
  if (isLoading && (activeTab === 'upcoming' || activeTab === 'past')) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (isLoadingPlayoffs && activeTab === 'playoffs') {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  // Filter matches into upcoming and past
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
  
  const upcomingMatches = matches?.filter(match => {
    const [matchDate, matchTime] = match.date.split('T');
    // If date is in the future, it's upcoming
    if (matchDate > today) return true;
    // If date is today, check the time
    if (matchDate === today && matchTime >= currentTime) return true;
    return false;
  }) || [];
  
  const pastMatches = matches?.filter(match => {
    const [matchDate, matchTime] = match.date.split('T');
    // If date is in the past, it's a past match
    if (matchDate < today) return true;
    // If date is today, check the time
    if (matchDate === today && matchTime < currentTime) return true;
    return false;
  }) || [];
  
  // Sort upcoming matches by date and time (ascending)
  upcomingMatches.sort((a, b) => a.date.localeCompare(b.date));
  
  // Sort past matches by date and time (descending)
  pastMatches.sort((a, b) => a.date.localeCompare(b.date));

  // Group matches by date for better organization
  const groupMatchesByDate = (matches: Match[]) => {
    const grouped: { [key: string]: Match[] } = {};
    
    matches.forEach(match => {
      // Extract just the date part from the date string (YYYY-MM-DD)
      const dateKey = match.date.split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(match);
    });
    
    // Sort matches within each day by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        // Compare the time parts of the date strings
        const timeA = a.date.split('T')[1] || '';
        const timeB = b.date.split('T')[1] || '';
        return timeA.localeCompare(timeB);
      });
    });
    
    return grouped;
  };
  
  const upcomingMatchesByDate = groupMatchesByDate(upcomingMatches);
  const pastMatchesByDate = groupMatchesByDate(pastMatches);
  
  // Get sorted date keys
  const upcomingDateKeys = Object.keys(upcomingMatchesByDate).sort();
  const pastDateKeys = Object.keys(pastMatchesByDate).sort();

  const formatDate = (dateString: string) => {
    // Parse the date string (format: YYYY-MM-DDTHH:MM)
    const [datePart, timePart] = dateString.split('T');
    const date = new Date(`${datePart}T${timePart || '00:00'}`);
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const formatDateHeader = (dateString: string) => {
    // For date headers, we just need the date part (YYYY-MM-DD)
    // If dateString is already in YYYY-MM-DD format (from grouping), use it directly
    // Otherwise, extract the date part from the full date string (YYYY-MM-DDTHH:MM)
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const date = new Date(`${datePart}T00:00:00`);
    
    // Check if date is today
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Format with "Today" prefix if it's today
    if (isToday) {
      return "Today - " + new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }
    
    // Check if date is tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    // Format with "Tomorrow" prefix if it's tomorrow
    if (isTomorrow) {
      return "Tomorrow - " + new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      }).format(date);
    }
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  const formatTime = (dateString: string) => {
    const timePart = dateString.split('T')[1] || '00:00';
    const [hours, minutes] = timePart.split(':');
    
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <h1 className="text-3xl font-bold mb-6 text-center">Match Schedule</h1>
      
      {/* Tabs - Centered */}
      <div className="flex justify-center border-b border-gray-200 mb-6">
        <div className="inline-flex space-x-1">
          <button
            className={`py-2 px-6 font-medium transition-colors duration-200 ${
              activeTab === 'upcoming'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Matches
          </button>
          <button
            className={`py-2 px-6 font-medium transition-colors duration-200 ${
              activeTab === 'past'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Past Matches
          </button>
          <button
            className={`py-2 px-6 font-medium transition-colors duration-200 ${
              activeTab === 'playoffs'
                ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('playoffs')}
          >
            Playoff Matches
          </button>
        </div>
      </div>
      
      {/* Match List */}
      {activeTab !== 'playoffs' ? (
        <div className="max-w-3xl mx-auto">
          {activeTab === 'upcoming' ? (
            upcomingDateKeys.length > 0 ? (
              upcomingDateKeys.map(dateKey => (
                <div key={dateKey} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-green-800">
                    {formatDateHeader(dateKey)}
                  </h2>
                  <div className="space-y-4">
                    {upcomingMatchesByDate[dateKey].map((match: Match) => (
                      <div 
                        key={match.id} 
                        className="bg-white shadow-md rounded-lg overflow-hidden border-l-4 border-green-500"
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium text-gray-500">
                              {formatTime(match.date)}
                            </div>
                            {match.location && (
                              <div className="text-sm text-gray-500">{match.location}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-3">
                              <div className="text-right min-w-[120px]">
                                <Link href={`/teams/${match.homeTeamId}`} className="font-medium hover:text-green-700">
                                  {match.homeTeamName}
                                </Link>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400">vs</span>
                              </div>
                              <div className="text-left min-w-[120px]">
                                <Link href={`/teams/${match.awayTeamId}`} className="font-medium hover:text-green-700">
                                  {match.awayTeamName}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                No upcoming matches scheduled at this time.
              </div>
            )
          ) : (
            pastDateKeys.length > 0 ? (
              pastDateKeys.map(dateKey => (
                <div key={dateKey} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 pb-2 border-b text-gray-700">
                    {formatDateHeader(dateKey)}
                  </h2>
                  <div className="space-y-4">
                    {pastMatchesByDate[dateKey].map((match: Match) => (
                      <div 
                        key={match.id} 
                        className={`bg-white shadow-md rounded-lg overflow-hidden border-l-4 ${
                          match.isCompleted ? 'border-gray-400' : 'border-yellow-400'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium text-gray-500">
                              {formatTime(match.date)}
                            </div>
                            {match.location && (
                              <div className="text-sm text-gray-500">{match.location}</div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-center">
                            <div className="flex items-center space-x-3">
                              <div className="text-right min-w-[120px]">
                                <Link href={`/teams/${match.homeTeamId}`} className="font-medium hover:text-green-700">
                                  {match.homeTeamName}
                                </Link>
                              </div>
                              <div className="flex items-center space-x-2">
                                {match.isCompleted ? (
                                  <>
                                    {match.homeScore !== undefined && match.awayScore !== undefined ? (
                                      <>
                                        <span className={`font-bold ${
                                          match.homeScore > match.awayScore 
                                            ? 'text-green-600' 
                                            : match.homeScore < match.awayScore 
                                              ? 'text-red-600' 
                                              : 'text-gray-800'
                                        }`}>{match.homeScore}</span>
                                        <span className="text-gray-400">-</span>
                                        <span className={`font-bold ${
                                          match.awayScore > match.homeScore 
                                            ? 'text-green-600' 
                                            : match.awayScore < match.homeScore 
                                              ? 'text-red-600' 
                                              : 'text-gray-800'
                                        }`}>{match.awayScore}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-bold">{match.homeScore}</span>
                                        <span className="text-gray-400">-</span>
                                        <span className="font-bold">{match.awayScore}</span>
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-yellow-600 text-sm font-medium">Result Pending</span>
                                )}
                              </div>
                              <div className="text-left min-w-[120px]">
                                <Link href={`/teams/${match.awayTeamId}`} className="font-medium hover:text-green-700">
                                  {match.awayTeamName}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                No past matches available.
              </div>
            )
          )}
        </div>
      ) : (
        // Playoff Matches Tab - Full width to match admin view exactly like admin mode
        <div className="w-full">
          {playoffMatches && playoffMatches.length > 0 ? (
            <PlayoffBracket matches={playoffMatches} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              Playoff schedule has not been set yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 