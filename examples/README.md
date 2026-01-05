# DevTrackr Examples

This directory contains example code demonstrating how to use the DevTrackr SDK.

## Prerequisites

1. Set the `GITHUB_TOKEN` environment variable:
   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Examples

### Basic Usage
```bash
npx tsx examples/basic-usage.ts
```

Demonstrates:
- Fetching user profiles
- Getting repositories
- Retrieving commits
- Language statistics
- Contribution analytics
- Rate limit monitoring

### Error Handling
```bash
npx tsx examples/error-handling.ts
```

Shows how to:
- Handle validation errors
- Catch authentication errors
- Deal with rate limits
- Implement retry logic
- Comprehensive error handling patterns

### Rate Limit Monitoring
```bash
npx tsx examples/rate-limit-monitoring.ts
```

Demonstrates:
- Checking rate limit status
- Monitoring remaining requests
- Implementing wait logic
- Batch processing with rate limit awareness

## Example: Building a Developer Dashboard

```typescript
import { createDevTrackr } from 'devtrackr';

const devtrackr = createDevTrackr({
  token: process.env.GITHUB_TOKEN!
});

async function buildDashboard(username: string) {
  const [profile, repos, commits, langStats, contribStats] = await Promise.all([
    devtrackr.getProfile(username),
    devtrackr.getRepositories(username, { perPage: 10 }),
    devtrackr.getRecentCommits(username, { perPage: 20 }),
    devtrackr.getLanguageStats(username),
    devtrackr.getContributionStats(username),
  ]);

  return {
    profile,
    topRepos: repos.slice(0, 5),
    recentActivity: commits.slice(0, 10),
    languages: langStats.languages.slice(0, 5),
    contributions: contribStats,
  };
}
```

## Example: Rate Limit Aware Batch Processing

```typescript
async function processUsers(usernames: string[]) {
  const results = [];
  
  for (const username of usernames) {
    const rateLimit = devtrackr.getRateLimitInfo();
    
    // Wait if rate limit is low
    if (rateLimit && rateLimit.remaining < 50) {
      const waitTime = rateLimit.resetIn;
      console.log(`Waiting ${waitTime}ms for rate limit reset...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    try {
      const profile = await devtrackr.getProfile(username);
      results.push(profile);
    } catch (error) {
      if (error instanceof DevTrackrRateLimitError) {
        console.error('Rate limit exceeded. Stopping batch.');
        break;
      }
      console.error(`Error fetching ${username}:`, error);
    }
  }
  
  return results;
}
```



