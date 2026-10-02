// Mock data service for DoctorHunt app
// This file provides comprehensive mock data for all screens during UI development

export interface MedicineOrder {
  id: string;
  patientId: string;
  items: MedicineItem[];
  prescriptionUrl?: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  deliveryAddress: string;
  deliveryDate: string;
  orderDate: string;
  paymentMethod: string;
  orderNumber: string;
}

export interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  prescriptionRequired: boolean;
  manufacturer: string;
  imageUrl?: string;
}

export interface DiagnosticPackage {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  testsIncluded: number;
  features: string[];
  imageUrl: string;
  duration: string;
  reportDelivery: string;
  isPopular: boolean;
  category: 'basic' | 'comprehensive' | 'specialized';
}

export interface DiagnosticBooking {
  id: string;
  patientId: string;
  packageId: string;
  packageName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'sample_collected' | 'in_progress' | 'completed' | 'cancelled';
  patientDetails: PatientDetails;
  address: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  reportUrl?: string;
  bookingDate: string;
}

export interface PatientDetails {
  id: string;
  relationship: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  category: 'prescription' | 'lab_report' | 'scan' | 'consultation' | 'vaccination' | 'other';
  date: string;
  doctorName?: string;
  hospital?: string;
  description: string;
  fileUrls: string[];
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface FavoriteDoctor {
  doctorId: string;
  addedDate: string;
  lastConsultation?: string;
  totalConsultations: number;
}

// Mock Medicine Data
export const mockMedicineCategories = [
  {
    id: '1',
    title: 'Guide to medicine order',
    icon: 'medical-outline',
    description: 'Learn how to order medicines safely',
  },
  {
    id: '2',
    title: 'Prescription related issues',
    icon: 'document-text-outline',
    description: 'Upload and manage prescriptions',
  },
  {
    id: '3',
    title: 'Order status',
    icon: 'bag-outline',
    description: 'Track your medicine orders',
  },
  {
    id: '4',
    title: 'Order delivery',
    icon: 'car-outline',
    description: 'Delivery options and tracking',
  },
  {
    id: '5',
    title: 'Payments & Refunds',
    icon: 'card-outline',
    description: 'Payment methods and refund policy',
  },
  {
    id: '6',
    title: 'Order returns',
    icon: 'return-up-back-outline',
    description: 'Return and exchange policy',
  },
];

export const mockMedicineItems: MedicineItem[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    genericName: 'Acetaminophen',
    dosage: '500mg',
    quantity: 30,
    unitPrice: 2.50,
    totalPrice: 75.00,
    prescriptionRequired: false,
    manufacturer: 'MediCorp',
    imageUrl: '💊',
  },
  {
    id: '2',
    name: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    dosage: '250mg',
    quantity: 21,
    unitPrice: 8.75,
    totalPrice: 183.75,
    prescriptionRequired: true,
    manufacturer: 'PharmaCare',
    imageUrl: '💊',
  },
  {
    id: '3',
    name: 'Vitamin D3 1000 IU',
    genericName: 'Cholecalciferol',
    dosage: '1000 IU',
    quantity: 60,
    unitPrice: 12.99,
    totalPrice: 12.99,
    prescriptionRequired: false,
    manufacturer: 'HealthPlus',
    imageUrl: '💊',
  },
];

export const mockMedicineOrders: MedicineOrder[] = [
  {
    id: 'ORD001',
    patientId: '1',
    items: mockMedicineItems.slice(0, 2),
    totalAmount: 258.75,
    status: 'shipped',
    deliveryAddress: '123 Main St, City, State 12345',
    deliveryDate: '2025-01-28',
    orderDate: '2025-01-25',
    paymentMethod: 'Credit Card',
    orderNumber: 'MED-2025-001',
  },
];

