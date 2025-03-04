'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import { addPlayerToTeam, updatePlayer, deletePlayer } from '@/lib/services/teamService';
import { Player } from '@/lib/types';
import BatchPlayerAdd from './components/BatchPlayerAdd';
import { useImportPlayersFromTeam } from '@/lib/hooks/usePlayerPool';

export default function AdminPlayersPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const importPlayersMutation = useImportPlayersFromTeam();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [isEditingPlayer, setIsEditingPlayer] = useState<string | null>(null);
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    number: '',
    stats: {
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      gamesPlayed: 0
    }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Load players when a team is selected
  useEffect(() => {
    const loadPlayers = async () => {
      if (!selectedTeam) {
        setPlayers([]);
        return;
      }

      setIsLoadingPlayers(true);
      try {
        const { getPlayersByTeamId } = await import('@/lib/services/teamService');
        const teamPlayers = await getPlayersByTeamId(selectedTeam);
        setPlayers(teamPlayers);
      } catch (err) {
        console.error('Failed to load players:', err);
        setError('Failed to load players');
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    loadPlayers();
  }, [selectedTeam]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('stats.')) {
      const statName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          [statName]: parseInt(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      number: '',
      stats: {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        gamesPlayed: 0
      }
    });
    setIsAddingPlayer(false);
    setIsEditingPlayer(null);
    setIsBatchAdding(false);
    setError('');
    setSuccess('');
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTeam) {
      setError('Please select a team first');
      return;
    }

    if (!formData.name || !formData.position) {
      setError('Name and position are required');
      return;
    }

    try {
      await addPlayerToTeam(selectedTeam, {
        name: formData.name,
        position: formData.position,
        number: formData.number || '',
        teamId: selectedTeam,
        stats: formData.stats
      });
      setSuccess('Player added successfully!');
      resetForm();
      
      // Reload players
      const { getPlayersByTeamId } = await import('@/lib/services/teamService');
      const teamPlayers = await getPlayersByTeamId(selectedTeam);
      setPlayers(teamPlayers);
    } catch (err) {
      setError('Failed to add player');
      console.error(err);
    }
  };

  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedTeam) {
      setError('Please select a team first');
      return;
    }

    if (!formData.name || !formData.position) {
      setError('Name and position are required');
      return;
    }

    if (!isEditingPlayer) return;

    try {
      await updatePlayer(isEditingPlayer, {
        name: formData.name,
        position: formData.position,
        number: formData.number || '',
        stats: formData.stats,
        teamId: selectedTeam
      });
      setSuccess('Player updated successfully!');
      resetForm();
      
      // Reload players
      const { getPlayersByTeamId } = await import('@/lib/services/teamService');
      const teamPlayers = await getPlayersByTeamId(selectedTeam);
      setPlayers(teamPlayers);
    } catch (err) {
      setError('Failed to update player');
      console.error(err);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }

    try {
      await deletePlayer(playerId);
      setSuccess('Player deleted successfully!');
      
      // Reload players
      const { getPlayersByTeamId } = await import('@/lib/services/teamService');
      const teamPlayers = await getPlayersByTeamId(selectedTeam);
      setPlayers(teamPlayers);
    } catch (err) {
      setError('Failed to delete player');
      console.error(err);
    }
  };

  const startEditPlayer = (player: Player) => {
    setFormData({
      name: player.name,
      position: player.position,
      number: player.number || '',
      stats: {
        goals: player.stats.goals || 0,
        assists: player.stats.assists || 0,
        yellowCards: player.stats.yellowCards || 0,
        redCards: player.stats.redCards || 0,
        gamesPlayed: player.stats.gamesPlayed || 0
      }
    });
    setIsEditingPlayer(player.id);
    setIsAddingPlayer(false);
  };

  const handleBatchAddSuccess = async () => {
    setSuccess('Players added successfully!');
    resetForm();
    
    // Reload players
    const { getPlayersByTeamId } = await import('@/lib/services/teamService');
    const teamPlayers = await getPlayersByTeamId(selectedTeam);
    setPlayers(teamPlayers);
  };

  const handleImportToPool = async () => {
    if (!selectedTeam) {
      setError('Please select a team first');
      return;
    }
    
    const team = teams?.find(t => t.id === selectedTeam);
    if (!team) {
      setError('Team not found');
      return;
    }
    
    try {
      await importPlayersMutation.mutateAsync({
        teamId: selectedTeam,
        teamName: team.name,
        season: 'Winter 2025'
      });
      
      setSuccess('Players successfully imported to player pool!');
    } catch (err) {
      setError('Failed to import players to pool');
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-700 p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Players</h1>
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

      {/* Player Pool Access */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Player Pool</h2>
            <p className="text-gray-700 text-base mt-1">
              Access the database of all players who have participated in previous seasons (Fall 2024, Winter 2025)
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/player-pool')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Manage Player Pool
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="team" className="block text-base font-medium text-gray-900 mb-1">
            Select Team
          </label>
          <select
            id="team"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">-- Select a team --</option>
            {teams?.slice().sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTeam && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleImportToPool}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Import to Player Pool
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsBatchAdding(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add Multiple Players
            </button>
            <button
              onClick={() => {
                resetForm();
                setIsAddingPlayer(true);
              }}
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Add Single Player
            </button>
          </div>
        )}
      </div>

      {isBatchAdding && (
        <BatchPlayerAdd 
          teamId={selectedTeam} 
          onSuccess={handleBatchAddSuccess} 
          onCancel={resetForm} 
        />
      )}

      {(isAddingPlayer || isEditingPlayer) && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">{isAddingPlayer ? 'Add New Player' : 'Edit Player'}</h2>
          <form onSubmit={isAddingPlayer ? handleAddPlayer : handleEditPlayer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-base font-medium text-gray-900 mb-1">
                  Player Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="position" className="block text-base font-medium text-gray-900 mb-1">
                  Position*
                </label>
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">-- Select position --</option>
                  <option value="Goalkeeper">Goalkeeper</option>
                  <option value="Fieldplayer">Fieldplayer</option>
                </select>
              </div>
              <div>
                <label htmlFor="number" className="block text-base font-medium text-gray-900 mb-1">
                  Jersey Number
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <h3 className="text-lg font-medium mb-2 text-gray-900">Player Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="stats.goals" className="block text-base font-medium text-gray-900 mb-1">
                  Goals
                </label>
                <input
                  type="number"
                  id="stats.goals"
                  name="stats.goals"
                  value={formData.stats.goals}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="stats.assists" className="block text-base font-medium text-gray-900 mb-1">
                  Assists
                </label>
                <input
                  type="number"
                  id="stats.assists"
                  name="stats.assists"
                  value={formData.stats.assists}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="stats.gamesPlayed" className="block text-base font-medium text-gray-900 mb-1">
                  Games Played
                </label>
                <input
                  type="number"
                  id="stats.gamesPlayed"
                  name="stats.gamesPlayed"
                  value={formData.stats.gamesPlayed}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="stats.yellowCards" className="block text-base font-medium text-gray-900 mb-1">
                  Yellow Cards
                </label>
                <input
                  type="number"
                  id="stats.yellowCards"
                  name="stats.yellowCards"
                  value={formData.stats.yellowCards}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="stats.redCards" className="block text-base font-medium text-gray-900 mb-1">
                  Red Cards
                </label>
                <input
                  type="number"
                  id="stats.redCards"
                  name="stats.redCards"
                  value={formData.stats.redCards}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
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
                {isAddingPlayer ? 'Add Player' : 'Update Player'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedTeam && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Position</th>
                  <th className="py-3 px-6 text-center">Goals</th>
                  <th className="py-3 px-6 text-center">Assists</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {isLoadingPlayers ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                      </div>
                    </td>
                  </tr>
                ) : players && players.length > 0 ? (
                  players.map((player) => (
                    <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{player.name}</td>
                      <td className="py-3 px-6 text-left">{player.position}</td>
                      <td className="py-3 px-6 text-center">{player.stats.goals}</td>
                      <td className="py-3 px-6 text-center">{player.stats.assists}</td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex item-center justify-center">
                          <button
                            onClick={() => startEditPlayer(player)}
                            className="transform hover:text-green-700 hover:scale-110 mr-3"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePlayer(player.id)}
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
                      No players found for this team
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 