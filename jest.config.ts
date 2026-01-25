import type { JestConfigWithTsJest } from "ts-jest";

// Define paths configuration manually instead of importing from tsconfig.json
const paths = {
  "@/*": ["./src/*"],
};

const jestConfig: JestConfigWithTsJest = {
  verbose: true,
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  modulePaths: ["."],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",           // Exclude type definitions
    "!src/**/__test__/**",      // Exclude test files
    "!src/**/*.test.ts",        // Exclude test files
    "!src/**/*.spec.ts",        // Exclude spec files
  ],

  coverageDirectory: "coverage",

  coverageReporters: [
    "text",           // Terminal output
    "text-summary",   // Summary in terminal
    "html",           // HTML report (lcov-report/)
    "lcov",           // LCOV format (for CI/CD)
  ],

  // Optional: Set coverage thresholds (currently matching your actual coverage)
  // Uncomment and adjust these to enforce minimum coverage requirements
  // coverageThreshold: {
  //   global: {
  //     statements: 75,
  //     branches: 65,
  //     functions: 75,
  //     lines: 75,
  //   },
  // },
};

export default jestConfig;
