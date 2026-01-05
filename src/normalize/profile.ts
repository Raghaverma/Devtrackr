/**
 * Normalize GitHub user data to Profile schema
 */

import { Profile, GitHubUser } from '../types';

export function normalizeProfile(githubUser: GitHubUser): Profile {
  return {
    username: githubUser.login,
    name: githubUser.name,
    avatarUrl: githubUser.avatar_url,
    bio: githubUser.bio,
    followers: githubUser.followers,
    following: githubUser.following,
    publicRepos: githubUser.public_repos,
    profileUrl: githubUser.html_url,
  };
}

