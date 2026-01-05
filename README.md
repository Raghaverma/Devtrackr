# DevTrackr SDK

Production-grade npm package for fetching and normalizing GitHub developer data.

## Installation

```bash
npm install devtrackr
```

## Usage

```typescript
import { createDevTrackr } from 'devtrackr';

const devtrackr = createDevTrackr({
  token: 'your-github-personal-access-token'
});

// Get user profile
const profile = await devtrackr.getProfile('octocat');

// Get repositories
const repos = await devtrackr.getRepositories('octocat', {
  sort: 'updated',
  direction: 'desc',
  perPage: 10
});

// Get recent commits
const commits = await devtrackr.getRecentCommits('octocat', {
  perPage: 30
});

// Get language statistics
const languageStats = await devtrackr.getLanguageStats('octocat');

// Get contribution statistics
const contributionStats = await devtrackr.getContributionStats('octocat');

// Get activity timeline
const timeline = await devtrackr.getActivityTimeline('octocat', {
  days: 365
});
```

## API

### `createDevTrackr(config)`

Creates a DevTrackr instance.

**Parameters:**
- `config.token` (string, required): GitHub Personal Access Token

**Returns:** `DevTrackrInstance`

### Methods

All methods are async and return normalized data ready for UI rendering.

#### `getProfile(username)`

Returns normalized profile data.

**Returns:** `Profile`

#### `getRepositories(username, options?)`

Returns array of normalized repositories.

**Options:**
- `sort?: 'created' | 'updated' | 'pushed' | 'full_name'`
- `direction?: 'asc' | 'desc'`
- `perPage?: number`
- `page?: number`

**Returns:** `Repository[]`

#### `getRecentCommits(username, options?)`

Returns array of recent commits.

**Options:**
- `perPage?: number`
- `page?: number`
- `since?: string` (ISO 8601 date)
- `until?: string` (ISO 8601 date)

**Returns:** `RecentCommit[]`

#### `getLanguageStats(username)`

Returns language statistics with percentages and colors.

**Returns:** `LanguageStats`

#### `getContributionStats(username)`

Returns contribution statistics (commits, streaks, etc.).

**Returns:** `ContributionStats`

#### `getActivityTimeline(username, options?)`

Returns activity timeline with daily commit counts.

**Options:**
- `days?: number` (default: 365)

**Returns:** `ActivityTimeline`

## Error Handling

DevTrackr throws typed errors:

- `DevTrackrAuthError`: Invalid or expired token (401)
- `DevTrackrRateLimitError`: Rate limit exceeded (403)
  - Exposes `limit`, `remaining`, and `resetAt` properties
- `DevTrackrNetworkError`: Network or API errors

```typescript
import { DevTrackrRateLimitError } from 'devtrackr';

try {
  const profile = await devtrackr.getProfile('octocat');
} catch (error) {
  if (error instanceof DevTrackrRateLimitError) {
    console.log(`Rate limit resets at: ${error.resetAt}`);
  }
}
```

## Data Schemas

All data is normalized to UI-ready schemas. See TypeScript types for full definitions.

### Profile
```typescript
{
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  profileUrl: string;
}
```

### Repository
```typescript
{
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  primaryLanguage: string | null;
  updatedAt: string;
  repoUrl: string;
}
```

### RecentCommit
```typescript
{
  repo: string;
  message: string;
  additions: number;
  deletions: number;
  committedAt: string;
  commitUrl: string;
}
```

### LanguageStats
```typescript
{
  totalBytes: number;
  languages: {
    name: string;
    percentage: number; // 0-100
    color: string; // Hex color
  }[];
}
```

### ContributionStats
```typescript
{
  totalCommits: number;
  activeDays: number;
  avgCommitsPerWeek: number;
  longestStreak: number;
  currentStreak: number;
}
```

### ActivityTimeline
```typescript
{
  date: string; // YYYY-MM-DD
  commits: number;
}[]
```

## Requirements

- Node.js 18+
- GitHub Personal Access Token with appropriate permissions

## License

MIT

