# SmokeFree App - Function Documentation

This document outlines the functions used within the SmokeFree application, categorized by their respective files.

## app/(tabs)/_layout.tsx

- `TabLayout()`: Configures and renders the tab navigation for the application, including icons and screen options for Dashboard, Health, Challenges, and Accomplishment tabs.

## app/(tabs)/accomplishment.tsx

- `AccomplishmentScreen()`: Renders the accomplishment screen, displaying a certificate of achievement. It handles dynamic theming, safe area insets, and includes placeholders for user data and images. Provides functionality for sharing and downloading the certificate.
  - `handleShare()`: Placeholder function to log a share action.
  - `handleDownload()`: Placeholder function to log a download action.

## app/(tabs)/challenges.tsx

- `ChallengesScreen()`: Renders the challenges screen, displaying a list of challenges with their status (locked/unlocked). It uses a `FlatList` for efficient rendering and supports dynamic theming and safe area insets.
  - `renderChallengeCard({ item })`: Renders individual challenge cards with an icon, level, and description.

## app/(tabs)/dashboard.tsx

- `DashboardScreen()`: Renders the main dashboard screen. It displays user progress (time without smoking, money saved, etc.), daily challenges, health improvement, and a feature to record cigarettes smoked. Uses `AsyncStorage` to persist the cigarette count and supports dynamic theming and safe area insets.
  - `loadCigaretteCount()`: Asynchronously loads the cigarette count from `AsyncStorage` when the component mounts.
  - `handleRecordCigarette()`: Increments the cigarette count, updates the state, and saves the new count to `AsyncStorage`.

## app/(tabs)/health.tsx

- `HealthScreen()`: Renders the health benefits screen. It displays a list of health improvements achieved over time, using a `ProgressRing` component to visualize progress for each benefit. Supports dynamic theming and safe area insets.
- `ProgressRing({ percentage, size, strokeWidth, color })`: A helper component that renders a circular progress indicator using `react-native-svg`.

## app/+not-found.tsx

- `NotFoundScreen()`: Renders a screen to be displayed when a route is not found. Provides a link to navigate back to the home screen.

## app/_layout.tsx

- `RootLayout()`: The main layout component for the application. It sets up the `SafeAreaProvider`, `ThemeProvider` for light/dark mode, loads custom fonts, and defines the root navigation stack (tabs and not-found screen).

## app/index.tsx

- `Index()`: The initial entry point of the app, which redirects the user to the dashboard screen.

## components/Collapsible.tsx

- `Collapsible({ children, title })`: A reusable component that creates a collapsible section with a title. Tapping the title toggles the visibility of its children content.

## components/ExternalLink.tsx

- `ExternalLink({ href, ...rest })`: A component that renders a hyperlink. On native platforms (iOS/Android), it opens the link in an in-app browser. On the web, it behaves like a standard anchor tag.

## components/HapticTab.tsx

- `HapticTab(props)`: A custom tab bar button component that provides haptic feedback (light impact) when pressed on iOS devices.

## components/HelloWave.tsx

- `HelloWave()`: A component that displays a waving hand emoji with a simple animation. The animation runs a few times when the component mounts.

## components/ThemedText.tsx

- `ThemedText({ style, lightColor, darkColor, type, ...rest })`: A custom `Text` component that automatically adapts its color based on the current theme (light/dark). It also supports predefined text styles (e.g., title, subtitle, link).

## components/ThemedView.tsx

- `ThemedView({ style, lightColor, darkColor, ...otherProps })`: A custom `View` component that automatically adapts its background color based on the current theme (light/dark).

## components/ui/IconSymbol.tsx

- `IconSymbol({ name, size, color, style, weight })`: A component that displays an icon. It uses SF Symbols on iOS and falls back to Material Icons on Android and web, providing a consistent visual experience across platforms. Requires manual mapping between SF Symbol names and Material Icon names.

## components/ui/TabBarBackground.tsx

- `useBottomTabOverflow()`: A hook (currently a shim) that would typically return the overflow value for the bottom tab bar, useful for custom tab bar designs. Returns 0 in its current implementation.