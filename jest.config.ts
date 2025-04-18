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
};

export default jestConfig;
