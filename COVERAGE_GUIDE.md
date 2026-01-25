# Test Coverage Guide

## How Test Coverage Works

Test coverage measures which parts of your code are executed when your tests run. It helps identify:

- **Untested code** - Lines/functions that have no test coverage
- **Partially tested code** - Branches (if/else) where only some paths are tested
- **Well-tested code** - Code that's fully exercised by tests

Your project uses **Jest** with **Istanbul** (built into Jest) for coverage reporting.

---

## How to Generate Coverage Reports

### Quick Commands

```bash
# Run tests with coverage report (terminal output only)
npm run coverage

# Alternative: Run tests normally (no coverage)
npm test
```

### What Happens When You Run Coverage

1. **Jest runs all tests** (same as `npm test`)
2. **Instruments your code** - Adds tracking to see which lines execute
3. **Collects execution data** - Records what ran during tests
4. **Generates reports** - Creates multiple report formats in the `coverage/` directory

---

## Understanding the Coverage Output

### Terminal Output

When you run `npm run coverage`, you'll see a table like this:

```
-----------------------------------|---------|----------|---------|---------|-------------------
File                               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------------|---------|----------|---------|---------|-------------------
All files                          |   75.41 |    65.54 |    76.1 |   75.72 |
 src                               |   81.14 |    81.96 |      75 |   80.99 |
  client.ts                        |   81.14 |    81.96 |      75 |   80.99 | 140,210-211,247
 src/errors                        |     100 |     91.3 |     100 |     100 |
  index.ts                         |     100 |     91.3 |     100 |     100 | 312-332
-----------------------------------|---------|----------|---------|---------|-------------------
```

### Coverage Metrics Explained

- **% Stmts (Statements)**: Percentage of code statements that executed
- **% Branch**: Percentage of `if/else`, `switch`, etc. branches tested
- **% Funcs (Functions)**: Percentage of functions that were called
- **% Lines**: Percentage of code lines that executed
- **Uncovered Line #s**: Specific line numbers that weren't tested

### Good Coverage Targets

- **80%+** - Generally considered good coverage
- **90%+** - Excellent coverage
- **100%** - Perfect coverage (not always necessary or practical)

Your current coverage: **75.41% overall** - Pretty good! 🎯

---

## Coverage Report Files

After running `npm run coverage`, you'll find these files in the `coverage/` directory:

```
coverage/
├── lcov-report/         # HTML coverage report (BEST FOR VIEWING)
│   └── index.html       # Open this in a browser!
├── lcov.info            # LCOV format (for CI/CD tools)
├── coverage-final.json  # Raw JSON data
└── clover.xml           # Clover format (for some CI tools)
```

### Viewing the HTML Report

The **easiest way** to explore coverage:

```bash
# Generate coverage
npm run coverage

# Open the HTML report in your browser
open coverage/lcov-report/index.html   # macOS
# or
xdg-open coverage/lcov-report/index.html  # Linux
# or just double-click coverage/lcov-report/index.html in your file explorer
```

The HTML report shows:

- 📊 **Visual coverage** with color-coded files (green = good, red = poor)
- 🔍 **Click on files** to see exactly which lines are covered/uncovered
- 🎨 **Highlighted code** showing covered (green) and uncovered (red) lines
- 📈 **Drill down** by directory to explore specific areas

---

## Working with Coverage in Your Workflow

### During Development

```bash
# While developing, run tests frequently without coverage (faster)
npm test

# When you want to check coverage (slower, more detailed)
npm run coverage
```

### Before Committing

```bash
# Always run coverage before pushing to ensure quality
npm run coverage

# If coverage drops significantly, consider adding tests
```

### In CI/CD Pipeline

Most CI/CD systems can:

- Automatically run `npm run coverage`
- Parse `coverage/lcov.info` or `coverage/clover.xml`
- Fail builds if coverage drops below a threshold
- Display coverage badges in README

---

## Improving Coverage

### Finding What to Test

1. **Run coverage**:

   ```bash
   npm run coverage
   ```

2. **Open the HTML report**:

   ```bash
   open coverage/lcov-report/index.html
   ```

3. **Look for red/yellow files** - These need more tests

4. **Click into a file** - See exact lines that aren't covered

5. **Write tests** for uncovered code

### Example: Improving Coverage for `client.ts`

Current coverage for `client.ts`: **81.14%**
Uncovered lines: `140,210-211,247-250,302,432,459,483-551,588`

To improve:

1. **Open the HTML report** and click on `src/client.ts`
2. **See which lines are red** (uncovered)
3. **Write tests** for those scenarios

For example, if lines 483-551 are bulk verification methods:

```typescript
// Add test in src/__test__/client.test.ts
test('should create bulk job with NeverBounce key', async () => {
  const client = new HappyEmailClient({
    neverBounceApiKey: 'test-key',
  });

  // Test the bulk job creation
  // This will cover lines 483-551
});
```

