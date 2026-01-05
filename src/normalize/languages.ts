/**
 * Normalize GitHub language statistics to LanguageStats schema
 * Calculates percentages and assigns colors
 */

import { LanguageStats, LanguageStat, GitHubLanguageStats } from '../types';
import { getLanguageColor } from '../colors';

export function normalizeLanguageStats(
  githubLanguageStats: GitHubLanguageStats
): LanguageStats {
  // Calculate total bytes
  const totalBytes = Object.values(githubLanguageStats).reduce(
    (sum, bytes) => sum + bytes,
    0
  );

  if (totalBytes === 0) {
    return {
      totalBytes: 0,
      languages: [],
    };
  }

  // Convert to array and calculate percentages
  const languageEntries = Object.entries(githubLanguageStats)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: (bytes / totalBytes) * 100,
    }))
    .sort((a, b) => b.bytes - a.bytes); // Sort by bytes descending

  // Normalize percentages to ensure they sum to 100 (handle rounding)
  const languages: LanguageStat[] = languageEntries.map((entry) => ({
    name: entry.name,
    percentage: Math.round(entry.percentage * 100) / 100, // Round to 2 decimal places
    color: getLanguageColor(entry.name),
  }));

  // Ensure percentages sum to 100 (adjust the largest if needed)
  const totalPercentage = languages.reduce((sum, lang) => sum + lang.percentage, 0);
  if (languages.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
    const diff = 100 - totalPercentage;
    languages[0].percentage = Math.round((languages[0].percentage + diff) * 100) / 100;
  }

  return {
    totalBytes,
    languages,
  };
}

