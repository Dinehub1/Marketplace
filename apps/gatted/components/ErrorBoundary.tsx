import { Ionicons } from '@expo/vector-icons';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    children: ReactNode;
    fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error to console in development
        if (__DEV__) {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // In production, you would log to an error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });

        this.setState({
            error,
            errorInfo,
        });
    }

    resetError = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback(this.state.error!, this.resetError);
            }

            // Default error UI
            return (
                <View style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="warning" size={64} color="#ef4444" />
                        <Text style={styles.title}>Oops! Something went wrong</Text>
                        <Text style={styles.message}>
                            We encountered an unexpected error. Please try again.
                        </Text>

                        {__DEV__ && this.state.error && (
                            <ScrollView style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details:</Text>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                                {this.state.errorInfo && (
                                    <>
                                        <Text style={styles.errorTitle}>Component Stack:</Text>
                                        <Text style={styles.errorText}>
                                            {this.state.errorInfo.componentStack}
                                        </Text>
                                    </>
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.button} onPress={this.resetError}>
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        maxWidth: 400,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorDetails: {
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        padding: 16,
        marginTop: 20,
        maxHeight: 300,
        width: '100%',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#991b1b',
        marginBottom: 8,
        marginTop: 12,
    },
    errorText: {
        fontSize: 12,
        color: '#dc2626',
        fontFamily: 'monospace',
    },
});
