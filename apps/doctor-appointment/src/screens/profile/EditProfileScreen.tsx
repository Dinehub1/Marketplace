import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Mock API call to update profile
      const updatedProfile = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dateOfBirth: dateOfBirth.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        bloodType: bloodType.trim(),
        allergies: allergies.trim(),
      };

      console.log('Updating profile:', updatedProfile);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Update Failed', 'There was an error updating your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Edit Profile" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Picture */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePicture}>
            <Text style={styles.profilePictureText}>
              {firstName[0]}{lastName[0]}
            </Text>
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Input
            label="First Name *"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
            leftIcon="person-outline"
          />
          
          <Input
            label="Last Name *"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
            leftIcon="person-outline"
          />
          
          <Input
            label="Email *"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            leftIcon="mail-outline"
            autoCapitalize="none"
          />
          
          <Input
            label="Phone Number"
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />
          
          <Input
            label="Date of Birth"
            placeholder="DD/MM/YYYY"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            leftIcon="calendar-outline"
          />
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <Input
            label="Address"
            placeholder="Enter your full address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            leftIcon="location-outline"
          />
          
          <Input
            label="Emergency Contact"
            placeholder="Name and phone number"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            leftIcon="call-outline"
          />
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Blood Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.bloodTypeScroll}
            >
              {bloodTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeChip,
                    bloodType === type && styles.selectedBloodTypeChip,
                  ]}
                  onPress={() => setBloodType(type)}
                >
                  <Text style={[
                    styles.bloodTypeText,
                    bloodType === type && styles.selectedBloodTypeText,
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <Input
            label="Allergies"
            placeholder="List any allergies or medical conditions"
            value={allergies}
            onChangeText={setAllergies}
            multiline
            numberOfLines={3}
            leftIcon="warning-outline"
          />
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.noteText}>
              Your medical information is kept confidential and is only shared with your healthcare providers.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomSection}>
        <Button
          title={isLoading ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          loading={isLoading}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  profilePictureSection: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profilePictureText: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.white,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.primaryLight + '20',
  },
  changePhotoText: {
    marginLeft: Spacing.xs,
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    fontWeight: Fonts.weight.medium,
  },
  section: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  bloodTypeScroll: {
    marginTop: Spacing.xs,
  },
  bloodTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
  },
  selectedBloodTypeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bloodTypeText: {
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  selectedBloodTypeText: {
    color: Colors.white,
  },
  noteSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primaryLight + '10',
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
  },
  noteText: {
    marginLeft: Spacing.sm,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.sm,
  },
  bottomSection: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
});