---

## Configuring Coverage

### Current Jest Config

Your `jest.config.ts` currently has minimal coverage settings. You can enhance it:

```typescript
const jestConfig: JestConfigWithTsJest = {
  verbose: true,
  testMatch: ['<rootDir>/src/**/*.test.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts', // Exclude type definitions
    '!src/**/__test__/**', // Exclude test files
    '!src/**/*.test.ts', // Exclude test files
    '!src/**/*.spec.ts', // Exclude spec files
    '!src/index.ts', // Optionally exclude entry point
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text', // Terminal output
    'text-summary', // Summary in terminal
    'html', // HTML report (lcov-report/)
    'lcov', // LCOV format (for CI/CD)
    'clover', // Clover XML (for some CI tools)
  ],

  // Optional: Enforce minimum coverage thresholds
  coverageThreshold: {
    global: {
      statements: 75,
      branches: 65,
      functions: 75,
      lines: 75,
    },
  },

  // ... rest of config
};
```

### Coverage Thresholds

If you add `coverageThreshold`, Jest will **fail** if coverage drops below those percentages. This is great for maintaining quality!

```bash
# With thresholds set, this will fail if coverage is too low
npm run coverage

# Example output:
# Jest: "global" coverage threshold for statements (75%) not met: 70%
# Error: Process completed with exit code 1.
```

---

## Best Practices

### ✅ DO

- **Run coverage regularly** to catch untested code early
- **View the HTML report** to understand what needs testing
- **Test critical paths first** (error handling, main features)
- **Use coverage to find edge cases** you forgot to test
- **Keep coverage trending upward** over time

### ❌ DON'T

- **Don't aim for 100% coverage everywhere** - Some code isn't worth testing (simple getters, etc.)
- **Don't write tests just for coverage** - Write meaningful tests
- **Don't ignore low coverage** - Investigate why it's low
- **Don't commit untested features** - Add tests first

---

## Quick Reference

### Commands

```bash
# Run tests (fast, no coverage)
npm test

# Run tests with coverage (slower, detailed)
npm run coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Files to Check

```bash
# Terminal output - Quick overview
npm run coverage | tail -50

# HTML report - Detailed exploration
coverage/lcov-report/index.html

# LCOV file - For CI/CD integration
coverage/lcov.info
```

### Coverage Goals

- **75%+** ✅ Good baseline (your current: 75.41%)
- **80%+** ⭐ Better
- **90%+** 🌟 Excellent

---

## Troubleshooting

### "Coverage directory is huge"

The `coverage/` directory can get large. **Never commit it to git**!

Add to `.gitignore`:

```
# Test coverage
coverage/
*.lcov
.nyc_output/
```

### "Coverage is slow"

Coverage adds instrumentation overhead. Use it when needed:

- ✅ Before commits/PRs
- ✅ In CI/CD
- ❌ Not during rapid development cycles

### "Some files show 0% coverage"

Check if:

1. Files are imported/used in your code
2. Files are in the `collectCoverageFrom` pattern
3. Tests actually exercise those files

---

## Example Workflow

Here's a typical development workflow with coverage:

```bash
# 1. Start developing a new feature
npm test --watch  # Run tests in watch mode while coding

# 2. Write your feature + tests
# (make changes to src/client.ts and src/__test__/client.test.ts)

# 3. Check if tests pass
npm test

# 4. Check coverage before committing
npm run coverage

# 5. If coverage dropped, view the HTML report
open coverage/lcov-report/index.html

# 6. Add tests for uncovered lines
# (add more tests)

# 7. Run coverage again
npm run coverage

# 8. Commit when happy with coverage
git add .
git commit -m "Add new feature with tests"
```

---

## Integration with VSCode

### Extensions

Install these VSCode extensions for better experience:

1. **Coverage Gutters** - Shows coverage directly in your editor

   - Shows green/red dots next to lines
   - Live updates as you write tests

2. **Jest** - Run tests from VSCode
   - Run individual tests
   - Debug tests
   - See coverage inline

### Setup Coverage Gutters

1. Install "Coverage Gutters" extension
2. Run `npm run coverage` to generate `coverage/lcov.info`
3. In VSCode, press `Cmd+Shift+P` (or `Ctrl+Shift+P`)
4. Type "Coverage Gutters: Display Coverage"
5. See coverage indicators in your editor! 🎉

---

## Summary

- **Generate coverage**: `npm run coverage`
- **View detailed report**: Open `coverage/lcov-report/index.html` in browser
- **Current coverage**: 75.41% (good baseline!)
- **Re-generate anytime**: Just run `npm run coverage` again
- **Don't commit**: Add `coverage/` to `.gitignore`

**Pro tip**: Open the HTML report after every coverage run to visually see what needs testing. It's the best way to improve coverage systematically! 📊
