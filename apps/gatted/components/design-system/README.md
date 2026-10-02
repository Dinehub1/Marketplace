# @gated/ui

Shareable React Native UI components for GATED applications.

## Installation

```bash
# If using npm workspaces
npm install @gated/ui

# Or add to package.json dependencies
"@gated/ui": "file:../packages/gated-ui"
```

## Usage

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@gated/ui';

export default function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Import and use components

```tsx
import { 
  Button, 
  PageHeader, 
  StatCard, 
  ActionButton,
  colors 
} from '@gated/ui';

function Dashboard() {
  return (
    <View>
      <PageHeader 
        title="Dashboard"
        greeting="Welcome back" 
      />
      <StatCard
        icon="people-outline"
        iconColor={colors.primary[500]}
        value={42}
        label="Visitors"
        backgroundColor={colors.primary[100]}
      />
      <ActionButton
        icon="add-circle-outline"
        title="New Visitor"
        subtitle="Add a visitor"
        variant="primary"
        onPress={() => {}}
      />
    </View>
  );
}
```

## Components

### Primitives
- `Button` - Multiple variants (primary, secondary, outline, ghost, danger)
- `TextInput` - With label, error, and required indicator
- `LoadingSpinner` - Centered loading indicator

### Layout
- `PageHeader` - Screen header with back button and actions
- `SectionTitle` - Section heading
- `StatRow` - Horizontal container for stat cards
- `ScreenContainer` - Screen wrapper with optional scroll

### Data Display
- `StatCard` - Statistics card with icon
- `Card` - Basic card container
- `EmptyState` - Empty content message
- `ListItem` - Versatile list item

### Actions
- `ActionButton` - Prominent action button with icon
- `FloatingActionButton` - Floating action button

### Feedback
- `ConfirmationModal` - Confirmation dialog

## Theme

### Colors

```tsx
import { colors } from '@gated/ui';

// Primary palette
colors.primary[500]  // #3b82f6

// Semantic colors
colors.success.main  // #10b981
colors.warning.main  // #f59e0b
colors.danger.main   // #ef4444

// Neutrals
colors.gray[800]     // #1e293b
colors.background    // #f8fafc
colors.surface       // #ffffff
```

### Custom Theme

```tsx
import { ThemeProvider } from '@gated/ui';

const customTheme = {
  colors: {
    primary: {
      500: '#7c3aed', // Custom purple
    },
  },
};

<ThemeProvider theme={customTheme}>
  <App />
</ThemeProvider>
```

## Peer Dependencies

- `react` >= 18.0.0
- `react-native` >= 0.70.0
- `@expo/vector-icons` >= 14.0.0

## License

MIT
