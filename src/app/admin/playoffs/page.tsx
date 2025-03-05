'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import { 
  usePlayoffMatches, 
  usePlayoffMatchesByRound, 
  useUpdatePlayoffMatch,
  useInitializePlayoffBracket,
  useUpdateNextRoundMatch
} from '@/lib/hooks/usePlayoffMatches';
import { PlayoffMatch, Team } from '@/lib/types';
import Link from 'next/link';
import PlayoffBracket from '@/components/PlayoffBracket';
import FirebaseIndexHelper from '@/components/FirebaseIndexHelper';

export default function PlayoffManagementPage() {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { data: teams } = useTeams();
  const { data: playoffMatches, isLoading: isLoadingPlayoffs, error: playoffError } = usePlayoffMatches();
  const { mutate: updatePlayoffMatch } = useUpdatePlayoffMatch();
  const { mutate: initializePlayoffBracket } = useInitializePlayoffBracket();
  const { mutate: updateNextRoundMatch } = useUpdateNextRoundMatch();
  
  const [activeRound, setActiveRound] = useState<'quarterfinal' | 'semifinal' | 'final'>('quarterfinal');
  const [editingMatch, setEditingMatch] = useState<PlayoffMatch | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    homeTeamId: '',
    awayTeamId: '',
    homeScore: '',
    awayScore: '',
    isCompleted: false
  });
  const [showIndexHelper, setShowIndexHelper] = useState(false);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Check for Firebase index errors
  useEffect(() => {
    if (playoffError) {
      console.error('Playoff error:', playoffError);
      // Check if it's an index error
      if (playoffError.toString().includes('index')) {
        setShowIndexHelper(true);
      }
    }
  }, [playoffError]);

  // Initialize playoff bracket if it doesn't exist
  useEffect(() => {
    if (!isLoadingPlayoffs && (!playoffMatches || playoffMatches.length === 0)) {
      initializePlayoffBracket();
    }
  }, [isLoadingPlayoffs, playoffMatches, initializePlayoffBracket]);

  // Set form data when editing a match
  useEffect(() => {
    if (editingMatch) {
      const [datePart, timePart] = editingMatch.date ? editingMatch.date.split('T') : ['', ''];
      
      setFormData({
        date: datePart || '',
        time: timePart || '',
        location: editingMatch.location || '',
        homeTeamId: editingMatch.homeTeamId || '',
        awayTeamId: editingMatch.awayTeamId || '',
        homeScore: editingMatch.homeScore !== undefined ? String(editingMatch.homeScore) : '',
        awayScore: editingMatch.awayScore !== undefined ? String(editingMatch.awayScore) : '',
        isCompleted: editingMatch.isCompleted || false
      });
    }
  }, [editingMatch]);

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

  // Filter matches by round
  const roundMatches = playoffMatches?.filter(match => match.round === activeRound) || [];

  const handleEditMatch = (match: PlayoffMatch) => {
    setEditingMatch(match);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMatch) return;
    
    const homeTeam = teams?.find(team => team.id === formData.homeTeamId);
    const awayTeam = teams?.find(team => team.id === formData.awayTeamId);
    
    const updatedMatch: Partial<PlayoffMatch> = {
      date: formData.date && formData.time ? `${formData.date}T${formData.time}` : '',
      location: formData.location,
      homeTeamId: formData.homeTeamId,
      awayTeamId: formData.awayTeamId,
      homeTeamName: homeTeam?.name || 'TBD',
      awayTeamName: awayTeam?.name || 'TBD',
      homeScore: formData.isCompleted && formData.homeScore !== '' ? parseInt(formData.homeScore) : undefined,
      awayScore: formData.isCompleted && formData.awayScore !== '' ? parseInt(formData.awayScore) : undefined,
      isCompleted: formData.isCompleted
    };
    
    try {
      await updatePlayoffMatch({ 
        id: editingMatch.id, 
        data: updatedMatch 
      });
      
      // If the match is completed, update the next round
      if (formData.isCompleted && 
          editingMatch.round !== 'final') {
        
        const homeScore = parseInt(formData.homeScore || '0');
        const awayScore = parseInt(formData.awayScore || '0');
        const winnerId = homeScore > awayScore ? formData.homeTeamId : formData.awayTeamId;
        const winnerName = homeScore > awayScore ? homeTeam?.name || 'TBD' : awayTeam?.name || 'TBD';
        
        await updateNextRoundMatch({
          currentRound: editingMatch.round as 'quarterfinal' | 'semifinal',
          currentMatchNumber: editingMatch.matchNumber,
          winnerId,
          winnerName
        });
      }
      
      setEditingMatch(null);
    } catch (error) {
      console.error("Error updating match:", error);
      alert("Failed to update match. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const handleDeleteMatch = (matchId: string) => {
    if (confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      // Reset the match to default values
      const matchToReset = playoffMatches?.find(m => m.id === matchId);
      
      if (matchToReset) {
        const resetMatch: Partial<PlayoffMatch> = {
          date: '',
          location: '',
          homeTeamId: '',
          awayTeamId: '',
          homeTeamName: 'TBD',
          awayTeamName: 'TBD',
          homeScore: undefined,
          awayScore: undefined,
          isCompleted: false
        };
        
        try {
          updatePlayoffMatch({
            id: matchId,
            data: resetMatch
          });
        } catch (error) {
          console.error("Error resetting match:", error);
          alert("Failed to reset match. Please try again.");
        }
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      <div className="flex justify-between items-center mb-6 bg-green-700 p-4 rounded-lg">
        <h1 className="text-3xl font-bold text-white">Playoff Management</h1>
        <Link 
          href="/admin" 
          className="bg-white hover:bg-gray-100 text-green-700 px-4 py-2 rounded-md text-base font-medium"
        >
          Back to Dashboard
        </Link>
      </div>
      
      {/* Firebase Index Helper */}
      <FirebaseIndexHelper isVisible={showIndexHelper} />
      
      {/* Playoff Bracket Preview */}
      <div className="mb-8 w-full">
        <h2 className="text-xl font-semibold mb-4">Playoff Bracket Preview</h2>
        {isLoadingPlayoffs ? (
          <div className="flex justify-center items-center h-[30vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
          </div>
        ) : playoffMatches && playoffMatches.length > 0 ? (
          <div className="w-full">
            <PlayoffBracket matches={playoffMatches} />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            Initializing playoff bracket...
          </div>
        )}
      </div>
      
      {/* Round Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeRound === 'quarterfinal'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveRound('quarterfinal')}
        >
          Quarterfinals
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeRound === 'semifinal'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveRound('semifinal')}
        >
          Semifinals
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeRound === 'final'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveRound('final')}
        >
          Championship
        </button>
      </div>
      
      {/* Match List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">{activeRound.charAt(0).toUpperCase() + activeRound.slice(1)} Matches</h2>
          
          {isLoadingPlayoffs ? (
            <div className="flex justify-center items-center h-[20vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
            </div>
          ) : roundMatches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Match #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Home Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Away Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roundMatches.map((match) => (
                    <tr key={match.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {match.matchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.date ? new Date(match.date).toLocaleString() : 'Not scheduled'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.homeTeamName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.awayTeamName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {match.homeScore !== undefined && match.homeScore !== null && match.awayScore !== undefined && match.awayScore !== null
                          ? `${match.homeScore} - ${match.awayScore}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          match.isCompleted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {match.isCompleted ? 'Completed' : 'Scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEditMatch(match)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(match.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              No matches found for this round.
            </div>
          )}
        </div>
      </div>
      
      {/* Edit Match Form */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Edit {editingMatch.round.charAt(0).toUpperCase() + editingMatch.round.slice(1)} Match #{editingMatch.matchNumber}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Match location"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Team
                  </label>
                  <select
                    name="homeTeamId"
                    value={formData.homeTeamId}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Home Team</option>
                    {teams?.map(team => (
                      <option key={`home-${team.id}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Away Team
                  </label>
                  <select
                    name="awayTeamId"
                    value={formData.awayTeamId}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Away Team</option>
                    {teams?.map(team => (
                      <option key={`away-${team.id}`} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Score
                  </label>
                  <input
                    type="number"
                    name="homeScore"
                    value={formData.homeScore}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Away Score
                  </label>
                  <input
                    type="number"
                    name="awayScore"
                    value={formData.awayScore}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isCompleted"
                    checked={formData.isCompleted}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Mark as completed</span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 