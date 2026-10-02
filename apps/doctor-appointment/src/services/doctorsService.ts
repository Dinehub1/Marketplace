import { apiService, ApiResponse, PaginatedResponse } from './apiService';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  qualification: string;
  experience: number;
  rating: number;
  totalReviews: number;
  consultationFee: number;
  isAvailable: boolean;
  profileImage?: string;
  about?: string;
  education?: string[];
  hospital?: string;
  address?: string;
  workingHours?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  languages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DoctorFilters {
  specialization?: string;
  search?: string;
  rating?: number;
  maxFee?: number;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface TimeSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isAvailable: boolean;
}

class DoctorsService {
  // Get all doctors with filters and pagination
  async getDoctors(filters: DoctorFilters = {}): Promise<PaginatedResponse<Doctor>> {
    try {
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockDoctors(filters);
      }

      // Real API call
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiService.get<PaginatedResponse<Doctor>>(
        `/doctors?${queryParams.toString()}`
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      // Fallback to mock data on error
      return this.getMockDoctors(filters);
    }
  }

  // Get doctor by ID
  async getDoctorById(id: string): Promise<Doctor> {
    try {
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockDoctorById(id);
      }

      const response = await apiService.get<ApiResponse<Doctor>>(`/doctors/${id}`);
      
      if (!response.data) {
        throw new Error('Doctor not found');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor:', error);
      // Fallback to mock data
      return this.getMockDoctorById(id);
    }
  }

  // Get available time slots for a doctor
  async getAvailableTimeSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    try {
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockTimeSlots(doctorId, date);
      }

