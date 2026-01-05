/**
 * Core types for DevTrackr SDK
 * All types match the exact specification
 */

export interface Profile {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  profileUrl: string;
}

export interface Repository {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  updatedAt: string;
  repoUrl: string;
}

export interface RecentCommit {
  repo: string;
  message: string;
  additions: number;
  deletions: number;
  committedAt: string;
  commitUrl: string;
}

export interface LanguageStat {
  name: string;
  percentage: number; // 0-100
  color: string;
}

export interface LanguageStats {
  totalBytes: number;
  languages: LanguageStat[];
}

export interface ContributionStats {
  totalCommits: number;
  activeDays: number;
  avgCommitsPerWeek: number;
  longestStreak: number;
  currentStreak: number;
}

export interface ActivityTimelineItem {
  date: string;
  commits: number;
}

export type ActivityTimeline = ActivityTimelineItem[];

export interface RepositoryOptions {
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  perPage?: number;
  page?: number;
}

export interface CommitOptions {
  perPage?: number;
  page?: number;
  since?: string;
  until?: string;
}

export interface ActivityTimelineOptions {
  days?: number;
}

export interface DevTrackrConfig {
  token: string;
}

export interface DevTrackrInstance {
  getProfile(username: string): Promise<Profile>;
  getRepositories(username: string, options?: RepositoryOptions): Promise<Repository[]>;
  getRecentCommits(username: string, options?: CommitOptions): Promise<RecentCommit[]>;
  getLanguageStats(username: string): Promise<LanguageStats>;
  getContributionStats(username: string): Promise<ContributionStats>;
  getActivityTimeline(username: string, options?: ActivityTimelineOptions): Promise<ActivityTimeline>;
}

// Internal GitHub API response types
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  html_url: string;
}

export interface GitHubRepository {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
  };
  html_url: string;
  repository: {
    name: string;
  };
}

export interface GitHubLanguageStats {
  [language: string]: number;
}

export interface GitHubContributionDay {
  date: string;
  contributionCount: number;
}

export interface GitHubContributions {
  totalContributions: number;
  weeks: Array<{
    contributionDays: GitHubContributionDay[];
  }>;
}

