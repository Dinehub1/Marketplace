import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';

export default function ManagerLayout() {
    return (
        <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
            </Stack>
        </ErrorBoundary>
    );
}
