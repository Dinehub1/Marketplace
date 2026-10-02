import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
            </Stack>
        </ErrorBoundary>
    );
}
