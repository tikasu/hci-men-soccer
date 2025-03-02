import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateTeamInsight,
  generatePlayerInsight,
  generateMatchInsight,
  getInsightsByTypeAndId,
  getLatestInsights,
} from '../services/aiService';
import { getSettings } from '../services/settingsService';

// Hook for checking if AI insights are enabled
export function useAIInsightsEnabled() {
  return useQuery({
    queryKey: ['settings', 'aiInsights'],
    queryFn: async () => {
      const settings = await getSettings();
      return settings.enableAIInsights;
    },
  });
}

// Hook for generating a team insight
export function useGenerateTeamInsight() {
  const queryClient = useQueryClient();
  const { data: isEnabled } = useAIInsightsEnabled();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      // Check if AI insights are enabled
      if (!isEnabled) {
        throw new Error('AI insights are disabled in settings');
      }
      return generateTeamInsight(teamId);
    },
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'latest'] });
    },
  });
}

// Hook for generating a player insight
export function useGeneratePlayerInsight() {
  const queryClient = useQueryClient();
  const { data: isEnabled } = useAIInsightsEnabled();
  
  return useMutation({
    mutationFn: async ({ playerId, teamId }: { playerId: string; teamId: string }) => {
      // Check if AI insights are enabled
      if (!isEnabled) {
        throw new Error('AI insights are disabled in settings');
      }
      return generatePlayerInsight(playerId, teamId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'player', variables.playerId] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'latest'] });
    },
  });
}

// Hook for generating a match insight
export function useGenerateMatchInsight() {
  const queryClient = useQueryClient();
  const { data: isEnabled } = useAIInsightsEnabled();
  
  return useMutation({
    mutationFn: async (matchId: string) => {
      // Check if AI insights are enabled
      if (!isEnabled) {
        throw new Error('AI insights are disabled in settings');
      }
      return generateMatchInsight(matchId);
    },
    onSuccess: (_, matchId) => {
      queryClient.invalidateQueries({ queryKey: ['insights', 'match', matchId] });
      queryClient.invalidateQueries({ queryKey: ['insights', 'latest'] });
    },
  });
}

// Hook for fetching insights by type and ID
export function useInsightsByTypeAndId(type: 'team' | 'player' | 'match', id: string) {
  const { data: isEnabled } = useAIInsightsEnabled();
  
  return useQuery({
    queryKey: ['insights', type, id],
    queryFn: () => getInsightsByTypeAndId(type, id),
    enabled: !!id && isEnabled !== false,
  });
}

// Hook for fetching latest insights
export function useLatestInsights(limit: number = 5) {
  const { data: isEnabled } = useAIInsightsEnabled();
  
  return useQuery({
    queryKey: ['insights', 'latest', limit],
    queryFn: () => getLatestInsights(limit),
    enabled: isEnabled !== false,
  });
} 