import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { MedicalRecord } from '../../services/mockData';

interface RecordCardProps {
  record: MedicalRecord;
  onPress?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  onPress,
  onShare,
  onDownload,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'prescription':
        return 'medical-outline';
      case 'lab_report':
        return 'flask-outline';
      case 'scan':
        return 'scan-outline';
      case 'consultation':
        return 'person-outline';
      case 'vaccination':
        return 'shield-checkmark-outline';
      default:
        return 'document-outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'prescription':
        return Colors.primary;
      case 'lab_report':
        return Colors.info;
      case 'scan':
        return Colors.warning;
      case 'consultation':
        return Colors.success;
      case 'vaccination':
        return Colors.secondary;
      default:
        return Colors.gray400;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderFileAttachments = () => {
    if (record.fileUrls.length === 0) return null;

    return (
      <View style={styles.attachmentsContainer}>
        <Text style={styles.attachmentsLabel}>
          {record.fileUrls.length} attachment{record.fileUrls.length > 1 ? 's' : ''}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.attachmentsList}
        >
          {record.fileUrls.map((fileUrl, index) => (
            <View key={index} style={styles.attachmentItem}>
              <Text style={styles.attachmentIcon}>{fileUrl}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTags = () => {
    if (record.tags.length === 0) return null;

    return (
      <View style={styles.tagsContainer}>
        {record.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {record.tags.length > 3 && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>+{record.tags.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      {onShare && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onShare}
        >
          <Ionicons name="share-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}
      {onDownload && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDownload}
        >
          <Ionicons name="download-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: getCategoryColor(record.category) + '20' }
          ]}>
            <Ionicons
              name={getCategoryIcon(record.category)}
              size={20}
              color={getCategoryColor(record.category)}
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{record.title}</Text>
            <Text style={styles.date}>{formatDate(record.date)}</Text>
          </View>
        </View>
        
        {record.isPrivate && (
          <View style={styles.privateIndicator}>
            <Ionicons name="lock-closed" size={16} color={Colors.warning} />
          </View>
        )}
      </View>

      {(record.doctorName || record.hospital) && (
        <View style={styles.providerInfo}>
          {record.doctorName && (
            <Text style={styles.providerText}>
              <Ionicons name="person" size={14} color={Colors.textSecondary} /> {record.doctorName}
            </Text>
          )}
          {record.hospital && (
            <Text style={styles.providerText}>
              <Ionicons name="business" size={14} color={Colors.textSecondary} /> {record.hospital}
            </Text>
          )}
        </View>
      )}

      <Text style={styles.description} numberOfLines={2}>
        {record.description}
      </Text>

      {renderFileAttachments()}
      {renderTags()}

      <View style={styles.footer}>
        <Text style={styles.createdAt}>
          Added {formatDate(record.createdAt)}
        </Text>
        {renderActions()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  privateIndicator: {
    padding: Spacing.xs,
    backgroundColor: Colors.warning + '20',
    borderRadius: Spacing.borderRadius.sm,
  },
  providerInfo: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  providerText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
    marginBottom: Spacing.md,
  },
  attachmentsContainer: {
    marginBottom: Spacing.md,
  },
  attachmentsLabel: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  attachmentsList: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  attachmentItem: {
    width: 40,
    height: 40,
    backgroundColor: Colors.gray100,
    borderRadius: Spacing.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentIcon: {
    fontSize: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + '10',
    borderRadius: Spacing.borderRadius.sm,
  },
  tagText: {
    fontSize: Fonts.size.xs,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdAt: {
    fontSize: Fonts.size.xs,
    color: Colors.gray400,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: Spacing.borderRadius.sm,
  },
});
