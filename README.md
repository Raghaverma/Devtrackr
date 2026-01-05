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

## Authentication

DevTrackr requires a GitHub Personal Access Token (PAT) to authenticate with the GitHub API.

### Creating a GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "DevTrackr SDK")
4. Select the following scopes:
   - `public_repo` - Access public repositories
   - `read:user` - Read user profile information
   - `read:org` - Read org and team membership (if needed)
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again)

### Token Security

⚠️ **Never commit tokens to version control!** Use environment variables:

```typescript
import { createDevTrackr } from 'devtrackr';

const devtrackr = createDevTrackr({
  token: process.env.GITHUB_TOKEN! // Load from environment
});
```

### Rate Limits

GitHub API has rate limits:
- **Authenticated requests**: 5,000 requests/hour
- **Unauthenticated requests**: 60 requests/hour

DevTrackr automatically tracks rate limit headers and throws `DevTrackrRateLimitError` when limits are exceeded.

## Error Handling

DevTrackr throws typed errors that extend `DevTrackrError`:

### Error Types

#### `DevTrackrAuthError`
Thrown when authentication fails (401) or access is forbidden (403 without rate limit).

```typescript
import { DevTrackrAuthError } from 'devtrackr';

try {
  await devtrackr.getProfile('username');
} catch (error) {
  if (error instanceof DevTrackrAuthError) {
    console.error('Authentication failed:', error.message);
    // Check your token is valid and has correct permissions
  }
}
```

**Common causes:**
- Invalid or expired token
- Token missing required scopes
- Token revoked

#### `DevTrackrRateLimitError`
Thrown when GitHub API rate limit is exceeded (403 with rate limit headers).

```typescript
import { DevTrackrRateLimitError } from 'devtrackr';

try {
  await devtrackr.getProfile('username');
} catch (error) {
  if (error instanceof DevTrackrRateLimitError) {
    console.error('Rate limit exceeded');
    console.log(`Limit: ${error.limit}`);
    console.log(`Remaining: ${error.remaining}`);
    console.log(`Resets at: ${error.resetAt.toISOString()}`);
    
    // Calculate wait time
    const waitMs = error.resetAt.getTime() - Date.now();
    console.log(`Wait ${Math.ceil(waitMs / 1000)} seconds`);
  }
}
```

**Properties:**
- `limit: number` - Total rate limit
- `remaining: number` - Remaining requests (0 when error thrown)
- `resetAt: Date` - When the rate limit resets

#### `DevTrackrNetworkError`
Thrown for network failures, API errors (5xx), or other HTTP errors.

```typescript
import { DevTrackrNetworkError } from 'devtrackr';

try {
  await devtrackr.getProfile('username');
} catch (error) {
  if (error instanceof DevTrackrNetworkError) {
    console.error('Network error:', error.message);
    // Retry logic or fallback behavior
  }
}
```

**Common causes:**
- Network connectivity issues
- GitHub API downtime (5xx errors)
- Invalid endpoint or malformed request

### Error Handling Best Practices

```typescript
import {
  DevTrackrError,
  DevTrackrAuthError,
  DevTrackrRateLimitError,
  DevTrackrNetworkError,
} from 'devtrackr';

async function fetchUserData(username: string) {
  try {
    const profile = await devtrackr.getProfile(username);
    return profile;
  } catch (error) {
    if (error instanceof DevTrackrRateLimitError) {
      // Implement exponential backoff or wait until reset
      const waitTime = error.resetAt.getTime() - Date.now();
      console.warn(`Rate limited. Waiting ${waitTime}ms`);
      // Consider implementing retry logic here
      throw error;
    } else if (error instanceof DevTrackrAuthError) {
      // Token issue - don't retry
      console.error('Authentication failed. Check your token.');
      throw error;
    } else if (error instanceof DevTrackrNetworkError) {
      // Network issue - might be retryable
      console.error('Network error:', error.message);
      throw error;
    } else {
      // Unknown error
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}
```

## Examples

### Basic Usage

```typescript
import { createDevTrackr } from 'devtrackr';

const devtrackr = createDevTrackr({
  token: process.env.GITHUB_TOKEN!
});

// Fetch user profile
const profile = await devtrackr.getProfile('octocat');
console.log(`${profile.name} has ${profile.followers} followers`);
```

### Fetching Repositories with Pagination

```typescript
// Get first page of repositories
const repos = await devtrackr.getRepositories('octocat', {
  sort: 'updated',
  direction: 'desc',
  perPage: 30,
  page: 1
});

// Get most starred repositories
const starred = await devtrackr.getRepositories('octocat', {
  sort: 'created',
  direction: 'desc',
  perPage: 10
});
```

### Working with Commits

```typescript
// Get recent commits from last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const commits = await devtrackr.getRecentCommits('octocat', {
  perPage: 50,
  since: thirtyDaysAgo.toISOString()
});

// Calculate total changes
const totalAdditions = commits.reduce((sum, commit) => sum + commit.additions, 0);
const totalDeletions = commits.reduce((sum, commit) => sum + commit.deletions, 0);
console.log(`Total: +${totalAdditions} -${totalDeletions}`);
```

### Language Statistics

```typescript
const stats = await devtrackr.getLanguageStats('octocat');

console.log(`Total code: ${stats.totalBytes} bytes`);
stats.languages.forEach(lang => {
  console.log(`${lang.name}: ${lang.percentage.toFixed(1)}% (${lang.color})`);
});
```

### Contribution Analytics

```typescript
const contributionStats = await devtrackr.getContributionStats('octocat');

console.log(`Total commits: ${contributionStats.totalCommits}`);
console.log(`Active days: ${contributionStats.activeDays}`);
console.log(`Avg commits/week: ${contributionStats.avgCommitsPerWeek.toFixed(1)}`);
console.log(`Longest streak: ${contributionStats.longestStreak} days`);
console.log(`Current streak: ${contributionStats.currentStreak} days`);
```

### Activity Timeline Visualization

```typescript
const timeline = await devtrackr.getActivityTimeline('octocat', { days: 90 });

// Group by week for visualization
const weeklyData = [];
for (let i = 0; i < timeline.length; i += 7) {
  const week = timeline.slice(i, i + 7);
  const weekCommits = week.reduce((sum, day) => sum + day.commits, 0);
  weeklyData.push({
    week: week[0].date,
    commits: weekCommits
  });
}
```

## Requirements

- **Node.js**: 18.0.0 or higher
- **GitHub Personal Access Token**: Required for all API calls
  - Minimum scopes: `public_repo`, `read:user`
  - Classic token or fine-grained token with repository read access

## TypeScript Support

DevTrackr is written in TypeScript and includes full type definitions. All types are exported for your convenience:

```typescript
import type {
  Profile,
  Repository,
  RecentCommit,
  LanguageStats,
  ContributionStats,
  ActivityTimeline,
  DevTrackrInstance,
  DevTrackrConfig,
} from 'devtrackr';
```

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © DevTrackr Contributors

