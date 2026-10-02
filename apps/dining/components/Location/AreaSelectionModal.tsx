import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PremiumColors } from '../../constants/Colors';
import { CityArea, getCityAreas } from '../../utils/locationService';

interface AreaSelectionModalProps {
  visible: boolean;
  cityId: string | null;
  cityName: string;
  onAreaSelect: (area: CityArea) => void;
  onClose: () => void;
}

export default function AreaSelectionModal({
  visible,
  cityId,
  cityName,
  onAreaSelect,
  onClose,
}: AreaSelectionModalProps) {
  const [areas, setAreas] = useState<CityArea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && cityId) {
      loadAreas();
    }
  }, [visible, cityId]);

  const loadAreas = async () => {
    if (!cityId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getCityAreas(cityId);
      
      if (fetchError) {
        setError('Failed to load areas');
        console.error('Error loading areas:', fetchError);
        return;
      }
      
      if (data) {
        setAreas(data);
      }
    } catch (err) {
      setError('Failed to load areas');
      console.error('Error loading areas:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAreaItem = ({ item }: { item: CityArea }) => {
    return (
      <TouchableOpacity
        style={styles.areaItem}
        onPress={() => onAreaSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.areaIcon}>
          <Ionicons
            name="location"
            size={20}
            color={PremiumColors.accent.secondary}
          />
        </View>
        
        <View style={styles.areaInfo}>
          <Text style={styles.areaName}>
            {item.name}
          </Text>
          {item.description && (
            <Text style={styles.areaDescription}>
              {item.description}
            </Text>
          )}
        </View>
        
        <Ionicons
          name="chevron-forward"
          size={20}
          color={PremiumColors.text.tertiary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={PremiumColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Area</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>
            Choose an area in {cityName}
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PremiumColors.accent.secondary} />
            <Text style={styles.loadingText}>Loading areas...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={PremiumColors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAreas}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : areas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={48} color={PremiumColors.text.muted} />
            <Text style={styles.emptyText}>No areas found</Text>
            <Text style={styles.emptySubtext}>
              This city doesn't have any areas configured yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={areas}
            renderItem={renderAreaItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            // ✅ Performance Optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={11}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PremiumColors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: PremiumColors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  subtitle: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  areaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: PremiumColors.background.secondary,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  areaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PremiumColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '500',
    color: PremiumColors.text.primary,
    marginBottom: 2,
  },
  areaDescription: {
    fontSize: 13,
    color: PremiumColors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: PremiumColors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: PremiumColors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: PremiumColors.background.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PremiumColors.border,
  },
  retryText: {
    fontSize: 14,
    color: PremiumColors.text.primary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: PremiumColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: PremiumColors.text.secondary,
    textAlign: 'center',
  },
});
