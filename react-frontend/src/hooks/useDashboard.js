import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import api from '../services/api';

// Fetch dashboard data - REALTIME updates every second from global config
export const useDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
    // Uses global config: refetchInterval: 1000 (REALTIME EVERY SECOND!)
    // staleTime: 0, refetchOnMount: 'always' - instant from cache + 1s background updates!
  });
};
