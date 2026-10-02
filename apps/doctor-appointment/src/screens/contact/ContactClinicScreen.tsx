import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Colors, Fonts, Spacing } from '../../constants';
import { mockClinicContacts } from '../../services/mockData';

interface ContactMethod {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => void;
}

export const ContactClinicScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedClinic, setSelectedClinic] = useState(mockClinicContacts[0]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsite = (website: string) => {
    Linking.openURL(`https://${website}`);
  };

  const handleEmergencyCall = (phoneNumber: string) => {
    Alert.alert(
      'Emergency Call',
      `Call ${phoneNumber} for emergency assistance?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => handlePhoneCall(phoneNumber) },
      ]
    );
  };

  const handleSendMessage = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    Alert.alert(
      'Message Sent',
      'Your message has been sent successfully. We will get back to you soon.',
      [
        {
          text: 'OK',
          onPress: () => {
            setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
            setShowContactForm(false);
          },
        },
      ]
    );
  };

  const contactMethods: ContactMethod[] = [
    {
      id: 'phone',
      title: 'Call Clinic',
      icon: 'call',
      color: Colors.success,
      action: () => handlePhoneCall(selectedClinic.phone),
    },
    {
      id: 'email',
      title: 'Send Email',
      icon: 'mail',
      color: Colors.info,
      action: () => handleEmail(selectedClinic.email),
    },
    {
      id: 'website',
      title: 'Visit Website',
      icon: 'globe',
      color: Colors.primary,
      action: () => handleWebsite(selectedClinic.website),
    },
    {
      id: 'emergency',
      title: 'Emergency Call',
      icon: 'medical',
      color: Colors.error,
      action: () => handleEmergencyCall(selectedClinic.emergencyPhone),
    },
  ];

  const renderClinicSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Clinic</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.clinicsRow}>
          {mockClinicContacts.map((clinic) => (
            <TouchableOpacity
              key={clinic.id}
              style={[
                styles.clinicCard,
                selectedClinic.id === clinic.id && styles.clinicCardSelected,
              ]}
              onPress={() => setSelectedClinic(clinic)}
            >
              <Text style={[
                styles.clinicName,
                selectedClinic.id === clinic.id && styles.clinicNameSelected,
              ]}>
                {clinic.name}
              </Text>
              <Text style={styles.clinicAddress}>{clinic.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderClinicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Clinic Information</Text>
      
      <View style={styles.clinicDetails}>
        <View style={styles.clinicDetailItem}>
          <Ionicons name="business" size={20} color={Colors.primary} />
          <View style={styles.clinicDetailContent}>
            <Text style={styles.clinicDetailLabel}>Name</Text>
            <Text style={styles.clinicDetailValue}>{selectedClinic.name}</Text>
          </View>
        </View>
        
        <View style={styles.clinicDetailItem}>
          <Ionicons name="location" size={20} color={Colors.primary} />
          <View style={styles.clinicDetailContent}>
            <Text style={styles.clinicDetailLabel}>Address</Text>
            <Text style={styles.clinicDetailValue}>{selectedClinic.address}</Text>
          </View>
        </View>
        
        <View style={styles.clinicDetailItem}>
          <Ionicons name="time" size={20} color={Colors.primary} />
          <View style={styles.clinicDetailContent}>
            <Text style={styles.clinicDetailLabel}>Hours</Text>
            <Text style={styles.clinicDetailValue}>{selectedClinic.hours}</Text>
          </View>
        </View>
        
        <View style={styles.clinicDetailItem}>
          <Ionicons name="call" size={20} color={Colors.primary} />
          <View style={styles.clinicDetailContent}>
            <Text style={styles.clinicDetailLabel}>Phone</Text>
            <TouchableOpacity onPress={() => handlePhoneCall(selectedClinic.phone)}>
              <Text style={[styles.clinicDetailValue, styles.linkText]}>
                {selectedClinic.phone}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.clinicDetailItem}>
          <Ionicons name="mail" size={20} color={Colors.primary} />
          <View style={styles.clinicDetailContent}>
            <Text style={styles.clinicDetailLabel}>Email</Text>
            <TouchableOpacity onPress={() => handleEmail(selectedClinic.email)}>
              <Text style={[styles.clinicDetailValue, styles.linkText]}>
                {selectedClinic.email}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderContactMethods = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Options</Text>
      
      <View style={styles.contactMethodsGrid}>
        {contactMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.contactMethodCard}
            onPress={method.action}
          >
            <View style={[styles.contactMethodIcon, { backgroundColor: method.color + '20' }]}>
              <Ionicons name={method.icon} size={24} color={method.color} />
            </View>
            <Text style={styles.contactMethodTitle}>{method.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDepartmentsAndServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Departments & Services</Text>
      
      <View style={styles.infoGrid}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoColumnTitle}>Departments</Text>
          {selectedClinic.departments.map((dept, index) => (
            <View key={index} style={styles.infoItem}>
              <Ionicons name="medical" size={16} color={Colors.primary} />
              <Text style={styles.infoItemText}>{dept}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.infoColumn}>
          <Text style={styles.infoColumnTitle}>Services</Text>
          {selectedClinic.services.map((service, index) => (
            <View key={index} style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.infoItemText}>{service}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderContactForm = () => {
    if (!showContactForm) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send a Message</Text>
          <Text style={styles.sectionDescription}>
            Have a question or need assistance? Send us a message and we'll get back to you soon.
          </Text>
          <Button
            title="Send Message"
            onPress={() => setShowContactForm(true)}
            style={styles.showFormButton}
          />
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send a Message</Text>
        
        <View style={styles.formContainer}>
          <Input
            label="Name *"
            value={contactForm.name}
            onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
            placeholder="Your full name"
          />
          
          <Input
            label="Email *"
            value={contactForm.email}
            onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
            placeholder="Your email address"
            keyboardType="email-address"
          />
          
          <Input
            label="Phone"
            value={contactForm.phone}
            onChangeText={(text) => setContactForm({ ...contactForm, phone: text })}
            placeholder="Your phone number"
            keyboardType="phone-pad"
          />
          
          <Input
            label="Subject"
            value={contactForm.subject}
            onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
            placeholder="Message subject"
          />
          
          <Input
            label="Message *"
            value={contactForm.message}
            onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
            placeholder="Your message"
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.formButtons}>
            <Button
              title="Cancel"
              onPress={() => setShowContactForm(false)}
              variant="outline"
              style={styles.formButton}
            />
            <Button
              title="Send Message"
              onPress={handleSendMessage}
              style={styles.formButton}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Contact Clinic" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderClinicSelector()}
        {renderClinicInfo()}
        {renderContactMethods()}
        {renderDepartmentsAndServices()}
        {renderContactForm()}
      </ScrollView>
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
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
    marginBottom: Spacing.lg,
  },
  clinicsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  clinicCard: {
    backgroundColor: Colors.gray100,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    minWidth: 200,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  clinicCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  clinicName: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  clinicNameSelected: {
    color: Colors.primary,
  },
  clinicAddress: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
  },
  clinicDetails: {
    gap: Spacing.lg,
  },
  clinicDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  clinicDetailContent: {
    flex: 1,
  },
  clinicDetailLabel: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  clinicDetailValue: {
    fontSize: Fonts.size.base,
    color: Colors.textPrimary,
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  contactMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  contactMethodCard: {
    width: '47%',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
  },
  contactMethodIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  contactMethodTitle: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  infoColumn: {
    flex: 1,
  },
  infoColumnTitle: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  infoItemText: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  showFormButton: {
    alignSelf: 'flex-start',
  },
  formContainer: {
    gap: Spacing.md,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  formButton: {
    flex: 1,
  },
});
