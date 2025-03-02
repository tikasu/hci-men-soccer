import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  getPlayersByTeamId,
  addPlayerToTeam,
  updatePlayer,
  deletePlayer,
} from '../services/teamService';
import { Team, Player } from '../types';

// Hook for fetching all teams
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: getAllTeams,
  });
}

// Hook for fetching a single team by ID
export function useTeam(id: string) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => getTeamById(id),
    enabled: !!id,
  });
}

// Hook for creating a team
export function useCreateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (team: Omit<Team, 'id'>) => createTeam(team),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// Hook for updating a team
export function useUpdateTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, team }: { id: string; team: Partial<Team> }) => updateTeam(id, team),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', variables.id] });
    },
  });
}

// Hook for deleting a team
export function useDeleteTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}

// Hook for fetching players by team ID
export function usePlayersByTeamId(teamId: string) {
  return useQuery({
    queryKey: ['players', 'team', teamId],
    queryFn: () => getPlayersByTeamId(teamId),
    enabled: !!teamId,
  });
}

// Hook for adding a player to a team
export function useAddPlayerToTeam() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ teamId, player }: { teamId: string; player: Omit<Player, 'id'> }) => 
      addPlayerToTeam(teamId, player),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['players', 'team', variables.teamId] });
    },
  });
}

// Hook for updating a player
export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, player }: { id: string; player: Partial<Player> }) => updatePlayer(id, player),
    onSuccess: (_, variables) => {
      if (variables.player.teamId) {
        queryClient.invalidateQueries({ queryKey: ['players', 'team', variables.player.teamId] });
      }
    },
  });
}

// Hook for deleting a player
export function useDeletePlayer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, teamId }: { id: string; teamId: string }) => {
      const result = deletePlayer(id);
      return { result, teamId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['players', 'team', variables.teamId] });
    },
  });
} 