/**
 * GitHub User API endpoints
 */

import { githubFetch } from './fetch';
import { GitHubUser } from '../types';

export async function fetchUser(token: string, username: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>({
    token,
    endpoint: `/users/${username}`,
  });
}

