'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import { 
  useMatches, 
  useCreateMatch, 
  useUpdateMatch, 
  useDeleteMatch, 
  useUpdateStandings,
  useRecalculateTeamStandings
} from '@/lib/hooks/useMatches';
import { Match } from '@/lib/types';
import { getPlayersByTeamId, updatePlayer } from '@/lib/services/teamService';
import { Player } from '@/lib/types';

export default function AdminMatchesPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: matches, isLoading: isLoadingMatches } = useMatches();
  
  // Sort teams alphabetically by name
  const sortedTeams = teams ? [...teams].sort((a, b) => a.name.localeCompare(b.name)) : [];
  
  const createMatchMutation = useCreateMatch();
  const updateMatchMutation = useUpdateMatch();
  const deleteMatchMutation = useDeleteMatch();
  const updateStandingsMutation = useUpdateStandings();
  const recalculateTeamStandingsMutation = useRecalculateTeamStandings();
  
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [isEditingMatch, setIsEditingMatch] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    time: '',
    homeScore: '',
    awayScore: '',
    location: '',
    isCompleted: false
  });
  
  // State for batch match creation
  const [batchMatches, setBatchMatches] = useState<Array<{
    homeTeamId: string;
    awayTeamId: string;
    date: string;
    time: string;
    location: string;
    isCompleted: boolean;
    homeScore: string;
    awayScore: string;
  }>>([
    {
      homeTeamId: '',
      awayTeamId: '',
      date: '',
      time: '',
      location: '',
      isCompleted: false,
      homeScore: '',
      awayScore: '',
    }
  ]);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add these state variables
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [goalScorers, setGoalScorers] = useState<{playerId: string, count: number}[]>([]);
  const [assistProviders, setAssistProviders] = useState<{playerId: string, count: number}[]>([]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Add this effect to load players when teams are selected
  useEffect(() => {
    const loadTeamPlayers = async () => {
      if (!formData.homeTeamId || !formData.awayTeamId) return;
      
      setIsLoadingPlayers(true);
      try {
        const [homePlayers, awayPlayers] = await Promise.all([
          getPlayersByTeamId(formData.homeTeamId),
          getPlayersByTeamId(formData.awayTeamId)
        ]);
        
        setHomeTeamPlayers(homePlayers);
        setAwayTeamPlayers(awayPlayers);
        
        // Reset goal scorers and assist providers when teams change
        setGoalScorers([]);
        setAssistProviders([]);
      } catch (error) {
        console.error('Error loading players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    
    if (formData.homeTeamId && formData.awayTeamId) {
      loadTeamPlayers();
    }
  }, [formData.homeTeamId, formData.awayTeamId]);

  if (loading || isLoadingTeams || isLoadingMatches) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      homeTeamId: '',
      awayTeamId: '',
      date: '',
      time: '',
      homeScore: '',
      awayScore: '',
      location: '',
      isCompleted: false
    });
    setBatchMatches([
      {
        homeTeamId: '',
        awayTeamId: '',
        date: '',
        time: '',
        location: '',
        isCompleted: false,
        homeScore: '',
        awayScore: '',
      }
    ]);
    setIsAddingMatch(false);
    setIsEditingMatch(null);
    setIsBatchMode(false);
    setError('');
    setSuccess('');
    setGoalScorers([]);
    setAssistProviders([]);
    setHomeTeamPlayers([]);
    setAwayTeamPlayers([]);
  };

  const validateForm = () => {
    if (!formData.homeTeamId || !formData.awayTeamId) {
      setError('Both teams are required');
      return false;
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      setError('Home team and away team cannot be the same');
      return false;
    }

    if (!formData.date) {
      setError('Match date is required');
      return false;
    }

    if (formData.isCompleted) {
      if (formData.homeScore === '' || formData.awayScore === '') {
        setError('Scores are required for completed matches');
        return false;
      }
      
      // Ensure scores are valid numbers
      const homeScore = parseInt(formData.homeScore);
      const awayScore = parseInt(formData.awayScore);
      
      if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
        setError('Scores must be valid non-negative numbers');
        return false;
      }
    }

    return true;
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    try {
      const homeTeam = teams?.find(t => t.id === formData.homeTeamId);
      const awayTeam = teams?.find(t => t.id === formData.awayTeamId);

      if (!homeTeam || !awayTeam) {
        setError('Invalid team selection');
        return;
      }

      // Create a date string in format YYYY-MM-DDTHH:MM that preserves local time
      const dateTimeString = `${formData.date}T${formData.time || '00:00'}`;

      const newMatch: Partial<Match> = {
        homeTeamId: formData.homeTeamId,
        homeTeamName: homeTeam.name,
        awayTeamId: formData.awayTeamId,
        awayTeamName: awayTeam.name,
        date: dateTimeString, // Store as string without timezone conversion
        location: formData.location || '',
        isCompleted: formData.isCompleted,
        homeScore: formData.isCompleted && formData.homeScore ? parseInt(formData.homeScore) : undefined,
        awayScore: formData.isCompleted && formData.awayScore ? parseInt(formData.awayScore) : undefined,
        playerStats: formData.isCompleted ? {
          goalScorers: goalScorers.filter(scorer => scorer.playerId && scorer.count > 0),
          assistProviders: assistProviders.filter(provider => provider.playerId && provider.count > 0)
        } : undefined
      };

      const matchId = await createMatchMutation.mutateAsync(newMatch);
      
      // Recalculate standings for both teams
      await recalculateTeamStandingsMutation.mutateAsync(formData.homeTeamId);
      await recalculateTeamStandingsMutation.mutateAsync(formData.awayTeamId);
      
      // Update player stats if match is completed
      const updatePromises = [];
      
      if (formData.isCompleted) {
        // Update goal scorers
        for (const scorer of goalScorers) {
          if (scorer.playerId && scorer.count > 0) {
            const player = [...homeTeamPlayers, ...awayTeamPlayers].find(p => p.id === scorer.playerId);
            if (player) {
              updatePromises.push(
                updatePlayer(player.id, {
                  stats: {
                    ...player.stats || {},
                    goals: (player.stats?.goals || 0) + scorer.count
                  }
                })
              );
            }
          }
        }
        
        // Update assist providers
        for (const provider of assistProviders) {
          if (provider.playerId && provider.count > 0) {
            const player = [...homeTeamPlayers, ...awayTeamPlayers].find(p => p.id === provider.playerId);
            if (player) {
              updatePromises.push(
                updatePlayer(player.id, {
                  stats: {
                    ...player.stats || {},
                    assists: (player.stats?.assists || 0) + provider.count
                  }
                })
              );
            }
          }
        }
        
        // Note: Goalkeeper stats (goals allowed) are now managed separately through the goalkeeper stats page
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      setSuccess('Match added successfully!');
      resetForm();
    } catch (err) {
      console.error('Error adding match:', err);
      setError('Failed to add match');
    }
  };

  const handleEditMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;
    if (!isEditingMatch) return;

    try {
      // Get the original match to check if it was previously completed
      const originalMatch = matches?.find(m => m.id === isEditingMatch);
      
      const homeTeam = teams?.find(t => t.id === formData.homeTeamId);
      const awayTeam = teams?.find(t => t.id === formData.awayTeamId);

      if (!homeTeam || !awayTeam) {
        setError('Invalid team selection');
        return;
      }

      // Create a date string in format YYYY-MM-DDTHH:MM that preserves local time
      const dateTimeString = `${formData.date}T${formData.time || '00:00'}`;

      const updatedMatch: Partial<Match> = {
        homeTeamId: formData.homeTeamId,
        homeTeamName: homeTeam.name,
        awayTeamId: formData.awayTeamId,
        awayTeamName: awayTeam.name,
        date: dateTimeString, // Store as string without timezone conversion
        location: formData.location || '',
        isCompleted: formData.isCompleted,
        homeScore: formData.isCompleted && formData.homeScore ? parseInt(formData.homeScore) : undefined,
        awayScore: formData.isCompleted && formData.awayScore ? parseInt(formData.awayScore) : undefined,
        playerStats: formData.isCompleted ? {
          goalScorers: goalScorers.filter(scorer => scorer.playerId && scorer.count > 0),
          assistProviders: assistProviders.filter(provider => provider.playerId && provider.count > 0)
        } : undefined
      };

      // Log the update for debugging
      console.log('Updating match with data:', updatedMatch);
      
      await updateMatchMutation.mutateAsync({ id: isEditingMatch, data: updatedMatch });
      
      // Determine which teams need standings recalculation
      const teamsToRecalculate = new Set<string>();
      
      // If original match exists and teams have changed, recalculate for old teams
      if (originalMatch) {
        teamsToRecalculate.add(originalMatch.homeTeamId);
        teamsToRecalculate.add(originalMatch.awayTeamId);
      }
      
      // Always recalculate for current teams
      teamsToRecalculate.add(formData.homeTeamId);
      teamsToRecalculate.add(formData.awayTeamId);
      
      // Recalculate standings for all affected teams
      for (const teamId of teamsToRecalculate) {
        await recalculateTeamStandingsMutation.mutateAsync(teamId);
      }
      
      // Update player stats if match is completed
      const updatePromises = [];
      
      if (formData.isCompleted) {
        // Update goal scorers
        for (const scorer of goalScorers) {
          if (scorer.playerId && scorer.count > 0) {
            const player = [...homeTeamPlayers, ...awayTeamPlayers].find(p => p.id === scorer.playerId);
            if (player) {
              updatePromises.push(
                updatePlayer(player.id, {
                  stats: {
                    ...player.stats || {},
                    goals: (player.stats?.goals || 0) + scorer.count
                  }
                })
              );
            }
          }
        }
        
        // Update assist providers
        for (const provider of assistProviders) {
          if (provider.playerId && provider.count > 0) {
            const player = [...homeTeamPlayers, ...awayTeamPlayers].find(p => p.id === provider.playerId);
            if (player) {
              updatePromises.push(
                updatePlayer(player.id, {
                  stats: {
                    ...player.stats || {},
                    assists: (player.stats?.assists || 0) + provider.count
                  }
                })
              );
            }
          }
        }
        
        // Note: Goalkeeper stats (goals allowed) are now managed separately through the goalkeeper stats page
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      setSuccess('Match updated successfully!');
      resetForm();
    } catch (err) {
      console.error('Error updating match:', err);
      setError('Failed to update match');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the match to be deleted to know which teams to recalculate
      const matchToDelete = matches?.find(m => m.id === matchId);
      
      await deleteMatchMutation.mutateAsync(matchId);
      
      // Recalculate standings for affected teams
      if (matchToDelete) {
        await recalculateTeamStandingsMutation.mutateAsync(matchToDelete.homeTeamId);
        await recalculateTeamStandingsMutation.mutateAsync(matchToDelete.awayTeamId);
      }
      
      setSuccess('Match deleted successfully!');
    } catch (err) {
      setError('Failed to delete match');
      console.error(err);
    }
  };

  const startEditMatch = (match: Match) => {
    // Parse the date string (format: YYYY-MM-DDTHH:MM)
    const [datePart, timePart] = match.date.split('T');
    
    setFormData({
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      date: datePart,
      time: timePart,
      homeScore: match.homeScore !== null && match.homeScore !== undefined ? match.homeScore.toString() : '',
      awayScore: match.awayScore !== null && match.awayScore !== undefined ? match.awayScore.toString() : '',
      location: match.location || '',
      isCompleted: match.isCompleted
    });
    setIsEditingMatch(match.id);
    setIsAddingMatch(false);
    
    // Load player statistics if the match is completed
    if (match.isCompleted) {
      // We'll load the players first, then we can load the statistics
      const loadPlayersAndStats = async () => {
        try {
          const [homePlayers, awayPlayers] = await Promise.all([
            getPlayersByTeamId(match.homeTeamId),
            getPlayersByTeamId(match.awayTeamId)
          ]);
          
          setHomeTeamPlayers(homePlayers);
          setAwayTeamPlayers(awayPlayers);
          
          // Load player statistics if available
          if (match.playerStats) {
            setGoalScorers(match.playerStats.goalScorers || []);
            setAssistProviders(match.playerStats.assistProviders || []);
          } else {
            // If no player statistics are available, set empty arrays
            setGoalScorers([]);
            setAssistProviders([]);
          }
        } catch (error) {
          console.error('Error loading players for statistics:', error);
        }
      };
      
      loadPlayersAndStats();
    }
  };

  const formatDate = (dateString: string) => {
    // Parse the date string (format: YYYY-MM-DDTHH:MM)
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
      // No timeZone specified - will use local time
    }).format(date);
  };

  // Handle input change for batch matches
  const handleBatchInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const updatedMatches = [...batchMatches];
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      updatedMatches[index] = {
        ...updatedMatches[index],
        [name]: checked
      };
    } else {
      updatedMatches[index] = {
        ...updatedMatches[index],
        [name]: value
      };
    }
    
    setBatchMatches(updatedMatches);
  };

  // Add a new match row in batch mode
  const addMatchRow = () => {
    setBatchMatches([
      ...batchMatches,
      {
        homeTeamId: '',
        awayTeamId: '',
        date: '',
        time: '',
        location: '',
        isCompleted: false,
        homeScore: '',
        awayScore: '',
      }
    ]);
  };

  // Remove a match row in batch mode
  const removeMatchRow = (index: number) => {
    if (batchMatches.length > 1) {
      const updatedMatches = [...batchMatches];
      updatedMatches.splice(index, 1);
      setBatchMatches(updatedMatches);
    }
  };

  // Validate batch matches
  const validateBatchMatches = () => {
    for (let i = 0; i < batchMatches.length; i++) {
      const match = batchMatches[i];
      
      if (!match.homeTeamId || !match.awayTeamId) {
        setError(`Match #${i + 1}: Both teams are required`);
        return false;
      }

      if (match.homeTeamId === match.awayTeamId) {
        setError(`Match #${i + 1}: Home team and away team cannot be the same`);
        return false;
      }

      if (!match.date) {
        setError(`Match #${i + 1}: Match date is required`);
        return false;
      }
      
      if (match.isCompleted) {
        if (match.homeScore === '' || match.awayScore === '') {
          setError(`Match #${i + 1}: Scores are required for completed matches`);
          return false;
        }
        
        // Ensure scores are valid numbers
        const homeScore = parseInt(match.homeScore);
        const awayScore = parseInt(match.awayScore);
        
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
          setError(`Match #${i + 1}: Scores must be valid non-negative numbers`);
          return false;
        }
      }
    }
    return true;
  };

  // Handle batch match submission
  const handleAddBatchMatches = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateBatchMatches()) return;

    try {
      const createdMatches: string[] = [];
      // Keep track of teams that need standings recalculation
      const teamsToRecalculate = new Set<string>();
      
      for (const matchData of batchMatches) {
        const homeTeam = teams?.find(t => t.id === matchData.homeTeamId);
        const awayTeam = teams?.find(t => t.id === matchData.awayTeamId);

        if (!homeTeam || !awayTeam) {
          setError('Invalid team selection');
          return;
        }

        // Create a date string in format YYYY-MM-DDTHH:MM
        const dateTimeString = `${matchData.date}T${matchData.time || '00:00'}`;

        const newMatch: Partial<Match> = {
          homeTeamId: matchData.homeTeamId,
          homeTeamName: homeTeam.name,
          awayTeamId: matchData.awayTeamId,
          awayTeamName: awayTeam.name,
          date: dateTimeString,
          location: matchData.location || '',
          isCompleted: matchData.isCompleted,
          homeScore: matchData.isCompleted && matchData.homeScore ? parseInt(matchData.homeScore) : undefined,
          awayScore: matchData.isCompleted && matchData.awayScore ? parseInt(matchData.awayScore) : undefined
        };

        const matchId = await createMatchMutation.mutateAsync(newMatch);
        createdMatches.push(matchId);
        
        // Add teams to the recalculation set
        teamsToRecalculate.add(matchData.homeTeamId);
        teamsToRecalculate.add(matchData.awayTeamId);
      }
      
      // Recalculate standings for all affected teams
      for (const teamId of teamsToRecalculate) {
        await recalculateTeamStandingsMutation.mutateAsync(teamId);
      }
      
      setSuccess(`${createdMatches.length} matches added successfully!`);
      resetForm();
    } catch (err) {
      console.error('Error adding batch matches:', err);
      setError('Failed to add matches');
    }
  };

  // Add these functions to handle player stats
  const addGoalScorer = () => {
    setGoalScorers([...goalScorers, { playerId: '', count: 1 }]);
  };
  
  const removeGoalScorer = (index: number) => {
    const updatedScorers = [...goalScorers];
    updatedScorers.splice(index, 1);
    setGoalScorers(updatedScorers);
  };
  
  const updateGoalScorer = (index: number, playerId: string, count: number) => {
    const updatedScorers = [...goalScorers];
    updatedScorers[index] = { playerId, count };
    setGoalScorers(updatedScorers);
  };
  
  const addAssistProvider = () => {
    setAssistProviders([...assistProviders, { playerId: '', count: 1 }]);
  };
  
  const removeAssistProvider = (index: number) => {
    const updatedProviders = [...assistProviders];
    updatedProviders.splice(index, 1);
    setAssistProviders(updatedProviders);
  };
  
  const updateAssistProvider = (index: number, playerId: string, count: number) => {
    const updatedProviders = [...assistProviders];
    updatedProviders[index] = { playerId, count };
    setAssistProviders(updatedProviders);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 bg-green-700 p-4 rounded-lg">
        <h1 className="text-3xl font-bold text-white">Manage Matches</h1>
        <div className="flex space-x-2">
        <button
          onClick={() => {
            resetForm();
            setIsAddingMatch(true);
              setIsBatchMode(false);
          }}
          className="bg-white text-green-700 px-4 py-2 rounded-md hover:bg-gray-100 text-base font-medium"
        >
            Add Single Match
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddingMatch(true);
              setIsBatchMode(true);
            }}
            className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-gray-100 text-base font-medium"
          >
            Add Multiple Matches
        </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{success}</span>
        </div>
      )}

      {isAddingMatch && !isBatchMode && !isEditingMatch && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Add New Match</h2>
          <form onSubmit={handleAddMatch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="homeTeamId" className="block text-base font-medium text-gray-900 mb-1">
                  Home Team*
                </label>
                <select
                  id="homeTeamId"
                  name="homeTeamId"
                  value={formData.homeTeamId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">-- Select home team --</option>
                  {sortedTeams?.map((team) => (
                    <option key={`home-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="awayTeamId" className="block text-base font-medium text-gray-900 mb-1">
                  Away Team*
                </label>
                <select
                  id="awayTeamId"
                  name="awayTeamId"
                  value={formData.awayTeamId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">-- Select away team --</option>
                  {sortedTeams?.map((team) => (
                    <option key={`away-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-base font-medium text-gray-900 mb-1">
                  Date*
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-base font-medium text-gray-900 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-base font-medium text-gray-900 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Stadium or venue"
                />
              </div>
              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  id="isCompleted"
                  name="isCompleted"
                  checked={formData.isCompleted}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isCompleted" className="ml-2 block text-base text-gray-900">
                  Match Completed
                </label>
              </div>
            </div>

            {formData.isCompleted && (
              <div className="grid grid-cols-1 gap-4 mb-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium mb-2">Match Result</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="homeScore" className="block text-base font-medium text-gray-900 mb-1">
                      Home Team Score*
                    </label>
                    <input
                      type="number"
                      id="homeScore"
                      name="homeScore"
                      value={formData.homeScore}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required={formData.isCompleted}
                    />
                  </div>
                  <div>
                    <label htmlFor="awayScore" className="block text-base font-medium text-gray-900 mb-1">
                      Away Team Score*
                    </label>
                    <input
                      type="number"
                      id="awayScore"
                      name="awayScore"
                      value={formData.awayScore}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required={formData.isCompleted}
                    />
                  </div>
                </div>
                
                {/* Player Statistics Section */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-lg font-medium mb-4">Player Statistics</h3>
                  
                  {isLoadingPlayers ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  ) : (
                    <>
                      {/* Goal Scorers Section */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-md font-medium">Goal Scorers</h4>
                          <button
                            type="button"
                            onClick={addGoalScorer}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Goal Scorer
                          </button>
                        </div>
                        
                        {goalScorers.length === 0 ? (
                          <p className="text-sm text-gray-500 italic mb-2">No goal scorers added yet.</p>
                        ) : (
                          goalScorers.map((scorer, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-end">
                              <div className="md:col-span-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Player
                                </label>
                                <select
                                  value={scorer.playerId}
                                  onChange={(e) => updateGoalScorer(index, e.target.value, scorer.count)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                >
                                  <option value="">Select Player</option>
                                  <optgroup label={`${teams?.find(t => t.id === formData.homeTeamId)?.name || 'Home Team'} Players`}>
                                    {homeTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={`${teams?.find(t => t.id === formData.awayTeamId)?.name || 'Away Team'} Players`}>
                                    {awayTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Goals
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={scorer.count}
                                  onChange={(e) => updateGoalScorer(index, scorer.playerId, parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div className="md:col-span-1 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeGoalScorer(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Assist Providers Section */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-md font-medium">Assist Providers</h4>
                          <button
                            type="button"
                            onClick={addAssistProvider}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Assist Provider
                          </button>
                        </div>
                        
                        {assistProviders.length === 0 ? (
                          <p className="text-sm text-gray-500 italic mb-2">No assist providers added yet.</p>
                        ) : (
                          assistProviders.map((provider, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-end">
                              <div className="md:col-span-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Player
                                </label>
                                <select
                                  value={provider.playerId}
                                  onChange={(e) => updateAssistProvider(index, e.target.value, provider.count)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                >
                                  <option value="">Select Player</option>
                                  <optgroup label={`${teams?.find(t => t.id === formData.homeTeamId)?.name || 'Home Team'} Players`}>
                                    {homeTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={`${teams?.find(t => t.id === formData.awayTeamId)?.name || 'Away Team'} Players`}>
                                    {awayTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Assists
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={provider.count}
                                  onChange={(e) => updateAssistProvider(index, provider.playerId, parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div className="md:col-span-1 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeAssistProvider(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-2">
                        <p>Note: Player statistics will be updated when the match is saved.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800"
              >
                Add Match
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddingMatch && isBatchMode && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Multiple Matches</h2>
          <form onSubmit={handleAddBatchMatches}>
            {batchMatches.map((match, index) => (
              <div key={index} className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Match #{index + 1}</h3>
                  {batchMatches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMatchRow(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`homeTeamId-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Home Team*
                    </label>
                    <select
                      id={`homeTeamId-${index}`}
                      name="homeTeamId"
                      value={match.homeTeamId}
                      onChange={(e) => handleBatchInputChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">-- Select home team --</option>
                      {sortedTeams?.map((team) => (
                        <option key={`home-${index}-${team.id}`} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`awayTeamId-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Away Team*
                    </label>
                    <select
                      id={`awayTeamId-${index}`}
                      name="awayTeamId"
                      value={match.awayTeamId}
                      onChange={(e) => handleBatchInputChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">-- Select away team --</option>
                      {sortedTeams?.map((team) => (
                        <option key={`away-${index}-${team.id}`} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`date-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Date*
                    </label>
                    <input
                      type="date"
                      id={`date-${index}`}
                      name="date"
                      value={match.date}
                      onChange={(e) => handleBatchInputChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor={`time-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      id={`time-${index}`}
                      name="time"
                      value={match.time}
                      onChange={(e) => handleBatchInputChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor={`location-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id={`location-${index}`}
                      name="location"
                      value={match.location}
                      onChange={(e) => handleBatchInputChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Stadium or venue"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`isCompleted-${index}`}
                        name="isCompleted"
                        checked={match.isCompleted}
                        onChange={(e) => handleBatchInputChange(index, e)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`isCompleted-${index}`} className="ml-2 block text-sm text-gray-700">
                        Match Completed
                      </label>
                    </div>
                  </div>
                  {match.isCompleted && (
                    <>
                      <div>
                        <label htmlFor={`homeScore-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Home Team Score*
                        </label>
                        <input
                          type="number"
                          id={`homeScore-${index}`}
                          name="homeScore"
                          value={match.homeScore}
                          onChange={(e) => handleBatchInputChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          min="0"
                          required={match.isCompleted}
                        />
                      </div>
                      <div>
                        <label htmlFor={`awayScore-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                          Away Team Score*
                        </label>
                        <input
                          type="number"
                          id={`awayScore-${index}`}
                          name="awayScore"
                          value={match.awayScore}
                          onChange={(e) => handleBatchInputChange(index, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          min="0"
                          required={match.isCompleted}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-between mb-6">
              <button
                type="button"
                onClick={addMatchRow}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Match
              </button>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800"
              >
                Add All Matches
              </button>
            </div>
          </form>
        </div>
      )}

      {isEditingMatch && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Match</h2>
          <form onSubmit={handleEditMatch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="homeTeamId" className="block text-sm font-medium text-gray-700 mb-1">
                  Home Team*
                </label>
                <select
                  id="homeTeamId"
                  name="homeTeamId"
                  value={formData.homeTeamId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">-- Select home team --</option>
                  {sortedTeams?.map((team) => (
                    <option key={`home-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="awayTeamId" className="block text-sm font-medium text-gray-700 mb-1">
                  Away Team*
                </label>
                <select
                  id="awayTeamId"
                  name="awayTeamId"
                  value={formData.awayTeamId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">-- Select away team --</option>
                  {sortedTeams?.map((team) => (
                    <option key={`away-${team.id}`} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date*
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Stadium or venue"
                />
              </div>
              <div className="flex items-center h-full pt-6">
                <input
                  type="checkbox"
                  id="isCompleted"
                  name="isCompleted"
                  checked={formData.isCompleted}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-900">
                  Match Completed
                </label>
              </div>
            </div>

            {formData.isCompleted && (
              <div className="grid grid-cols-1 gap-4 mb-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium mb-2">Match Result</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="homeScore" className="block text-sm font-medium text-gray-700 mb-1">
                      Home Team Score*
                    </label>
                    <input
                      type="number"
                      id="homeScore"
                      name="homeScore"
                      value={formData.homeScore}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required={formData.isCompleted}
                    />
                  </div>
                  <div>
                    <label htmlFor="awayScore" className="block text-sm font-medium text-gray-700 mb-1">
                      Away Team Score*
                    </label>
                    <input
                      type="number"
                      id="awayScore"
                      name="awayScore"
                      value={formData.awayScore}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required={formData.isCompleted}
                    />
                  </div>
                </div>
                
                {/* Player Statistics Section */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <h3 className="text-lg font-medium mb-4">Player Statistics</h3>
                  
                  {isLoadingPlayers ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  ) : (
                    <>
                      {/* Goal Scorers Section */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-md font-medium">Goal Scorers</h4>
                          <button
                            type="button"
                            onClick={addGoalScorer}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Goal Scorer
                          </button>
                        </div>
                        
                        {goalScorers.length === 0 ? (
                          <p className="text-sm text-gray-500 italic mb-2">No goal scorers added yet.</p>
                        ) : (
                          goalScorers.map((scorer, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-end">
                              <div className="md:col-span-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Player
                                </label>
                                <select
                                  value={scorer.playerId}
                                  onChange={(e) => updateGoalScorer(index, e.target.value, scorer.count)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                >
                                  <option value="">Select Player</option>
                                  <optgroup label={`${teams?.find(t => t.id === formData.homeTeamId)?.name || 'Home Team'} Players`}>
                                    {homeTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={`${teams?.find(t => t.id === formData.awayTeamId)?.name || 'Away Team'} Players`}>
                                    {awayTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Goals
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={scorer.count}
                                  onChange={(e) => updateGoalScorer(index, scorer.playerId, parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div className="md:col-span-1 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeGoalScorer(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Assist Providers Section */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-md font-medium">Assist Providers</h4>
                          <button
                            type="button"
                            onClick={addAssistProvider}
                            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Assist Provider
                          </button>
                        </div>
                        
                        {assistProviders.length === 0 ? (
                          <p className="text-sm text-gray-500 italic mb-2">No assist providers added yet.</p>
                        ) : (
                          assistProviders.map((provider, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2 items-end">
                              <div className="md:col-span-8">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Player
                                </label>
                                <select
                                  value={provider.playerId}
                                  onChange={(e) => updateAssistProvider(index, e.target.value, provider.count)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                >
                                  <option value="">Select Player</option>
                                  <optgroup label={`${teams?.find(t => t.id === formData.homeTeamId)?.name || 'Home Team'} Players`}>
                                    {homeTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={`${teams?.find(t => t.id === formData.awayTeamId)?.name || 'Away Team'} Players`}>
                                    {awayTeamPlayers.map(player => (
                                      <option key={player.id} value={player.id}>
                                        {player.name} ({player.position})
                                      </option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                              <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Assists
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={provider.count}
                                  onChange={(e) => updateAssistProvider(index, provider.playerId, parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div className="md:col-span-1 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => removeAssistProvider(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 mt-2">
                        <p>Note: Player statistics will be updated when the match is saved.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800"
              >
                Update Match
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Date</th>
                <th className="py-3 px-6 text-left">Teams</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Result</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {isLoadingMatches ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  </td>
                </tr>
              ) : matches && matches.length > 0 ? (
                matches.map((match) => (
                  <tr key={match.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {formatDate(match.date)}
                    </td>
                    <td className="py-3 px-6 text-left">
                      <div>
                        <span className="font-medium">{match.homeTeamName}</span> vs <span className="font-medium">{match.awayTeamName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {match.isCompleted ? (
                        <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">Completed</span>
                      ) : (
                        <span className="bg-yellow-100 text-yellow-800 py-1 px-3 rounded-full text-xs">Scheduled</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {match.isCompleted ? (
                        <div className="font-medium">
                          {match.homeScore !== undefined && match.awayScore !== undefined ? (
                            <>
                              <span className={
                                match.homeScore > match.awayScore 
                                  ? 'text-green-600' 
                                  : match.homeScore < match.awayScore 
                                    ? 'text-red-600' 
                                    : 'text-gray-800'
                              }>{match.homeScore}</span>
                              <span className="text-gray-400"> - </span>
                              <span className={
                                match.awayScore > match.homeScore 
                                  ? 'text-green-600' 
                                  : match.awayScore < match.homeScore 
                                    ? 'text-red-600' 
                                    : 'text-gray-800'
                              }>{match.awayScore}</span>
                            </>
                          ) : (
                            <span>{match.homeScore} - {match.awayScore}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => startEditMatch(match)}
                          className="transform hover:text-green-700 hover:scale-110 mr-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
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
                      <strong className="font-bold">No matches found!</strong>
                      <span className="block sm:inline"> There are currently no matches scheduled.</span>
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