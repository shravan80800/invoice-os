import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';

export const useApi = () => {
  const { getToken, orgId } = useAuth();

  const fetchApi = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      try {
        // Fetch the default Clerk session token without requiring custom templates
        const token = await getToken();

        if (!token) {
          console.error('Clerk getToken() failed. Token is null.');
          throw new Error('User not authenticated by Clerk');
        }

        console.log('Successfully retrieved Clerk token!');

        // Build the headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers as Record<string, string>),
        };

        // Attach the workspace ID so your backend Row-Level Security works
        if (orgId) {
          headers['x-workspace-id'] = orgId;
        }

        // Make the actual network request to NestJS
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (!response.ok) {
          // If NestJS rejects it, extract the exact NestJS error message
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Backend returned ${response.status}`);
        }

        return response.json();
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    [getToken, orgId]
  );

  return { fetchApi };
};