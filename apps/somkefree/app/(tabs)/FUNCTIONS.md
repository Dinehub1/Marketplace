# Application Functions Documentation

This document outlines the main functions within the application's tab screens.

## Dashboard Screen (`dashboard.tsx`)

- **`DashboardScreen()`**: The main functional component for the Dashboard tab. It manages state for user progress (time quit, money saved, health improvement, etc.), cigarette count, and quit date. It loads and saves progress data and cigarette count using AsyncStorage. It calculates elapsed time and health metrics based on the quit date and updates them every minute.
- **`loadProgressData()`**: An asynchronous function within `useEffect` that loads saved progress data, cigarette count, and quit date from AsyncStorage when the component mounts. It initializes data if none is found.
- **`handleRecordCigarette()`**: An asynchronous function triggered by the "Record Cigarette Smoked" button. It increments the cigarette count, updates related progress metrics (packs not smoked, money saved), saves the updated data to AsyncStorage, and sets the initial quit date if it's the first cigarette recorded and no quit date exists.

## Challenges Screen (`challenges.tsx`)

- **`ChallengesScreen()`**: The main functional component for the Challenges tab. It displays a list of challenges with unlock conditions based on user progress. It loads user progress data from AsyncStorage to determine which challenges are unlocked and calculates the number of unlocked challenges.
- **`loadProgressData()`**: An asynchronous function within `useEffect` that loads saved progress data from AsyncStorage when the component mounts.
- **`renderChallengeCard()`**: A function used by `FlatList` to render each individual challenge item, displaying its icon, level, description, and visual status (locked/unlocked) based on the unlock condition.

## Health Screen (`health.tsx`)

- **`HealthScreen()`**: The main functional component for the Health tab. It displays health benefits achieved based on the user's `healthImprovement` progress. It loads user progress data from AsyncStorage.
- **`loadProgressData()`**: An asynchronous function within `useEffect` that loads saved progress data from AsyncStorage when the component mounts.
- **`ProgressRing()`**: A helper component that uses `react-native-svg` to render a circular progress indicator for each health benefit, showing the percentage of completion.

## Accomplishment Screen (`accomplishment.tsx`)

- **`AccomplishmentScreen()`**: The main functional component for the Accomplishment tab. It displays a dynamic certificate of achievement based on the user's progress and quit date. It loads user progress data and the quit date from AsyncStorage.
- **`loadProgressData()`**: An asynchronous function within `useEffect` that loads saved progress data and the quit date from AsyncStorage when the component mounts.
- **`handleShare()`**: A placeholder function for sharing the certificate (implementation pending).
- **`handleDownload()`**: A placeholder function for downloading the certificate (implementation pending).