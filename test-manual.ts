/**
 * Manual test using published interface
 * This validates the real consumer experience
 * 
 * Usage: npx tsx test-manual.ts
 * 
 * Requires: GITHUB_TOKEN environment variable
 */

import { createDevTrackr, DevTrackrRateLimitError } from './dist/index.js';

async function test() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.error('Error: GITHUB_TOKEN environment variable not set');
    console.error('Set it with: $env:GITHUB_TOKEN="your-token" (PowerShell)');
    process.exit(1);
  }

  const devtrackr = createDevTrackr({ token });

  try {
    console.log('Testing DevTrackr SDK...\n');

    // Test profile
    console.log('1. Testing getProfile...');
    const profile = await devtrackr.getProfile('octocat');
    console.log('✅ Profile:', {
      username: profile.username,
      name: profile.name,
      followers: profile.followers,
      publicRepos: profile.publicRepos,
    });

    // Test repositories
    console.log('\n2. Testing getRepositories...');
    const repos = await devtrackr.getRepositories('octocat', { perPage: 3 });
    console.log(`✅ Repositories (${repos.length}):`, repos.map(r => r.name));

    // Test commits
    console.log('\n3. Testing getRecentCommits...');
    const commits = await devtrackr.getRecentCommits('octocat', { perPage: 3 });
    console.log(`✅ Commits (${commits.length}):`, commits.map(c => ({
      repo: c.repo,
      message: c.message.substring(0, 50),
    })));

    // Test language stats
    console.log('\n4. Testing getLanguageStats...');
    const languages = await devtrackr.getLanguageStats('octocat');
    console.log(`✅ Languages (${languages.languages.length}):`, 
      languages.languages.slice(0, 5).map(l => `${l.name}: ${l.percentage.toFixed(1)}%`));

    // Test contribution stats
    console.log('\n5. Testing getContributionStats...');
    const contributions = await devtrackr.getContributionStats('octocat');
    console.log('✅ Contribution Stats:', {
      totalCommits: contributions.totalCommits,
      activeDays: contributions.activeDays,
      avgCommitsPerWeek: contributions.avgCommitsPerWeek,
      longestStreak: contributions.longestStreak,
      currentStreak: contributions.currentStreak,
    });

    // Test activity timeline
    console.log('\n6. Testing getActivityTimeline...');
    const timeline = await devtrackr.getActivityTimeline('octocat', { days: 30 });
    const recentActivity = timeline
      .filter(item => item.commits > 0)
      .slice(-5);
    console.log(`✅ Activity Timeline (last 5 active days):`, recentActivity);

    console.log('\n✅ All tests passed!');
  } catch (error) {
    if (error instanceof DevTrackrRateLimitError) {
      console.error('❌ Rate limit exceeded:');
      console.error(`   Limit: ${error.limit}`);
      console.error(`   Remaining: ${error.remaining}`);
      console.error(`   Resets at: ${error.resetAt.toISOString()}`);
    } else {
      console.error('❌ Error:', error);
    }
    process.exit(1);
  }
}

test();

