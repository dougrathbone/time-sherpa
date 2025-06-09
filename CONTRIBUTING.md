# Contributing to TimeSherpa

First off, thank you for considering contributing to TimeSherpa! It's people like you that make TimeSherpa such a great tool for helping executives optimize their time.

## Code of Conduct

By participating in this project, you are expected to uphold our values of being respectful, inclusive, and collaborative.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples**
* **Describe the behavior you observed and expected**
* **Include screenshots if relevant**
* **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Provide specific examples to demonstrate the enhancement**
* **Describe the current behavior and expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code follows the existing code style.
6. Issue that pull request!

## Development Setup

1. Fork and clone the repository
```bash
git clone https://github.com/your-username/time-sherpa.git
cd time-sherpa
```

2. Install dependencies
```bash
cd app
npm install
```

3. Set up your development environment (see README.md for details)

4. Create a feature branch
```bash
git checkout -b feature/amazing-feature
```

## Style Guidelines

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat:` - A new feature
* `fix:` - A bug fix
* `docs:` - Documentation only changes
* `style:` - Changes that don't affect code meaning (white-space, formatting, etc)
* `refactor:` - Code change that neither fixes a bug nor adds a feature
* `perf:` - Code change that improves performance
* `test:` - Adding missing tests or correcting existing tests
* `chore:` - Changes to the build process or auxiliary tools

Examples:
```
feat: add calendar export functionality
fix: resolve OAuth redirect loop
docs: update API documentation
style: format code according to style guide
refactor: simplify calendar analysis logic
perf: optimize large dataset processing
test: add tests for auth service
chore: update dependencies
```

### TypeScript Style Guide

* Use TypeScript for all new code
* Enable strict mode
* Prefer interfaces over type aliases for object shapes
* Use meaningful variable and function names
* Document complex logic with comments
* Avoid `any` type - use `unknown` if type is truly unknown

### React Best Practices

* Use functional components with hooks
* Keep components small and focused
* Use custom hooks for reusable logic
* Implement proper error boundaries
* Memoize expensive computations
* Follow the React naming conventions (PascalCase for components)

### Testing Guidelines

* Write tests for all new features
* Maintain test coverage above 80%
* Use descriptive test names
* Follow AAA pattern (Arrange, Act, Assert)
* Mock external dependencies appropriately

Example test structure:
```typescript
describe('CalendarService', () => {
  describe('analyzeEvents', () => {
    it('should categorize events correctly', () => {
      // Arrange
      const events = [...];
      
      // Act
      const result = analyzeEvents(events);
      
      // Assert
      expect(result.categories).toHaveLength(5);
    });
  });
});
```

## Project Structure

When adding new features, follow the existing project structure:

* `/app/src/client/components/` - Reusable UI components
* `/app/src/client/pages/` - Page-level components
* `/app/src/client/hooks/` - Custom React hooks
* `/app/src/server/routes/` - API endpoints
* `/app/src/server/services/` - Business logic
* `/app/src/server/middleware/` - Express middleware

## Review Process

1. All submissions require review before merging
2. We use GitHub pull request reviews
3. At least one maintainer approval is required
4. CI checks must pass
5. Resolve all review comments

## Recognition

Contributors will be recognized in our README.md file. We appreciate every contribution, no matter how small!

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing to TimeSherpa! 🎉 