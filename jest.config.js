module.exports = {
    verbose: true,
    testMatch: ["<rootDir>/src/**/*.test.ts"],
    transform: {
      "^.+\\.[tj]sx?$": [
        "ts-jest",
        {
          tsconfig: "tsconfig.json",
        },
      ],
    },
  };
  