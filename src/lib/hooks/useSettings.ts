import { useQuery } from '@tanstack/react-query';
import { getSettings } from '../services/settingsService';
import { Settings } from '../types';

// Hook for fetching league settings
export function useSettings() {
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      return await getSettings();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
} 