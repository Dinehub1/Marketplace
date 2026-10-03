import { sql } from '../db/config';

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'patient' | 'doctor';
  phone?: string;
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Doctor extends User {
  specialization: string;
  licenseNumber: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  rating?: number;
  totalReviews?: number;
  bio?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  appointmentType: 'consultation' | 'follow_up' | 'emergency';
  symptoms?: string;
  notes?: string;
  createdAt: string;
}

// Auth API
export const authAPI = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // TODO: Implement actual authentication with password hashing
      const result = await sql`
        SELECT u.*, dp.specialization, dp.license_number, dp.consultation_fee, dp.rating, dp.total_reviews, dp.bio
        FROM users u
        LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
        WHERE u.email = ${email} AND u.is_active = true
        LIMIT 1
      `;

      if (result.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result[0];
      const token = 'mock_jwt_token'; // TODO: Generate actual JWT

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          phone: user.phone,
          profileImage: user.profile_image_url,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        token,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType: 'patient' | 'doctor';
    phone: string;
  }): Promise<{ user: User; token: string }> {
    try {
      // TODO: Hash password before storing
      const result = await sql`
        INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone)
        VALUES (${userData.email}, ${userData.password}, ${userData.userType}, ${userData.firstName}, ${userData.lastName}, ${userData.phone})
        RETURNING *
      `;

      const user = result[0];
      const token = 'mock_jwt_token'; // TODO: Generate actual JWT

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: user.user_type,
          phone: user.phone,
          profileImage: user.profile_image_url,
          isVerified: user.is_verified,
          createdAt: user.created_at,
        },
        token,
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
};

// Doctors API
export const doctorsAPI = {
  async getDoctors(filters?: {
    specialization?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Doctor[]> {
    try {
      let query = sql`
        SELECT u.*, dp.specialization, dp.license_number, dp.years_of_experience, 
               dp.consultation_fee, dp.rating, dp.total_reviews, dp.bio
        FROM users u
        INNER JOIN doctor_profiles dp ON u.id = dp.user_id
        WHERE u.user_type = 'doctor' AND u.is_active = true
      `;

      if (filters?.specialization) {
        query = sql`${query} AND dp.specialization ILIKE ${'%' + filters.specialization + '%'}`;
      }

      if (filters?.search) {
        query = sql`${query} AND (u.first_name ILIKE ${'%' + filters.search + '%'} OR u.last_name ILIKE ${'%' + filters.search + '%'} OR dp.specialization ILIKE ${'%' + filters.search + '%'})`;
      }

      query = sql`${query} ORDER BY dp.rating DESC, dp.total_reviews DESC`;

      if (filters?.limit) {
        query = sql`${query} LIMIT ${filters.limit}`;
      }

      if (filters?.offset) {
        query = sql`${query} OFFSET ${filters.offset}`;
      }

      const result = await query;

      return result.map((doctor: any) => ({
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        userType: doctor.user_type,
        phone: doctor.phone,
        profileImage: doctor.profile_image_url,
        isVerified: doctor.is_verified,
        createdAt: doctor.created_at,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        consultationFee: doctor.consultation_fee,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        bio: doctor.bio,
      }));
    } catch (error) {
      console.error('Get doctors error:', error);
      throw error;
    }
  },

  async getDoctorById(doctorId: string): Promise<Doctor | null> {
    try {
      const result = await sql`
        SELECT u.*, dp.specialization, dp.license_number, dp.years_of_experience, 
               dp.consultation_fee, dp.rating, dp.total_reviews, dp.bio
        FROM users u
        INNER JOIN doctor_profiles dp ON u.id = dp.user_id
        WHERE u.id = ${doctorId} AND u.user_type = 'doctor' AND u.is_active = true
        LIMIT 1
      `;

      if (result.length === 0) {
        return null;
      }

      const doctor = result[0];
      return {
        id: doctor.id,
        email: doctor.email,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        userType: doctor.user_type,
        phone: doctor.phone,
        profileImage: doctor.profile_image_url,
        isVerified: doctor.is_verified,
        createdAt: doctor.created_at,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        consultationFee: doctor.consultation_fee,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        bio: doctor.bio,
      };
    } catch (error) {
      console.error('Get doctor by ID error:', error);
      throw error;
    }
  },
};

// Appointments API
export const appointmentsAPI = {
  async getAppointments(userId: string, userType: 'patient' | 'doctor'): Promise<Appointment[]> {
    try {
      const column = userType === 'patient' ? 'patient_id' : 'doctor_id';
      
      const result = await sql`
        SELECT a.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               d.first_name as doctor_first_name, d.last_name as doctor_last_name,
               dp.specialization
        FROM appointments a
        INNER JOIN users p ON a.patient_id = p.id
        INNER JOIN users d ON a.doctor_id = d.id
        INNER JOIN doctor_profiles dp ON d.id = dp.user_id
        WHERE a.${(sql as any)(column)} = ${userId}
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;

      return result.map((appointment: any) => ({
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        status: appointment.status,
        appointmentType: appointment.appointment_type,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        createdAt: appointment.created_at,
      }));
    } catch (error) {
      console.error('Get appointments error:', error);
      throw error;
    }
  },

  async createAppointment(appointmentData: {
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: 'consultation' | 'follow_up' | 'emergency';
    symptoms?: string;
  }): Promise<Appointment> {
    try {
      const result = await sql`
        INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, appointment_type, symptoms)
        VALUES (${appointmentData.patientId}, ${appointmentData.doctorId}, ${appointmentData.appointmentDate}, ${appointmentData.appointmentTime}, ${appointmentData.appointmentType}, ${appointmentData.symptoms || ''})
        RETURNING *
      `;

      const appointment = result[0];
      return {
        id: appointment.id,
        patientId: appointment.patient_id,
        doctorId: appointment.doctor_id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        status: appointment.status,
        appointmentType: appointment.appointment_type,
        symptoms: appointment.symptoms,
        notes: appointment.notes,
        createdAt: appointment.created_at,
      };
    } catch (error) {
      console.error('Create appointment error:', error);
      throw error;
    }
  },
};