// Mock Diagnostic Data
export const mockDiagnosticPackages: DiagnosticPackage[] = [
  {
    id: '1',
    title: 'Advanced Young Indian Health Checkup',
    subtitle: 'Ideal for individuals aged 21-40 years',
    description: 'Comprehensive health screening for young adults',
    originalPrice: 358,
    discountedPrice: 330,
    discount: 35,
    testsIncluded: 69,
    features: ['Free home Sample pickup', 'Practo associate labs', 'E-Reports in 24-72 hours', 'Free follow-up with a doctor'],
    imageUrl: '🩺',
    duration: '2-3 hours',
    reportDelivery: '24-72 hours',
    isPopular: true,
    category: 'comprehensive',
  },
  {
    id: '2',
    title: "Working Women's Health Checkup",
    subtitle: 'Ideal for working women aged 25-45 years',
    description: 'Specialized health screening for working women',
    originalPrice: 387,
    discountedPrice: 345,
    discount: 35,
    testsIncluded: 119,
    features: ['Free home Sample pickup', 'Practo associate labs', 'E-Reports in 24-72 hours', 'Free follow-up with a doctor'],
    imageUrl: '👩‍⚕️',
    duration: '3-4 hours',
    reportDelivery: '24-72 hours',
    isPopular: false,
    category: 'specialized',
  },
  {
    id: '3',
    title: 'Active Professional Health Checkup',
    subtitle: 'Ideal for busy professionals aged 30-50 years',
    description: 'Quick yet comprehensive health screening',
    originalPrice: 457,
    discountedPrice: 411,
    discount: 35,
    testsIncluded: 100,
    features: ['Free home Sample pickup', 'Practo associate labs', 'E-Reports in 24-72 hours', 'Free follow-up with a doctor'],
    imageUrl: '🏥',
    duration: '2-3 hours',
    reportDelivery: '24-72 hours',
    isPopular: false,
    category: 'comprehensive',
  },
];

export const mockDiagnosticBookings: DiagnosticBooking[] = [
  {
    id: 'DIAG001',
    patientId: '1',
    packageId: '1',
    packageName: 'Advanced Young Indian Health Checkup',
    scheduledDate: '2025-01-30',
    scheduledTime: '09:00',
    status: 'scheduled',
    patientDetails: {
      id: '1',
      relationship: 'self',
      firstName: 'John',
      lastName: 'Doe',
      age: 28,
      gender: 'male',
      phone: '+1234567890',
      email: 'john.doe@email.com',
      address: '123 Main St, City, State 12345',
      emergencyContact: {
        name: 'Jane Doe',
        phone: '+1234567891',
        relationship: 'spouse',
      },
    },
    address: '123 Main St, City, State 12345',
    totalAmount: 330,
    paymentStatus: 'paid',
    bookingDate: '2025-01-25',
  },
];

// Mock Medical Records Data
export const mockMedicalRecords: MedicalRecord[] = [
  {
    id: 'REC001',
    patientId: '1',
    title: 'Annual Physical Examination',
    category: 'consultation',
    date: '2025-01-20',
    doctorName: 'Dr. Sarah Johnson',
    hospital: 'City General Hospital',
    description: 'Routine annual physical examination with blood work',
    fileUrls: ['📄', '📊'],
    tags: ['physical', 'blood work', 'routine'],
    isPrivate: false,
    createdAt: '2025-01-20',
  },
  {
    id: 'REC002',
    patientId: '1',
    title: 'Blood Test Results',
    category: 'lab_report',
    date: '2025-01-18',
    doctorName: 'Dr. Michael Chen',
    hospital: 'MediLab Center',
    description: 'Complete blood count and lipid panel results',
    fileUrls: ['📊', '📈'],
    tags: ['blood test', 'CBC', 'lipid panel'],
    isPrivate: false,
    createdAt: '2025-01-18',
  },
  {
    id: 'REC003',
    patientId: '1',
    title: 'X-Ray Chest',
    category: 'scan',
    date: '2025-01-15',
    doctorName: 'Dr. Emily Rodriguez',
    hospital: 'Radiology Associates',
    description: 'Chest X-ray for respiratory symptoms',
    fileUrls: ['🏥', '📸'],
    tags: ['x-ray', 'chest', 'respiratory'],
    isPrivate: false,
    createdAt: '2025-01-15',
  },
  {
    id: 'REC004',
    patientId: '1',
    title: 'COVID-19 Vaccination',
    category: 'vaccination',
    date: '2024-12-15',
    doctorName: 'Dr. James Wilson',
    hospital: 'Community Health Center',
    description: 'COVID-19 booster vaccination',
    fileUrls: ['💉'],
    tags: ['vaccination', 'covid-19', 'booster'],
    isPrivate: false,
    createdAt: '2024-12-15',
  },
];

