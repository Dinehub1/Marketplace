export { Colors } from './colors';
export { Fonts } from './fonts';
export { Spacing } from './spacing';

export const APP_NAME = 'MEDICAL APP';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.medicalapp.com';

// Screen names
export const SCREEN_NAMES = {
  // Auth
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main tabs
  HOME: 'Home',
  DOCTORS: 'Doctors',
  APPOINTMENTS: 'Appointments',
  PROFILE: 'Profile',
  
  // Doctor screens
  DOCTOR_DETAILS: 'DoctorDetails',
  BOOK_APPOINTMENT: 'BookAppointment',
  APPOINTMENT_CONFIRMATION: 'AppointmentConfirmation',
  
  // Profile screens
  EDIT_PROFILE: 'EditProfile',
  MEDICAL_RECORDS: 'MedicalRecords',
  NOTIFICATIONS: 'Notifications',
  HELP_CENTER: 'HelpCenter',
  TERMS: 'Terms',
  PRIVACY: 'Privacy',
  
  // Payment screens
  PAYMENT: 'Payment',
  PAYMENT_SUCCESS: 'PaymentSuccess',
  
  // Medicine screens
  MEDICINE_ORDERS: 'MedicineOrders',
  MEDICINE_ORDERS_EMPTY: 'MedicineOrdersEmpty',
  MEDICINE_ORDER_FLOW: 'MedicineOrderFlow',
  
  // Diagnostics screens
  DIAGNOSTICS_TESTS: 'DiagnosticsTests',
  DIAGNOSTICS_PACKAGES: 'DiagnosticsPackages',
  DIAGNOSTICS_BOOKING: 'DiagnosticsBooking',
  
  // Location screens
  LOCATION_SERVICES: 'LocationServices',
  
  // Medical Records screens
  ADD_MEDICAL_RECORD: 'AddMedicalRecord',
  ALL_MEDICAL_RECORDS: 'AllMedicalRecords',
  
  // Doctor screens
  FAVORITE_DOCTORS: 'FavoriteDoctors',
  
  // Booking screens
  PATIENT_DETAILS_FORM: 'PatientDetailsForm',
  
  // Contact screens
  CONTACT_CLINIC: 'ContactClinic',
} as const;

// User types
export const USER_TYPES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
} as const;

// Appointment status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;
