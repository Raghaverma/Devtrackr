/**
 * Basic usage examples for DevTrackr SDK
 * 
 * Run with: npx tsx examples/basic-usage.ts
 * (Requires GITHUB_TOKEN environment variable)
 */

import { createDevTrackr } from '../src/index';

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const devtrackr = createDevTrackr({ token });

  try {
    // Example 1: Get user profile
    console.log('Fetching profile...');
    const profile = await devtrackr.getProfile('octocat');
    console.log(`Profile: ${profile.name} (@${profile.username})`);
    console.log(`Followers: ${profile.followers}, Following: ${profile.following}`);
    console.log(`Public Repos: ${profile.publicRepos}\n`);

    // Example 2: Get repositories
    console.log('Fetching repositories...');
    const repos = await devtrackr.getRepositories('octocat', {
      sort: 'updated',
      direction: 'desc',
      perPage: 5,
    });
    console.log(`Found ${repos.length} repositories:`);
    repos.forEach((repo) => {
      console.log(`  - ${repo.name}: ${repo.stars} stars, ${repo.forks} forks`);
    });
    console.log();

    // Example 3: Get recent commits
    console.log('Fetching recent commits...');
    const commits = await devtrackr.getRecentCommits('octocat', { perPage: 5 });
    console.log(`Found ${commits.length} recent commits:`);
    commits.slice(0, 3).forEach((commit) => {
      console.log(`  - ${commit.repo}: ${commit.message}`);
      console.log(`    +${commit.additions} -${commit.deletions}`);
    });
    console.log();

    // Example 4: Get language statistics
    console.log('Fetching language statistics...');
    const langStats = await devtrackr.getLanguageStats('octocat');
    console.log(`Total code: ${(langStats.totalBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log('Top languages:');
    langStats.languages.slice(0, 5).forEach((lang) => {
      console.log(`  - ${lang.name}: ${lang.percentage.toFixed(1)}%`);
    });
    console.log();

    // Example 5: Get contribution statistics
    console.log('Fetching contribution statistics...');
    const contribStats = await devtrackr.getContributionStats('octocat');
    console.log(`Total commits: ${contribStats.totalCommits}`);
    console.log(`Active days: ${contribStats.activeDays}`);
    console.log(`Avg commits/week: ${contribStats.avgCommitsPerWeek.toFixed(1)}`);
    console.log(`Longest streak: ${contribStats.longestStreak} days`);
    console.log(`Current streak: ${contribStats.currentStreak} days`);
    console.log();

    // Example 6: Check rate limit
    const rateLimit = devtrackr.getRateLimitInfo();
    if (rateLimit) {
      console.log('Rate limit info:');
      console.log(`  Limit: ${rateLimit.limit}`);
      console.log(`  Remaining: ${rateLimit.remaining}`);
      console.log(`  Resets in: ${Math.ceil(rateLimit.resetIn / 1000)} seconds`);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();



