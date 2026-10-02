module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-modules-core)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    testMatch: ['**/__tests__/**/*.test.(ts|tsx|js|jsx)'],
};

