import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { Driver, DRIVER_POOL, FareBreakdown, ServiceId } from '@/lib/data';

export type TripStatus =
  | 'finding'
  | 'assigned'
  | 'arrived'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type Trip = {
  id: string;
  service: ServiceId;
  serviceTitle: string;
  pickup: string;
  drop: string;
  fare: FareBreakdown;
  status: TripStatus;
  driver?: Driver;
  etaMin?: number;
  otp: string;
  videoBefore: boolean;
  videoAfter: boolean;
  createdAt: number;
  rating?: number;
  tip?: number;
};

type BookingInput = Omit<
  Trip,
  'id' | 'status' | 'otp' | 'videoBefore' | 'videoAfter' | 'createdAt'
>;

export type Role = 'customer' | 'driver' | 'admin';

type AppState = {
  phone: string | null;
  role: Role;
  signIn: (phone: string, role: Role) => void;
  signOut: () => void;
  walletBalance: number;
  trips: Trip[];
  activeTrip: Trip | null;
  bookTrip: (input: BookingInput) => string;
  cancelTrip: (id: string) => void;
  finishTrip: (id: string, rating: number, tip: number) => void;
};

const AppContext = createContext<AppState | null>(null);

const SEED_TRIPS: Trip[] = [
  {
    id: 'past-2',
    service: 'hourly',
    serviceTitle: 'Hourly Driver',
    pickup: 'Vijay Nagar, Indore',
    drop: 'Sarafa Bazaar, Indore',
    fare: { lines: [], total: 447 },
    status: 'completed',
    driver: DRIVER_POOL[1],
    otp: '4821',
    videoBefore: true,
    videoAfter: true,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    rating: 5,
  },
  {
    id: 'past-1',
    service: 'outstation',
    serviceTitle: 'Outstation',
    pickup: 'Indore',
    drop: 'Ujjain',
    fare: { lines: [], total: 1420 },
    status: 'completed',
    driver: DRIVER_POOL[2],
    otp: '9034',
    videoBefore: true,
    videoAfter: true,
    createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
    rating: 4,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('customer');
  const [walletBalance, setWalletBalance] = useState(250);
  const [trips, setTrips] = useState<Trip[]>(SEED_TRIPS);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});

  const updateTrip = useCallback((id: string, patch: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const clearTimers = useCallback((id: string) => {
    (timers.current[id] ?? []).forEach(clearTimeout);
    delete timers.current[id];
  }, []);

  // Simulated dispatch: replace with realtime backend (WebSocket) later.
  const bookTrip = useCallback(
    (input: BookingInput) => {
      const id = `trip-${Date.now()}`;
      const trip: Trip = {
        ...input,
        id,
        status: 'finding',
        otp: String(Math.floor(1000 + Math.random() * 9000)),
        videoBefore: false,
        videoAfter: false,
        createdAt: Date.now(),
      };
      setTrips((prev) => [trip, ...prev]);

      const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
      const schedule: [number, () => void][] = [
        [4000, () => updateTrip(id, { status: 'assigned', driver, etaMin: 6 })],
        [9000, () => updateTrip(id, { etaMin: 3 })],
        [14000, () => updateTrip(id, { status: 'arrived', etaMin: 0, videoBefore: true })],
        [22000, () => updateTrip(id, { status: 'ongoing' })],
        [36000, () => updateTrip(id, { status: 'completed', videoAfter: true })],
      ];
      timers.current[id] = schedule.map(([ms, fn]) => setTimeout(fn, ms));
      return id;
    },
    [updateTrip]
  );

  const cancelTrip = useCallback(
    (id: string) => {
      clearTimers(id);
      updateTrip(id, { status: 'cancelled' });
    },
    [clearTimers, updateTrip]
  );

  const finishTrip = useCallback(
    (id: string, rating: number, tip: number) => {
      clearTimers(id);
      updateTrip(id, { rating, tip });
      if (tip > 0) setWalletBalance((b) => Math.max(b - tip, 0));
    },
    [clearTimers, updateTrip]
  );

  const activeTrip = useMemo(
    () =>
      trips.find(
        (t) => !['completed', 'cancelled'].includes(t.status) || (t.status === 'completed' && t.rating === undefined)
      ) ?? null,
    [trips]
  );

  const value = useMemo<AppState>(
    () => ({
      phone,
      role,
      signIn: (p: string, r: Role) => {
        setPhone(p);
        setRole(r);
      },
      signOut: () => setPhone(null),
      walletBalance,
      trips,
      activeTrip,
      bookTrip,
      cancelTrip,
      finishTrip,
    }),
    [phone, role, walletBalance, trips, activeTrip, bookTrip, cancelTrip, finishTrip]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
