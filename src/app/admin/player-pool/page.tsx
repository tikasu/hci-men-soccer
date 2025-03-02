'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import { usePlayerPool, useAssignPlayersToTeam, useTogglePlayerStatus } from '@/lib/hooks/usePlayerPool';
import { PoolPlayer } from '@/lib/services/playerPoolService';
import Link from 'next/link';

export default function PlayerPoolPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: poolPlayers, isLoading: isLoadingPool } = usePlayerPool();
  
  const assignPlayersMutation = useAssignPlayersToTeam();
  const toggleStatusMutation = useTogglePlayerStatus();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [targetTeam, setTargetTeam] = useState('');
  const [currentSeason, setCurrentSeason] = useState('Winter 2025');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Add console logs to debug player data
  useEffect(() => {
    if (poolPlayers && Array.isArray(poolPlayers)) {
      console.log(`Total players in pool: ${poolPlayers.length}`);
      console.log(`Active players: ${poolPlayers.filter(p => p.isActive).length}`);
      console.log(`Goalkeepers: ${poolPlayers.filter(p => p.position === 'Goalkeeper').length}`);
      console.log(`Fieldplayers: ${poolPlayers.filter(p => p.position === 'Fieldplayer').length}`);
    }
  }, [poolPlayers]);
  
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Filter and search players
  const filteredPlayers = poolPlayers && Array.isArray(poolPlayers)
    ? poolPlayers.filter(player => {
        // Filter by search term
        if (searchTerm && !player.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by position
        if (positionFilter && player.position !== positionFilter) {
          return false;
        }
        
        // Filter by status
        if (statusFilter === 'active' && !player.isActive) {
          return false;
        }
        if (statusFilter === 'inactive' && player.isActive) {
          return false;
        }
        
        return true;
      })
    : [];
    
  // Log filtered players count - moved before conditional returns
  useEffect(() => {
    if (filteredPlayers) {
      console.log(`Filtered players: ${filteredPlayers.length}`);
      console.log(`Current filters - Search: "${searchTerm}", Position: "${positionFilter}", Status: "${statusFilter}"`);
    }
  }, [filteredPlayers, searchTerm, positionFilter, statusFilter]);

  if (loading || isLoadingPool) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  const handleSelectPlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      setSelectedPlayers([...selectedPlayers, playerId]);
    }
  };
  
  const handleAssignToTeam = async () => {
    if (!targetTeam) {
      setError('Please select a team to assign players to');
      return;
    }
    
    if (selectedPlayers.length === 0) {
      setError('Please select at least one player to assign');
      return;
    }
    
    const selectedTeam = teams?.find(team => team.id === targetTeam);
    if (!selectedTeam) {
      setError('Selected team not found');
      return;
    }
    
    try {
      await assignPlayersMutation.mutateAsync({
        playerIds: selectedPlayers,
        teamId: targetTeam,
        teamName: selectedTeam.name,
        season: currentSeason
      });
      
      setSuccess(`${selectedPlayers.length} players assigned to ${selectedTeam.name} successfully!`);
      setSelectedPlayers([]);
    } catch (err) {
      setError('Failed to assign players to team');
      console.error(err);
    }
  };
  
  const handleToggleStatus = async (playerId: string, isActive: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync({
        id: playerId,
        isActive: !isActive
      });
      
      setSuccess(`Player status updated successfully!`);
    } catch (err) {
      setError('Failed to update player status');
      console.error(err);
    }
  };
  
  const handleAddNewPlayer = () => {
    // Navigate to add new player form
    router.push('/admin/player-pool/add');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Player Pool</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/admin/players')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Team Players
          </button>
          <button
            onClick={handleAddNewPlayer}
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
          >
            Add New Player to Pool
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Players
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Player name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <select
              id="position"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Positions</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Fieldplayer">Fieldplayer</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Players</option>
              <option value="active">Active Players</option>
              <option value="inactive">Inactive Players</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setPositionFilter('');
                setStatusFilter('all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assign to Team */}
      {selectedPlayers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-3 md:mb-0">
              <span className="font-medium">{selectedPlayers.length} players selected</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-3">
              <select
                value={targetTeam}
                onChange={(e) => setTargetTeam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">-- Select team --</option>
                {teams?.slice().sort((a, b) => a.name.localeCompare(b.name)).map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={currentSeason}
                onChange={(e) => setCurrentSeason(e.target.value)}
                placeholder="Season (e.g. Winter 2025)"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={handleAssignToTeam}
                className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
              >
                Assign to Team
              </button>
              <button
                onClick={() => setSelectedPlayers([])}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Player List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-center w-12">
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPlayers(filteredPlayers.map(p => p.id));
                      } else {
                        setSelectedPlayers([]);
                      }
                    }}
                    checked={filteredPlayers.length > 0 && selectedPlayers.length === filteredPlayers.length}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </th>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Position</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-left">Current Team</th>
                <th className="py-3 px-6 text-center">Last Season</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {isLoadingPool ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player: PoolPlayer) => (
                  <tr key={player.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedPlayers.includes(player.id)}
                        onChange={() => handleSelectPlayer(player.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{player.name}</td>
                    <td className="py-3 px-6 text-left">{player.position}</td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        player.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {player.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {player.currentTeam ? (
                        <Link href={`/admin/teams/${player.currentTeamId}`} className="text-blue-600 hover:underline">
                          {player.currentTeam}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {player.lastSeason || '-'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => router.push(`/admin/player-pool/edit/${player.id}`)}
                          className="transform hover:text-green-700 hover:scale-110 mr-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(player.id, player.isActive)}
                          className={`transform hover:scale-110 mr-3 ${
                            player.isActive ? 'text-gray-500 hover:text-gray-700' : 'text-green-500 hover:text-green-700'
                          }`}
                        >
                          {player.isActive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">No players found!</strong>
                      <span className="block sm:inline"> No players match your search criteria.</span>
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