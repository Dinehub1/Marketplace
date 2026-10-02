import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumColors } from '../constants/Colors';

interface ReservationTimerProps {
  expiresAt: string | Date; // ISO string or Date object
  onExpire?: () => void;
  compact?: boolean;
}

export const ReservationTimer: React.FC<ReservationTimerProps> = ({
  expiresAt,
  onExpire,
  compact = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      return remaining;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Call onExpire when timer reaches 0
      if (remaining === 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (timeRemaining > 300) return PremiumColors.accent.secondary; // > 5 min: green
    if (timeRemaining > 120) return '#F59E0B'; // > 2 min: orange
    return '#EF4444'; // <= 2 min: red
  };

  const isExpiring = timeRemaining <= 120; // Last 2 minutes

  if (timeRemaining === 0) {
    return null; // Don't show expired timer
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="time-outline" size={12} color={getTimerColor()} />
        <Text style={[styles.compactText, { color: getTimerColor() }]}>
          {formatTime(timeRemaining)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isExpiring && styles.containerExpiring]}>
      <View style={styles.iconContainer}>
        <Ionicons name="time-outline" size={16} color={getTimerColor()} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>Reserved for</Text>
        <Text style={[styles.time, { color: getTimerColor() }]}>
          {formatTime(timeRemaining)}
        </Text>
      </View>
      {isExpiring && (
        <View style={styles.warningBadge}>
          <Text style={styles.warningText}>Hurry!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 8,
  },
  containerExpiring: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: PremiumColors.text.secondary,
    fontWeight: '500',
  },
  time: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warningBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  warningText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  compactText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

