import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Colors } from '../constants';

// Import main tab screens
import { AppointmentsScreen } from '../screens/main/AppointmentsScreen';
import { DoctorsScreen } from '../screens/main/DoctorsScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

// Import other screens
import { AppointmentConfirmationScreen } from '../screens/booking/AppointmentConfirmationScreen';
import { BookAppointmentScreen } from '../screens/booking/BookAppointmentScreen';
import { DoctorDetailsScreen } from '../screens/doctor/DoctorDetailsScreen';
import { PrivacyScreen } from '../screens/legal/PrivacyScreen';
import { TermsScreen } from '../screens/legal/TermsScreen';
import { PaymentScreen } from '../screens/payment/PaymentScreen';
import { PaymentSuccessScreen } from '../screens/payment/PaymentSuccessScreen';
import { AddMedicalRecordScreen } from '../screens/profile/AddMedicalRecordScreen';
import { AllMedicalRecordsScreen } from '../screens/profile/AllMedicalRecordsScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { HelpCenterScreen } from '../screens/profile/HelpCenterScreen';
import { MedicalRecordsScreen } from '../screens/profile/MedicalRecordsScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

// Import new screens
import { PatientDetailsFormScreen } from '../screens/booking/PatientDetailsFormScreen';
import { ContactClinicScreen } from '../screens/contact/ContactClinicScreen';
import { DiagnosticsBookingScreen } from '../screens/diagnostics/DiagnosticsBookingScreen';
import { FavoriteDoctorsScreen } from '../screens/doctor/FavoriteDoctorsScreen';
import { MedicineOrderFlowScreen } from '../screens/medicine/MedicineOrderFlowScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Bottom Tab Navigator
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Doctors':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Appointments':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.gray200,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Doctors" 
        component={DoctorsScreen}
        options={{ title: 'Doctors' }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{ title: 'Appointments' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main App Stack Navigator
export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      
      {/* Doctor screens */}
      <Stack.Screen 
        name="DoctorDetails" 
        component={DoctorDetailsScreen} 
      />
      
      {/* Booking screens */}
      <Stack.Screen 
        name="BookAppointment" 
        component={BookAppointmentScreen} 
      />
      <Stack.Screen 
        name="AppointmentConfirmation" 
        component={AppointmentConfirmationScreen} 
      />
      
      {/* Payment screens */}
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
      />
      <Stack.Screen 
        name="PaymentSuccess" 
        component={PaymentSuccessScreen} 
      />
      
      {/* Profile screens */}
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
      />
      <Stack.Screen 
        name="MedicalRecords" 
        component={MedicalRecordsScreen} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
      />
      <Stack.Screen 
        name="HelpCenter" 
        component={HelpCenterScreen} 
      />
      
      {/* Legal screens */}
      <Stack.Screen 
        name="Terms" 
        component={TermsScreen} 
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen} 
      />
      
      {/* Medicine screens */}
      <Stack.Screen 
        name="MedicineOrderFlow" 
        component={MedicineOrderFlowScreen} 
      />
      
      {/* Diagnostics screens */}
      <Stack.Screen 
        name="DiagnosticsBooking" 
        component={DiagnosticsBookingScreen} 
      />
      
      {/* Medical Records screens */}
      <Stack.Screen 
        name="AddMedicalRecord" 
        component={AddMedicalRecordScreen} 
      />
      <Stack.Screen 
        name="AllMedicalRecords" 
        component={AllMedicalRecordsScreen} 
      />
      
      {/* Doctor screens */}
      <Stack.Screen 
        name="FavoriteDoctors" 
        component={FavoriteDoctorsScreen} 
      />
      
      {/* Booking screens */}
      <Stack.Screen 
        name="PatientDetailsForm" 
        component={PatientDetailsFormScreen} 
      />
      
      {/* Contact screens */}
      <Stack.Screen 
        name="ContactClinic" 
        component={ContactClinicScreen} 
      />
    </Stack.Navigator>
  );
};