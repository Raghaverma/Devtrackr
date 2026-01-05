# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of DevTrackr SDK
- GitHub API integration for fetching developer data
- Normalized data schemas for profiles, repositories, commits, languages, and contributions
- Comprehensive error handling with typed errors
- Rate limit tracking and information
- TypeScript type definitions
- Unit and integration tests
- ESLint and Prettier configuration
- GitHub Actions CI workflow
- Dependabot configuration
- Comprehensive documentation and examples

### Features
- `getProfile()` - Fetch user profile information
- `getRepositories()` - Get user repositories with sorting and pagination
- `getRecentCommits()` - Retrieve recent commits across repositories
- `getLanguageStats()` - Calculate language usage statistics
- `getContributionStats()` - Analyze contribution patterns and streaks
- `getActivityTimeline()` - Generate activity timeline with daily commit counts
- `getRateLimitInfo()` - Check current GitHub API rate limit status

### Error Handling
- `DevTrackrAuthError` - Authentication failures
- `DevTrackrRateLimitError` - Rate limit exceeded with reset information
- `DevTrackrNetworkError` - Network and API errors
- `DevTrackrValidationError` - Input validation errors
- Error codes and retry guidance for all error types

### Documentation
- Comprehensive README with examples
- API documentation
- Error handling guide
- Authentication requirements
- Usage examples

[1.0.0]: https://github.com/Raghaverma/Devtrackrnpm/releases/tag/v1.0.0

