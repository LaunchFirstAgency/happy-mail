# Test Coverage - Quick Start 🚀

## TL;DR

```bash
# Generate coverage report
npm run coverage

# View detailed HTML report (BEST WAY!)
open coverage/lcov-report/index.html
```

That's it! The HTML report shows you **exactly** which lines need tests with color-coding.

---

## What Changed

I've set up test coverage for you with:

✅ **Added to `.gitignore`** - Coverage reports won't be committed
✅ **Enhanced `jest.config.ts`** - Better coverage reporting
✅ **Created `COVERAGE_GUIDE.md`** - Full documentation

---

## Quick Commands

```bash
# Run tests normally (fast, no coverage)
npm test

# Run tests with coverage report (slower, more info)
npm run coverage

# View the beautiful HTML report
open coverage/lcov-report/index.html   # macOS
xdg-open coverage/lcov-report/index.html  # Linux
# Windows: Just double-click coverage/lcov-report/index.html
```

---

## Reading the Coverage Report

### Terminal Output

```
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|------------------
All files           |   75.41 |    65.54 |    76.1 |   75.72 |
src/client.ts       |   81.14 |    81.96 |      75 |   80.99 | 140,210-211,247
src/errors/index.ts |     100 |     91.3 |     100 |     100 | 312-332
```

- **% Stmts**: Percentage of code statements tested
- **% Branch**: Percentage of if/else branches tested
- **% Funcs**: Percentage of functions tested
- **% Lines**: Percentage of lines tested
- **Uncovered Lines**: Exact line numbers not tested

### Your Current Coverage: **75.41%** ✅ (Good!)

---

## Improving Coverage

### 1. Find What Needs Testing

```bash
npm run coverage
open coverage/lcov-report/index.html
```

### 2. In the HTML Report:

- 🟢 **Green** = Well tested
- 🟡 **Yellow** = Partially tested
- 🔴 **Red** = Not tested

Click on any file to see **exact lines** that need tests!

### 3. Write Tests

Add tests in `src/**/__test__/*.test.ts` for uncovered code.

### 4. Re-run Coverage

```bash
npm run coverage
```

Watch your coverage percentage increase! 📈

---

## Best Practices

### ✅ DO

- Run `npm run coverage` before committing
- Use the HTML report to find gaps
- Test critical code paths first
- Keep coverage trending upward

### ❌ DON'T

- Don't commit the `coverage/` directory (it's gitignored)
- Don't aim for 100% everywhere (not always practical)
- Don't write tests just for coverage numbers

---

## Pro Tips

### VSCode Integration

Install the **"Coverage Gutters"** extension to see coverage in your editor:

1. Install extension
2. Run `npm run coverage`
3. Press `Cmd+Shift+P` → "Coverage Gutters: Display Coverage"
4. See green/red indicators next to your code! 🎨

### Watch Mode

```bash
# Run tests in watch mode while developing (no coverage)
npm test -- --watch

# When ready, check coverage
npm run coverage
```

### Coverage in CI/CD

Your `coverage/lcov.info` file can be used by:
- **Codecov**
- **Coveralls**
- **SonarQube**
- **GitHub Actions**

---

## Common Questions

### "Where are the coverage files?"

```
coverage/
├── lcov-report/         # 👈 Open index.html in browser!
│   └── index.html
├── lcov.info            # For CI/CD tools
├── coverage-final.json  # Raw data
└── clover.xml           # For some CI tools
```

### "How often should I run coverage?"

- **During development**: Use `npm test` (faster)
- **Before commits**: Use `npm run coverage`
- **In CI/CD**: Always run coverage

### "My coverage is low, what do I do?"

1. Run `npm run coverage`
2. Open `coverage/lcov-report/index.html`
3. Click on files with low coverage
4. Write tests for red/yellow lines
5. Re-run coverage
6. Repeat until satisfied!

### "Coverage reports are taking up space"

The `coverage/` directory is now in `.gitignore`, so it won't be committed. You can safely delete it anytime:

```bash
rm -rf coverage/
```

Just run `npm run coverage` again when you need it!

---

## Example Workflow

```bash
# 1. Make code changes
vim src/client.ts

# 2. Write tests
vim src/__test__/client.test.ts

# 3. Run tests (fast)
npm test

# 4. Check coverage
npm run coverage

# 5. View detailed report
open coverage/lcov-report/index.html

# 6. Add more tests if needed
# (repeat steps 2-5)

# 7. Commit when happy
git add .
git commit -m "Add feature with tests"
```

---

## Next Steps

1. **Try it now**: Run `npm run coverage` and open the HTML report
2. **Read the full guide**: See `COVERAGE_GUIDE.md` for complete documentation
3. **Set coverage goals**: Uncomment `coverageThreshold` in `jest.config.ts` to enforce minimums

---

**Questions?** Check out `COVERAGE_GUIDE.md` for the complete documentation!

Happy testing! 🧪✨
