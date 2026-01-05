# Contributing to DevTrackr

Thank you for your interest in contributing to DevTrackr! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/Raghaverma/Devtrackrnpm.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format

# Build
npm run build
```

## Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format` to format code
- Follow TypeScript best practices
- Write self-documenting code with clear variable names

## Testing

- Write tests for all new features
- Ensure all tests pass: `npm test`
- Aim for high test coverage
- Use descriptive test names

### Test Structure

- Unit tests: `tests/unit/` - Test individual functions and modules
- Integration tests: `tests/integration/` - Test API interactions (mocked)

## Pull Request Process

1. Update the README.md if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update documentation
5. Create a pull request with a clear description

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] TypeScript types are correct
- [ ] No linting errors
- [ ] All tests pass

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add rate limit retry logic
fix: handle empty username validation
docs: update README with examples
test: add unit tests for error handling
```

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when reporting bugs. Include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Code example (if applicable)

## Feature Requests

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) for new features. Include:

- Problem statement
- Proposed solution
- Use cases
- Alternatives considered

## Questions?

Open an issue or start a discussion. We're happy to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

