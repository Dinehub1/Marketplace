import { apiService, ApiResponse, PaginatedResponse } from './apiService';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'follow_up' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  symptoms: string;
  notes?: string;
  consultationFee: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentId?: string;
  prescription?: string;
  diagnosis?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentData {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: 'consultation' | 'follow_up' | 'emergency';
  symptoms: string;
  notes?: string;
}

export interface AppointmentFilters {
  status?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

class AppointmentsService {
  // Create new appointment
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      console.info('📅 Creating appointment:', data);

      // For development, return mock appointment
      if (process.env.NODE_ENV === 'development') {
        return this.createMockAppointment(data);
      }

      const response = await apiService.post<ApiResponse<Appointment>>(
        '/appointments',
        data
      );

      if (!response.data) {
        throw new Error('Failed to create appointment');
      }

      console.info('✅ Appointment created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating appointment:', error);
      // Fallback to mock for demo
      return this.createMockAppointment(data);
    }
  }

  // Get user's appointments
  async getUserAppointments(
    userId: string,
    filters: AppointmentFilters = {}
  ): Promise<PaginatedResponse<Appointment>> {
    try {
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockAppointments(userId, filters);
      }

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await apiService.get<PaginatedResponse<Appointment>>(
        `/users/${userId}/appointments?${queryParams.toString()}`
      );

      return response;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return this.getMockAppointments(userId, filters);
    }
  }

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment> {
    try {
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return this.getMockAppointmentById(id);
      }

      const response = await apiService.get<ApiResponse<Appointment>>(
        `/appointments/${id}`
      );

      if (!response.data) {
        throw new Error('Appointment not found');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      return this.getMockAppointmentById(id);
    }
  }

  // Update appointment status
  async updateAppointmentStatus(
    id: string,
    status: Appointment['status']
  ): Promise<Appointment> {
    try {
      console.info(`📅 Updating appointment ${id} status to:`, status);

      // For development, return mock updated appointment
      if (process.env.NODE_ENV === 'development') {
        const appointment = this.getMockAppointmentById(id);
        return { ...appointment, status, updatedAt: new Date().toISOString() };
      }

      const response = await apiService.put<ApiResponse<Appointment>>(
        `/appointments/${id}/status`,
        { status }
      );

      if (!response.data) {
        throw new Error('Failed to update appointment');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    try {
      console.info(`📅 Cancelling appointment ${id}:`, reason);

      const response = await apiService.put<ApiResponse<Appointment>>(
        `/appointments/${id}/cancel`,
        { reason }
      );

      if (!response.data) {
        throw new Error('Failed to cancel appointment');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      throw error;
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string
  ): Promise<Appointment> {
    try {
      console.info(`📅 Rescheduling appointment ${id}:`, { newDate, newTime });

      const response = await apiService.put<ApiResponse<Appointment>>(
        `/appointments/${id}/reschedule`,
        { appointmentDate: newDate, appointmentTime: newTime }
      );

      if (!response.data) {
        throw new Error('Failed to reschedule appointment');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error rescheduling appointment:', error);
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(userId: string): Promise<AppointmentStats> {
    try {
      // For development, return mock stats
      if (process.env.NODE_ENV === 'development') {
        return {
          total: 12,
          scheduled: 3,
          confirmed: 2,
          completed: 6,
          cancelled: 1,
        };
      }

      const response = await apiService.get<ApiResponse<AppointmentStats>>(
        `/users/${userId}/appointments/stats`
      );

      return response.data || {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      return {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  }

  // Mock data methods for development
  private createMockAppointment(data: CreateAppointmentData): Appointment {
    const mockAppointment: Appointment = {
      id: `apt_${Date.now()}`,
      patientId: 'demo',
      doctorId: data.doctorId,
      doctorName: 'Dr. Sarah Johnson',
      doctorSpecialty: 'Dermatology',
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      appointmentType: data.appointmentType,
      status: 'scheduled',
      symptoms: data.symptoms,
      notes: data.notes,
      consultationFee: 150,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate saving to storage for demo
    this.saveMockAppointment(mockAppointment);

    return mockAppointment;
  }

  private getMockAppointments(
    userId: string,
    filters: AppointmentFilters
  ): PaginatedResponse<Appointment> {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patientId: userId,
        doctorId: '1',
        doctorName: 'Dr. Sarah Johnson',
        doctorSpecialty: 'Dermatology',
        appointmentDate: '2025-01-30',
        appointmentTime: '14:30',
        appointmentType: 'consultation',
        status: 'scheduled',
        symptoms: 'Skin rash and irritation',
        consultationFee: 150,
        paymentStatus: 'pending',
        createdAt: '2025-01-20T10:00:00Z',
        updatedAt: '2025-01-20T10:00:00Z',
      },
      {
        id: '2',
        patientId: userId,
        doctorId: '2',
        doctorName: 'Dr. Michael Brown',
        doctorSpecialty: 'Cardiology',
        appointmentDate: '2025-02-02',
        appointmentTime: '10:00',
        appointmentType: 'follow_up',
        status: 'confirmed',
        symptoms: 'Follow-up for heart condition',
        consultationFee: 200,
        paymentStatus: 'paid',
        paymentId: 'pay_123456',
        createdAt: '2025-01-18T15:30:00Z',
        updatedAt: '2025-01-19T09:00:00Z',
      },
      {
        id: '3',
        patientId: userId,
        doctorId: '3',
        doctorName: 'Dr. Emily Davis',
        doctorSpecialty: 'Pediatrics',
        appointmentDate: '2025-01-15',
        appointmentTime: '16:00',
        appointmentType: 'consultation',
        status: 'completed',
        symptoms: 'Regular checkup',
        consultationFee: 120,
        paymentStatus: 'paid',
        paymentId: 'pay_789012',
        diagnosis: 'Healthy development, no concerns',
        prescription: 'Continue regular diet and exercise',
        createdAt: '2025-01-10T12:00:00Z',
        updatedAt: '2025-01-15T17:00:00Z',
      },
    ];

    // Get any stored mock appointments
    const storedAppointments = this.getStoredMockAppointments();
    const allAppointments = [...mockAppointments, ...storedAppointments];

    // Apply filters
    let filteredAppointments = allAppointments.filter(
      apt => apt.patientId === userId
    );

    if (filters.status && filters.status !== 'All') {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.status.toLowerCase() === filters.status!.toLowerCase()
      );
    }

    if (filters.doctorId) {
      filteredAppointments = filteredAppointments.filter(
        apt => apt.doctorId === filters.doctorId
      );
    }

    // Sort by date (newest first)
    filteredAppointments.sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

    return {
      data: paginatedAppointments,
      total: filteredAppointments.length,
      page,
      pageSize: limit,
      hasMore: endIndex < filteredAppointments.length,
    };
  }

  private getMockAppointmentById(id: string): Appointment {
    const allAppointments = [
      ...this.getMockAppointments('demo', {}).data,
      ...this.getStoredMockAppointments(),
    ];
    
    const appointment = allAppointments.find(apt => apt.id === id);
    
    if (!appointment) {
      throw new Error(`Appointment with ID ${id} not found`);
    }
    
    return appointment;
  }

  // Simple localStorage-based storage for demo appointments
  private saveMockAppointment(appointment: Appointment): void {
    try {
      const stored = this.getStoredMockAppointments();
      stored.push(appointment);
      localStorage.setItem('mockAppointments', JSON.stringify(stored));
    } catch (error) {
      console.warn('Could not save mock appointment to storage:', error);
    }
  }

  private getStoredMockAppointments(): Appointment[] {
    try {
      const stored = localStorage.getItem('mockAppointments');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Could not load mock appointments from storage:', error);
      return [];
    }
  }
}

export const appointmentsService = new AppointmentsService();
