'use client';

import { useState, useEffect } from 'react';
import { useMatch } from '@/lib/hooks/useMatches';
import { useInsightsByTypeAndId, useGenerateMatchInsight } from '@/lib/hooks/useAIInsights';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import Link from 'next/link';

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [matchId, setMatchId] = useState<string>('');
  const { data: match, isLoading: isLoadingMatch } = useMatch(matchId);
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: insights } = useInsightsByTypeAndId('match', matchId);
  const generateInsight = useGenerateMatchInsight();
  const { isAdmin } = useAuth();

  // Load the ID from params when component mounts
  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setMatchId(resolvedParams.id);
      } catch (err) {
        console.error('Error resolving params:', err);
      }
    };
    
    loadParams();
  }, [params]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoadingMatch || isLoadingTeams) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Failed to load match information. Please try again later.</span>
      </div>
    );
  }

  const handleGenerateInsight = () => {
    generateInsight.mutate(matchId);
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/schedule" className="text-green-700 hover:text-green-900 flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-1" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Back to Schedule
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <p className="text-gray-500 text-sm">{formatDate(match.date)} at {match.location}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <Link href={`/teams/${match.team1Id}`} className="text-xl font-bold hover:text-green-700">
              {match.team1Name}
            </Link>
          </div>
          
          <div className="text-center mb-4 md:mb-0">
            {match.completed ? (
              <div className="text-3xl font-bold">
                {match.score1} - {match.score2}
              </div>
            ) : (
              <div className="text-xl font-semibold px-4 py-2 bg-gray-100 rounded-lg">
                vs
              </div>
            )}
            <div className="text-sm text-gray-500 mt-1">
              {match.completed ? 'Final Score' : 'Upcoming Match'}
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <Link href={`/teams/${match.team2Id}`} className="text-xl font-bold hover:text-green-700">
              {match.team2Name}
            </Link>
          </div>
        </div>

        {match.completed && insights && insights.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Match Summary</h2>
            <div className="bg-green-50 p-4 rounded-md">
              <p className="italic text-gray-700">{insights[0].content}</p>
            </div>
          </div>
        )}

        {isAdmin && match.completed && (
          <div className="mt-6">
            <button
              onClick={handleGenerateInsight}
              disabled={generateInsight.isPending}
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {generateInsight.isPending ? 'Generating...' : 'Generate Match Summary'}
            </button>
          </div>
        )}
      </div>

      {match.completed && insights && insights.length > 0 && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.id} className="border-b border-gray-200 pb-4 last:border-0">
                <p className="text-gray-700">{insight.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Generated on {new Date(insight.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 