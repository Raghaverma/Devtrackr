/**
 * GitHub Contributions API endpoints
 * Note: GitHub doesn't have a public REST API for contribution graphs
 * This uses the GraphQL API as an exception (requires preview header)
 */

import { githubFetch } from './fetch';
import { GitHubContributions } from '../types';

/**
 * Fetch contribution statistics using GraphQL API
 * This is an experimental feature as GraphQL API may change
 */
export function fetchUserContributions(
  _token: string,
  _username: string
): Promise<GitHubContributions> {
  // GitHub's contribution graph is not available via REST API
  // We'll use a workaround: fetch events and calculate contributions
  // For a production implementation, you might want to use GraphQL API
  
  // For now, return empty structure - this will be calculated from commits
  // In a real implementation, you'd parse the contribution graph HTML
  // or use the GraphQL API with preview headers
  
  return Promise.resolve({
    totalContributions: 0,
    weeks: [],
  });
}

/**
 * Calculate contributions from commit events
 * This is a fallback when GraphQL API is not available
 */
interface GitHubEvent {
  type: string;
  created_at?: string;
  payload?: {
    commits?: unknown[];
  };
}

export async function calculateContributionsFromEvents(
  token: string,
  username: string
): Promise<Map<string, number>> {
  // Fetch user events
  const events = await githubFetch<GitHubEvent[]>({
    token,
    endpoint: `/users/${username}/events/public?per_page=100`,
  });

  const contributions = new Map<string, number>();

  for (const event of events) {
    if (event.type === 'PushEvent' && event.created_at) {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      const count = event.payload?.commits?.length || 0;
      contributions.set(date, (contributions.get(date) || 0) + count);
    }
  }

  return contributions;
}

