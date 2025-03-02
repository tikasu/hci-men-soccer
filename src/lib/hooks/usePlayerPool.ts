import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPoolPlayers,
  getPoolPlayerById,
  addPlayerToPool,
  updatePoolPlayer,
  togglePlayerActiveStatus,
  assignPlayersToTeam,
  removePlayerFromTeam,
  importPlayersFromTeam,
  PoolPlayer
} from '../services/playerPoolService';

// Hook for fetching all players in the pool
export function usePlayerPool() {
  return useQuery({
    queryKey: ['player-pool'],
    queryFn: getAllPoolPlayers,
    staleTime: 0, // Consider data stale immediately
    cacheTime: 0, // Don't cache the data
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

// Hook for fetching a single player from the pool by ID
export function usePoolPlayer(id: string) {
  return useQuery({
    queryKey: ['player-pool', id],
    queryFn: () => getPoolPlayerById(id),
    enabled: !!id,
  });
}

// Hook for adding a player to the pool
export function useAddPlayerToPool() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (player: Omit<PoolPlayer, 'id'>) => addPlayerToPool(player),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-pool'] });
    },
  });
}

// Hook for updating a player in the pool
export function useUpdatePoolPlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, player }: { id: string; player: Partial<PoolPlayer> }) => 
      updatePoolPlayer(id, player),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player-pool'] });
      queryClient.invalidateQueries({ queryKey: ['player-pool', variables.id] });
    },
  });
}

// Hook for toggling a player's active status
export function useTogglePlayerStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      togglePlayerActiveStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player-pool'] });
      queryClient.invalidateQueries({ queryKey: ['player-pool', variables.id] });
    },
  });
}

// Hook for assigning players to a team
export function useAssignPlayersToTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      playerIds, 
      teamId, 
      teamName, 
      season 
    }: { 
      playerIds: string[]; 
      teamId: string; 
      teamName: string;
      season: string;
    }) => assignPlayersToTeam(playerIds, teamId, teamName, season),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player-pool'] });
      queryClient.invalidateQueries({ queryKey: ['players', 'team', variables.teamId] });
      
      // Invalidate individual player queries
      variables.playerIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['player-pool', id] });
      });
    },
  });
}

// Hook for removing a player from a team
export function useRemovePlayerFromTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      playerId, 
      teamPlayerId, 
      teamId 
    }: { 
      playerId: string; 
      teamPlayerId: string;
      teamId: string;
    }) => {
      const result = removePlayerFromTeam(playerId, teamPlayerId);
      return { result, teamId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['player-pool'] });
      queryClient.invalidateQueries({ queryKey: ['player-pool', variables.playerId] });
      queryClient.invalidateQueries({ queryKey: ['players', 'team', variables.teamId] });
    },
  });
}

// Hook for importing players from a team to the pool
export function useImportPlayersFromTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      teamId, 
      teamName, 
      season 
    }: { 
      teamId: string; 
      teamName: string;
      season: string;
    }) => importPlayersFromTeam(teamId, teamName, season),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player-pool'] });
    },
  });
} 