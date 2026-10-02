export type ServiceId = 'instant' | 'hourly' | 'daily' | 'outstation' | 'corporate';

export type Service = {
  id: ServiceId;
  title: string;
  tagline: string;
  icon: string;
  priceFrom: string;
  unit: 'km' | 'hours' | 'days';
};

export const SERVICES: Service[] = [
  {
    id: 'instant',
    title: 'Instant Ride',
    tagline: 'Point-to-point in your own car',
    icon: '⚡️',
    priceFrom: 'from ₹99',
    unit: 'km',
  },
  {
    id: 'hourly',
    title: 'Hourly Driver',
    tagline: 'Errands, shopping, city travel',
    icon: '⏱',
    priceFrom: '₹149/hr',
    unit: 'hours',
  },
  {
    id: 'daily',
    title: 'Daily Driver',
    tagline: 'Full-day professional (12 hrs)',
    icon: '📅',
    priceFrom: '₹1,099/day',
    unit: 'days',
  },
  {
    id: 'outstation',
    title: 'Outstation',
    tagline: 'Bhopal, Ujjain, Mhow & MP-wide',
    icon: '🛣',
    priceFrom: '₹14/km',
    unit: 'km',
  },
  {
    id: 'corporate',
    title: 'Corporate',
    tagline: 'Monthly billing for your team',
    icon: '💼',
    priceFrom: 'custom',
    unit: 'days',
  },
];

export type Promo = {
  code: string;
  title: string;
  detail: string;
  /** returns discount in ₹ for a given pre-discount fare */
  discount: (fare: number, night: boolean) => number;
};

export const PROMOS: Promo[] = [
  {
    code: 'QDNEW50',
    title: '50% off your first ride',
    detail: 'Up to ₹150 off. New users only.',
    discount: (fare) => Math.min(Math.round(fare * 0.5), 150),
  },
  {
    code: 'QD100',
    title: 'Flat ₹100 off',
    detail: 'On fares above ₹499.',
    discount: (fare) => (fare > 499 ? 100 : 0),
  },
  {
    code: 'NIGHTFREE',
    title: 'Night surcharge waived',
    detail: 'No ₹150 night fee, 10 PM – 6 AM.',
    discount: (_fare, night) => (night ? NIGHT_SURCHARGE : 0),
  },
];

export const NIGHT_SURCHARGE = 150;
export const INSURANCE_FEE = 100;

export type FareInput = {
  service: ServiceId;
  km: number;
  hours: number;
  night: boolean;
  insurance: boolean;
  promo?: Promo;
};

export type FareBreakdown = {
  lines: { label: string; amount: number }[];
  total: number;
};

export function calcFare(input: FareInput): FareBreakdown {
  const lines: { label: string; amount: number }[] = [];

  switch (input.service) {
    case 'instant':
      lines.push({ label: 'Base fare', amount: 99 });
      lines.push({ label: `Distance · ${input.km} km × ₹32`, amount: input.km * 32 });
      break;
    case 'hourly':
      lines.push({ label: `Driver time · ${input.hours} hr × ₹149`, amount: input.hours * 149 });
      break;
    case 'daily':
      lines.push({ label: 'Full day (12 hrs)', amount: 1099 });
      break;
    case 'outstation':
      lines.push({ label: `Round trip · ${input.km} km × ₹14`, amount: input.km * 14 });
      lines.push({ label: 'Driver allowance', amount: 300 });
      break;
    case 'corporate':
      lines.push({ label: 'Billed monthly to company', amount: 0 });
      break;
  }

  if (input.night) lines.push({ label: 'Night surcharge (10 PM – 6 AM)', amount: NIGHT_SURCHARGE });
  if (input.insurance) lines.push({ label: 'Trip insurance', amount: INSURANCE_FEE });

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discount = input.promo ? input.promo.discount(subtotal, input.night) : 0;
  if (discount > 0) lines.push({ label: `Promo ${input.promo!.code}`, amount: -discount });

  return { lines, total: Math.max(subtotal - discount, 0) };
}

export type Driver = {
  name: string;
  rating: number;
  trips: number;
  years: number;
};

export const DRIVER_POOL: Driver[] = [
  { name: 'Ramesh Verma', rating: 4.9, trips: 1240, years: 8 },
  { name: 'Sunil Patel', rating: 4.8, trips: 860, years: 6 },
  { name: 'Arjun Singh', rating: 5.0, trips: 2110, years: 11 },
  { name: 'Vikas Sharma', rating: 4.9, trips: 1530, years: 9 },
];

export const SAVED_PLACES = [
  { label: 'Home', address: 'Vijay Nagar, Indore' },
  { label: 'Work', address: 'AB Road, Indore' },
];

export function inr(amount: number) {
  return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
}

export function isNightNow() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}
