/**
 * Normalize activity data to ActivityTimeline and ContributionStats schemas
 */

import {
  ActivityTimeline,
  ActivityTimelineItem,
  ContributionStats,
  RecentCommit,
} from '../types';

/**
 * Calculate contribution statistics from commits
 */
export function calculateContributionStats(
  commits: RecentCommit[]
): ContributionStats {
  if (commits.length === 0) {
    return {
      totalCommits: 0,
      activeDays: 0,
      avgCommitsPerWeek: 0,
      longestStreak: 0,
      currentStreak: 0,
    };
  }

  // Group commits by date
  const commitsByDate = new Map<string, number>();
  for (const commit of commits) {
    const date = new Date(commit.committedAt).toISOString().split('T')[0];
    commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1);
  }

  const activeDays = commitsByDate.size;
  const totalCommits = commits.length;

  // Calculate average commits per week
  const dates = Array.from(commitsByDate.keys()).sort();
  if (dates.length === 0) {
    return {
      totalCommits: 0,
      activeDays: 0,
      avgCommitsPerWeek: 0,
      longestStreak: 0,
      currentStreak: 0,
    };
  }

  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, daysDiff / 7);
  const avgCommitsPerWeek = Math.round((totalCommits / weeks) * 100) / 100;

  // Calculate streaks
  const sortedDates = dates.sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const daysBetween = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysBetween === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (from today backwards)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDate = new Date(today);
  let streakCount = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (commitsByDate.has(dateStr)) {
      streakCount++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  currentStreak = streakCount;

  return {
    totalCommits,
    activeDays,
    avgCommitsPerWeek,
    longestStreak,
    currentStreak,
  };
}

/**
 * Create activity timeline from commits
 */
export function createActivityTimeline(
  commits: RecentCommit[],
  days: number = 365
): ActivityTimeline {
  // Get date range
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Filter commits within date range
  const filteredCommits = commits.filter((commit) => {
    const commitDate = new Date(commit.committedAt);
    return commitDate >= startDate && commitDate <= endDate;
  });

  // Group commits by date
  const commitsByDate = new Map<string, number>();
  for (const commit of filteredCommits) {
    const date = new Date(commit.committedAt).toISOString().split('T')[0];
    commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1);
  }

  // Create timeline array for all dates in range
  const timeline: ActivityTimelineItem[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    timeline.push({
      date: dateStr,
      commits: commitsByDate.get(dateStr) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return timeline;
}

