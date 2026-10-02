// Environment variables configuration
export const ENV = {
  SUPABASE_URL: (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim(),
  SUPABASE_ANON_KEY: (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
  
  // Feature flags
  ENABLE_OFFLINE_MODE: true,
  ENABLE_REALTIME: true,
  
  // App settings
  OTP_EXPIRY_MINUTES: 10,
  VISITOR_OTP_LENGTH: 6,
  MAX_PHOTO_SIZE_MB: 5,
};

// Validate environment variables
export function validateEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing);
    console.warn('Please create .env.local with Supabase credentials');
  }
  
  return missing.length === 0;
}
