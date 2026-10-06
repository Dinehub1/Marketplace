// Indian mobile number handling shared by the auth functions.

/** Nextel wants 12 digits, 91 first. Supabase Auth may store the number with or without the plus. */
export function nextelNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  return null;
}
