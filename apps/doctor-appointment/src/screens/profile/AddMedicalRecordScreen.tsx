import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { ImagePicker } from '../../components/common/ImagePicker';
import { Input } from '../../components/common/Input';
import { Colors, Fonts, Spacing } from '../../constants';

interface MedicalRecordForm {
  title: string;
  category: string;
  date: string;
  doctorName: string;
  hospital: string;
  description: string;
  tags: string[];
  isPrivate: boolean;
  fileUrls: string[];
}

const recordCategories = [
  { value: 'prescription', label: 'Prescription', icon: 'medical-outline', color: Colors.primary },
  { value: 'lab_report', label: 'Lab Report', icon: 'flask-outline', color: Colors.info },
  { value: 'scan', label: 'Scan/X-Ray', icon: 'scan-outline', color: Colors.warning },
  { value: 'consultation', label: 'Consultation', icon: 'person-outline', color: Colors.success },
  { value: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark-outline', color: Colors.secondary },
  { value: 'other', label: 'Other', icon: 'document-outline', color: Colors.gray400 },
];

const commonTags = [
  'routine', 'follow-up', 'emergency', 'chronic', 'acute',
  'blood work', 'imaging', 'medication', 'surgery', 'therapy'
];

export const AddMedicalRecordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<MedicalRecordForm>({
    title: '',
    category: '',
    date: '',
    doctorName: '',
    hospital: '',
    description: '',
    tags: [],
    isPrivate: false,
    fileUrls: [],
  });

  const handleSave = () => {
    if (!formData.title || !formData.category || !formData.date) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Record Saved',
      'Your medical record has been saved successfully.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const updateFormData = (field: keyof MedicalRecordForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    const currentTags = formData.tags;
    if (currentTags.includes(tag)) {
      updateFormData('tags', currentTags.filter(t => t !== tag));
    } else {
      updateFormData('tags', [...currentTags, tag]);
    }
  };

  const renderCategorySelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category *</Text>
      <View style={styles.categoriesGrid}>
        {recordCategories.map((category) => (
          <TouchableOpacity
            key={category.value}
            style={[
              styles.categoryCard,
              formData.category === category.value && styles.categoryCardSelected,
            ]}
            onPress={() => updateFormData('category', category.value)}
          >
            <View style={[
              styles.categoryIcon,
              { backgroundColor: category.color + '20' }
            ]}>
              <Ionicons 
                name={category.icon} 
                size={24} 
                color={category.color} 
              />
            </View>
            <Text style={[
              styles.categoryLabel,
              formData.category === category.value && styles.categoryLabelSelected,
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Input
        label="Record Title *"
        value={formData.title}
        onChangeText={(text) => updateFormData('title', text)}
        placeholder="e.g., Annual Physical Exam"
      />
      
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => updateFormData('date', '2025-01-25')}
      >
        <Text style={styles.dateLabel}>Date *</Text>
        <View style={styles.dateInputContent}>
          <Ionicons name="calendar" size={20} color={Colors.primary} />
          <Text style={[
            styles.dateValue,
            !formData.date && styles.datePlaceholder,
          ]}>
            {formData.date || 'Select date'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
        </View>
      </TouchableOpacity>
      
      <Input
        label="Doctor Name"
        value={formData.doctorName}
        onChangeText={(text) => updateFormData('doctorName', text)}
        placeholder="e.g., Dr. John Smith"
      />
      
      <Input
        label="Hospital/Clinic"
        value={formData.hospital}
        onChangeText={(text) => updateFormData('hospital', text)}
        placeholder="e.g., City General Hospital"
      />
      
      <Input
        label="Description"
        value={formData.description}
        onChangeText={(text) => updateFormData('description', text)}
        placeholder="Brief description of the record"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderFileUpload = () => (
    <View style={styles.section}>
      <ImagePicker
        images={formData.fileUrls}
        onImagesChange={(images) => updateFormData('fileUrls', images)}
        title="Attach Files"
        placeholder="Add photos of prescriptions, reports, or scans"
        maxImages={5}
      />
    </View>
  );

  const renderTags = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tags</Text>
      <Text style={styles.sectionDescription}>
        Add tags to help organize and find your records easily.
      </Text>
      
      <View style={styles.tagsContainer}>
        {commonTags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagChip,
              formData.tags.includes(tag) && styles.tagChipSelected,
            ]}
            onPress={() => toggleTag(tag)}
          >
            <Text style={[
              styles.tagChipText,
              formData.tags.includes(tag) && styles.tagChipTextSelected,
            ]}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPrivacySettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy Settings</Text>
      
      <TouchableOpacity
        style={styles.privacyOption}
        onPress={() => updateFormData('isPrivate', !formData.isPrivate)}
      >
        <View style={styles.privacyOptionContent}>
          <Ionicons 
            name={formData.isPrivate ? 'lock-closed' : 'lock-open'} 
            size={24} 
            color={formData.isPrivate ? Colors.warning : Colors.success} 
          />
          <View style={styles.privacyOptionText}>
            <Text style={styles.privacyOptionTitle}>
              {formData.isPrivate ? 'Private Record' : 'Shared Record'}
            </Text>
            <Text style={styles.privacyOptionDescription}>
              {formData.isPrivate 
                ? 'Only you can view this record'
                : 'Can be shared with healthcare providers'
              }
            </Text>
          </View>
        </View>
        <Ionicons 
          name={formData.isPrivate ? 'toggle' : 'toggle-outline'} 
          size={32} 
          color={formData.isPrivate ? Colors.primary : Colors.gray400} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Add Medical Record" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCategorySelection()}
        {renderBasicInfo()}
        {renderFileUpload()}
        {renderTags()}
        {renderPrivacySettings()}
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Save Record"
          onPress={handleSave}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    padding: Spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: '30%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.primary,
  },
  dateInput: {
    marginBottom: Spacing.md,
  },
  dateLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray300,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  dateValue: {
    flex: 1,
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
  },
  datePlaceholder: {
    color: Colors.gray400,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tagChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.gray300,
    backgroundColor: Colors.white,
  },
  tagChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  tagChipText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    fontWeight: Fonts.weight.medium,
  },
  tagChipTextSelected: {
    color: Colors.white,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.gray50,
  },
  privacyOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  privacyOptionText: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  privacyOptionDescription: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  footer: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});
