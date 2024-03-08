import { pathsToModuleNameMapper, type JestConfigWithTsJest } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";
const jestConfig: JestConfigWithTsJest = {
  verbose: true,
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  modulePaths: [compilerOptions.baseUrl],
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
