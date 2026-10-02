import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeDisplayProps {
    value: string;
    size?: number;
    title?: string;
    subtitle?: string;
}

export function QRCodeDisplay({
    value,
    size = 200,
    title = 'Visitor QR Code',
    subtitle = 'Show this to the guard at entry'
}: QRCodeDisplayProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.qrContainer}>
                <QRCode
                    value={value}
                    size={size}
                    backgroundColor="white"
                    color="#1e293b"
                />
            </View>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 16,
    },
    qrContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 16,
        textAlign: 'center',
    },
});
