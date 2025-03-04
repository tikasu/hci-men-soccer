'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import { getAllInsights, deleteInsight, generateInsight } from '@/lib/services/insightService';
import { AIInsight } from '@/lib/types';

export default function AdminInsightsPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: teams } = useTeams();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [selectedType, setSelectedType] = useState<'team' | 'player' | 'match'>('team');
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Load insights
  useEffect(() => {
    const loadInsights = async () => {
      if (!isAuthenticated || !isAdmin) return;
      
      setIsLoadingInsights(true);
      try {
        const allInsights = await getAllInsights();
        setInsights(allInsights);
      } catch (err) {
        console.error('Failed to load insights:', err);
        setError('Failed to load insights');
      } finally {
        setIsLoadingInsights(false);
      }
    };

    if (!loading && isAuthenticated && isAdmin) {
      loadInsights();
    }
  }, [isAuthenticated, isAdmin, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const handleDeleteInsight = async (insightId: string) => {
    if (!confirm('Are you sure you want to delete this insight? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteInsight(insightId);
      setSuccess('Insight deleted successfully!');
      
      // Update the local state
      setInsights(prevInsights => prevInsights.filter(insight => insight.id !== insightId));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete insight');
      console.error(err);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGenerateInsight = async () => {
    if (!selectedType || !selectedId) {
      setError('Please select a type and an item');
      return;
    }

    setIsGeneratingInsight(true);
    setError('');
    setSuccess('');

    try {
      const newInsight = await generateInsight(selectedType, selectedId);
      setSuccess('Insight generated successfully!');
      
      // Add the new insight to the list
      setInsights(prevInsights => [newInsight, ...prevInsights]);
      
      // Reset form
      setSelectedType('team');
      setSelectedId('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to generate insight');
      console.error(err);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getEntityName = (insight: AIInsight) => {
    if (insight.type === 'team') {
      const team = teams?.find(t => t.id === insight.relatedId);
      return team?.name || 'Unknown Team';
    }
    return insight.relatedId;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-700 p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-white">Manage AI Insights</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate New Insight</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="insightType" className="block text-sm font-medium text-gray-700 mb-1">
              Insight Type
            </label>
            <select
              id="insightType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'team' | 'player' | 'match')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="team">Team</option>
              <option value="player">Player</option>
              <option value="match">Match</option>
            </select>
          </div>
          <div>
            <label htmlFor="entityId" className="block text-sm font-medium text-gray-700 mb-1">
              Select {selectedType === 'team' ? 'Team' : selectedType === 'player' ? 'Player' : 'Match'}
            </label>
            <select
              id="entityId"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">-- Select {selectedType} --</option>
              {selectedType === 'team' && teams?.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
              {/* Add options for players and matches when those hooks are available */}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateInsight}
              disabled={isGeneratingInsight || !selectedId}
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGeneratingInsight ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : 'Generate Insight'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Type</th>
                <th className="py-3 px-6 text-left">Entity</th>
                <th className="py-3 px-6 text-left">Content</th>
                <th className="py-3 px-6 text-center">Created</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {isLoadingInsights ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  </td>
                </tr>
              ) : insights && insights.length > 0 ? (
                insights.map((insight) => (
                  <tr key={insight.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <span className={`py-1 px-3 rounded-full text-xs ${
                        insight.type === 'team' 
                          ? 'bg-blue-100 text-blue-800' 
                          : insight.type === 'player' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                      }`}>
                        {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {getEntityName(insight)}
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div className="truncate max-w-xs">{insight.content}</div>
                    </td>
                    <td className="py-3 px-6 text-center whitespace-nowrap">
                      {formatDate(insight.createdAt)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => handleDeleteInsight(insight.id)}
                          className="transform hover:text-red-700 hover:scale-110"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">No insights found!</strong>
                      <span className="block sm:inline"> There are currently no AI insights in the system.</span>
                    </div>
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