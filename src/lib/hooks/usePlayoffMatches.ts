import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllPlayoffMatches,
  getPlayoffMatchesByRound,
  getPlayoffMatchById,
  createPlayoffMatch,
  updatePlayoffMatch,
  deletePlayoffMatch,
  initializePlayoffBracket,
  updateNextRoundMatch
} from '../services/playoffService';
import { PlayoffMatch } from '../types';

// Hook for fetching all playoff matches
export function usePlayoffMatches() {
  return useQuery({
    queryKey: ['playoffMatches'],
    queryFn: getAllPlayoffMatches,
  });
}

// Hook for fetching playoff matches by round
export function usePlayoffMatchesByRound(round: 'quarterfinal' | 'semifinal' | 'final') {
  return useQuery({
    queryKey: ['playoffMatches', round],
    queryFn: () => getPlayoffMatchesByRound(round),
    enabled: !!round,
  });
}

// Hook for fetching a single playoff match
export function usePlayoffMatch(id: string) {
  return useQuery({
    queryKey: ['playoffMatches', id],
    queryFn: () => getPlayoffMatchById(id),
    enabled: !!id,
  });
}

// Hook for creating a playoff match
export function useCreatePlayoffMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (matchData: Partial<PlayoffMatch>) => createPlayoffMatch(matchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffMatches'] });
    },
  });
}

// Hook for updating a playoff match
export function useUpdatePlayoffMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlayoffMatch> }) => updatePlayoffMatch(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playoffMatches'] });
      queryClient.invalidateQueries({ queryKey: ['playoffMatches', variables.id] });
    },
  });
}

// Hook for deleting a playoff match
export function useDeletePlayoffMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deletePlayoffMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffMatches'] });
    },
  });
}

// Hook for initializing the playoff bracket
export function useInitializePlayoffBracket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: initializePlayoffBracket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffMatches'] });
    },
  });
}

// Hook for updating the next round match based on winners
export function useUpdateNextRoundMatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      currentRound, 
      currentMatchNumber, 
      winnerId, 
      winnerName 
    }: { 
      currentRound: 'quarterfinal' | 'semifinal';
      currentMatchNumber: number;
      winnerId: string;
      winnerName: string;
    }) => updateNextRoundMatch(currentRound, currentMatchNumber, winnerId, winnerName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playoffMatches'] });
    },
  });
} 