import { dbConfig, sql } from '../db/config';

// Base API service with common functionality
class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  // Generic HTTP request wrapper
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      console.info(`📡 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.info(`✅ API Response: ${url}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${url}`, error);
      throw error;
    }
  }

  // Database query wrapper for Neon
  private async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      console.info('🗄️ Database Query:', query, params);
      const result = await (sql as any)(query, params);
      console.info('✅ Database Result:', result);
      return result as T[];
    } catch (error) {
      console.error('❌ Database Error:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }

  // Database operations
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.executeQuery<T>(sql, params);
  }
}

export const apiService = new ApiService();

// Error types for consistent error handling
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiException extends Error implements ApiError {
  status?: number;
  code?: string;
  details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