// Mock Favorite Doctors Data
export const mockFavoriteDoctors: FavoriteDoctor[] = [
  {
    doctorId: '1',
    addedDate: '2024-12-01',
    lastConsultation: '2025-01-20',
    totalConsultations: 3,
  },
  {
    doctorId: '2',
    addedDate: '2024-11-15',
    lastConsultation: '2024-12-10',
    totalConsultations: 1,
  },
];

// Mock Patient Details
export const mockPatientDetails: PatientDetails[] = [
  {
    id: '1',
    relationship: 'self',
    firstName: 'John',
    lastName: 'Doe',
    age: 28,
    gender: 'male',
    phone: '+1234567890',
    email: 'john.doe@email.com',
    address: '123 Main St, City, State 12345',
    emergencyContact: {
      name: 'Jane Doe',
      phone: '+1234567891',
      relationship: 'spouse',
    },
  },
  {
    id: '2',
    relationship: 'child',
    firstName: 'Emma',
    lastName: 'Doe',
    age: 8,
    gender: 'female',
    phone: '+1234567890',
    email: 'john.doe@email.com',
    address: '123 Main St, City, State 12345',
    emergencyContact: {
      name: 'John Doe',
      phone: '+1234567890',
      relationship: 'father',
    },
  },
];

// Mock Clinic Contact Information
export const mockClinicContacts = [
  {
    id: '1',
    name: 'City General Hospital',
    address: '123 Medical Center Dr, City, State 12345',
    phone: '+1-555-0123',
    email: 'info@citygeneralhospital.com',
    website: 'www.citygeneralhospital.com',
    hours: 'Mon-Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 2:00 PM\nSun: Closed',
    emergencyPhone: '+1-555-0911',
    departments: ['Emergency', 'Cardiology', 'Pediatrics', 'Orthopedics'],
    services: ['24/7 Emergency Care', 'Diagnostic Imaging', 'Laboratory Services', 'Pharmacy'],
  },
  {
    id: '2',
    name: 'MediCare Clinic',
    address: '456 Health Ave, City, State 12345',
    phone: '+1-555-0456',
    email: 'contact@medicareClinic.com',
    website: 'www.medicareClinic.com',
    hours: 'Mon-Fri: 9:00 AM - 5:00 PM\nSat: 10:00 AM - 2:00 PM\nSun: Closed',
    emergencyPhone: '+1-555-0911',
    departments: ['Family Medicine', 'Internal Medicine', 'Dermatology'],
    services: ['Primary Care', 'Preventive Care', 'Minor Procedures', 'Vaccinations'],
  },
];

// Helper functions for mock data
export const getMedicineOrderById = (id: string): MedicineOrder | undefined => {
  return mockMedicineOrders.find(order => order.id === id);
};

export const getDiagnosticPackageById = (id: string): DiagnosticPackage | undefined => {
  return mockDiagnosticPackages.find(pkg => pkg.id === id);
};

export const getMedicalRecordsByPatientId = (patientId: string): MedicalRecord[] => {
  return mockMedicalRecords.filter(record => record.patientId === patientId);
};

export const getFavoriteDoctorsByPatientId = (patientId: string): FavoriteDoctor[] => {
  return mockFavoriteDoctors.filter(fav => fav.doctorId);
};

export const getPatientDetailsById = (id: string): PatientDetails | undefined => {
  return mockPatientDetails.find(patient => patient.id === id);
};

// Mock API response delays (simulate real API)
export const mockApiDelay = (ms: number = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