      const response = await apiService.get<ApiResponse<TimeSlot[]>>(
        `/doctors/${doctorId}/time-slots?date=${date}`
      );
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching time slots:', error);
      return this.getMockTimeSlots(doctorId, date);
    }
  }

  // Search doctors by name or specialization
  async searchDoctors(query: string): Promise<Doctor[]> {
    try {
      const filters: DoctorFilters = { search: query, limit: 20 };
      const response = await this.getDoctors(filters);
      return response.data;
    } catch (error) {
      console.error('Error searching doctors:', error);
      return [];
    }
  }

  // Get specializations list
  async getSpecializations(): Promise<string[]> {
    try {
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return [
          'Dermatology',
          'Cardiology',
          'Pediatrics',
          'Orthopedics',
          'Neurology',
          'Gynecology',
          'Psychiatry',
          'Ophthalmology',
          'ENT',
          'General Medicine'
        ];
      }

      const response = await apiService.get<ApiResponse<string[]>>('/doctors/specializations');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching specializations:', error);
      return ['Dermatology', 'Cardiology', 'Pediatrics'];
    }
  }

  // Mock data methods for development
  private getMockDoctors(filters: DoctorFilters): PaginatedResponse<Doctor> {
    const mockDoctors: Doctor[] = [
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@hospital.com',
        phone: '+1-555-0123',
        specialization: 'Dermatology',
        qualification: 'MD, Dermatology',
        experience: 12,
        rating: 4.8,
        totalReviews: 156,
        consultationFee: 150,
        isAvailable: true,
        about: 'Dr. Sarah Johnson is a board-certified dermatologist with over 12 years of experience treating skin conditions. She specializes in medical and cosmetic dermatology.',
        education: [
          'MD from Harvard Medical School',
          'Residency at Johns Hopkins Hospital',
          'Fellowship in Dermatopathology'
        ],
        hospital: 'City General Hospital',
        address: '123 Medical Center Dr, Downtown',
        languages: ['English', 'Spanish'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@hospital.com',
        phone: '+1-555-0124',
        specialization: 'Cardiology',
        qualification: 'MD, Cardiology',
        experience: 15,
        rating: 4.9,
        totalReviews: 203,
        consultationFee: 200,
        isAvailable: true,
        about: 'Dr. Michael Brown is a leading cardiologist with expertise in interventional cardiology and heart disease prevention.',
        education: [
          'MD from Stanford University',
          'Cardiology Fellowship at Mayo Clinic'
        ],
        hospital: 'Heart Care Center',
        address: '456 Heart Ave, Medical District',
        languages: ['English'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@hospital.com',
        phone: '+1-555-0125',
        specialization: 'Pediatrics',
        qualification: 'MD, Pediatrics',
        experience: 10,
        rating: 4.7,
        totalReviews: 89,
        consultationFee: 120,
        isAvailable: false,
        about: 'Dr. Emily Davis specializes in pediatric care with a focus on childhood development and preventive medicine.',
        education: [
          'MD from University of California',
          'Pediatrics Residency at Children\'s Hospital'
        ],
        hospital: 'Children\'s Medical Center',
        address: '789 Kids Way, Family District',
        languages: ['English', 'French'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    // Apply filters
    let filteredDoctors = [...mockDoctors];

    if (filters.specialization && filters.specialization !== 'All') {
      filteredDoctors = filteredDoctors.filter(
        doctor => doctor.specialization === filters.specialization
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredDoctors = filteredDoctors.filter(
        doctor =>
          doctor.firstName.toLowerCase().includes(searchLower) ||
          doctor.lastName.toLowerCase().includes(searchLower) ||
          doctor.specialization.toLowerCase().includes(searchLower)
      );
    }

    if (filters.isAvailable !== undefined) {
      filteredDoctors = filteredDoctors.filter(
        doctor => doctor.isAvailable === filters.isAvailable
      );
    }

    if (filters.rating) {
      filteredDoctors = filteredDoctors.filter(
        doctor => doctor.rating >= filters.rating!
      );
    }

    if (filters.maxFee) {
      filteredDoctors = filteredDoctors.filter(
        doctor => doctor.consultationFee <= filters.maxFee!
      );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDoctors = filteredDoctors.slice(startIndex, endIndex);

    return {
      data: paginatedDoctors,
      total: filteredDoctors.length,
      page,
      pageSize: limit,
      hasMore: endIndex < filteredDoctors.length,
    };
  }

  private getMockDoctorById(id: string): Doctor {
    const doctors = this.getMockDoctors({}).data;
    const doctor = doctors.find(d => d.id === id);
    
    if (!doctor) {
      throw new Error(`Doctor with ID ${id} not found`);
    }
    
    return doctor;
  }

  private getMockTimeSlots(doctorId: string, date: string): TimeSlot[] {
    const slots: TimeSlot[] = [
      { id: '1', doctorId, date, startTime: '09:00', endTime: '09:30', isBooked: false, isAvailable: true },
      { id: '2', doctorId, date, startTime: '09:30', endTime: '10:00', isBooked: false, isAvailable: true },
      { id: '3', doctorId, date, startTime: '10:00', endTime: '10:30', isBooked: true, isAvailable: false },
      { id: '4', doctorId, date, startTime: '10:30', endTime: '11:00', isBooked: false, isAvailable: true },
      { id: '5', doctorId, date, startTime: '11:00', endTime: '11:30', isBooked: false, isAvailable: true },
      { id: '6', doctorId, date, startTime: '11:30', endTime: '12:00', isBooked: true, isAvailable: false },
      { id: '7', doctorId, date, startTime: '14:00', endTime: '14:30', isBooked: false, isAvailable: true },
      { id: '8', doctorId, date, startTime: '14:30', endTime: '15:00', isBooked: false, isAvailable: true },
      { id: '9', doctorId, date, startTime: '15:00', endTime: '15:30', isBooked: false, isAvailable: true },
      { id: '10', doctorId, date, startTime: '15:30', endTime: '16:00', isBooked: false, isAvailable: true },
      { id: '11', doctorId, date, startTime: '16:00', endTime: '16:30', isBooked: true, isAvailable: false },
      { id: '12', doctorId, date, startTime: '16:30', endTime: '17:00', isBooked: false, isAvailable: true },
    ];

    return slots;
  }
}

export const doctorsService = new DoctorsService();
