import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllMatches,
  getFutureMatches,
  getPastMatches,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch,
  getAllStandings,
  getStandingByTeamId,
  updateStandings,
  recalculateTeamStandings,
  recalculateAllTeamStandings,
  updateTeamManualRanking
} from '../services/matchService';
import { Match, Standing } from '../types';

// Hook for fetching all matches
export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: getAllMatches,
  });
}

// Hook for fetching future matches
export function useFutureMatches() {
  return useQuery({
    queryKey: ['matches', 'future'],
    queryFn: getFutureMatches,
  });
}

// Hook for fetching past matches
export function usePastMatches() {
  return useQuery({
    queryKey: ['matches', 'past'],
    queryFn: getPastMatches,
  });
}

// Hook for fetching a single match
export function useMatch(id: string) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => getMatchById(id),
    enabled: !!id,
  });
}

// Hook for creating a match
export function useCreateMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (matchData: Partial<Match>) => createMatch(matchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// Hook for updating a match
export function useUpdateMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) => updateMatch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches', variables.id] });
    },
  });
}

// Hook for deleting a match
export function useDeleteMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// Hook for updating standings
export function useUpdateStandings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateStandings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
}

// Hook for recalculating a team's standings
export function useRecalculateTeamStandings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: recalculateTeamStandings,
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['standings', teamId] });
    },
  });
}

// Hook for recalculating all team standings
export function useRecalculateAllTeamStandings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: recalculateAllTeamStandings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
}

// Hook for updating a team's manual ranking
export function useUpdateTeamManualRanking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ teamId, manuallyRanked, manualRank }: { 
      teamId: string; 
      manuallyRanked: boolean; 
      manualRank?: number 
    }) => updateTeamManualRanking(teamId, manuallyRanked, manualRank),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['standings'] });
      queryClient.invalidateQueries({ queryKey: ['standings', variables.teamId] });
    },
  });
}

// Hook for fetching all standings
export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: getAllStandings,
  });
}

// Hook for fetching a team's standing
export function useStandingByTeamId(teamId: string) {
  return useQuery({
    queryKey: ['standings', teamId],
    queryFn: () => getStandingByTeamId(teamId),
    enabled: !!teamId,
  });
} 