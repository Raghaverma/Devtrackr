/**
 * Rate limit monitoring example
 * Shows how to track and manage GitHub API rate limits
 */

import { createDevTrackr } from '../src/index';
import { DevTrackrRateLimitError } from '../src/index';

async function monitorRateLimits() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const devtrackr = createDevTrackr({ token });

  // Function to check rate limit status
  function checkRateLimit() {
    const info = devtrackr.getRateLimitInfo();
    if (info) {
      const percentage = (info.remaining / info.limit) * 100;
      console.log(`Rate Limit: ${info.remaining}/${info.limit} (${percentage.toFixed(1)}%)`);
      
      if (percentage < 10) {
        console.warn('Warning: Rate limit is low!');
      }
      
      if (info.resetIn > 0) {
        const minutes = Math.ceil(info.resetIn / 1000 / 60);
        console.log(`Resets in: ${minutes} minutes`);
      }
    } else {
      console.log('No rate limit info available yet');
    }
  }

  // Make a request to populate rate limit info
  try {
    await devtrackr.getProfile('octocat');
    checkRateLimit();
  } catch (error) {
    if (error instanceof DevTrackrRateLimitError) {
      console.error('Rate limit exceeded!');
      console.log(`Wait until: ${error.resetAt.toISOString()}`);
      console.log(`Wait time: ${Math.ceil(error.retryInfo.retryAfter! / 1000)} seconds`);
    } else {
      throw error;
    }
  }

  // Example: Batch requests with rate limit checking
  const usernames = ['octocat', 'torvalds', 'gaearon'];
  
  for (const username of usernames) {
    const info = devtrackr.getRateLimitInfo();
    
    if (info && info.remaining < 10) {
      console.warn(`Rate limit low (${info.remaining} remaining). Waiting...`);
      const waitTime = info.resetIn;
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    try {
      const profile = await devtrackr.getProfile(username);
      console.log(`Fetched: ${profile.username}`);
      checkRateLimit();
    } catch (error) {
      if (error instanceof DevTrackrRateLimitError) {
        console.error('Rate limit hit. Stopping batch.');
        break;
      }
      throw error;
    }
  }
}

// monitorRateLimits();

