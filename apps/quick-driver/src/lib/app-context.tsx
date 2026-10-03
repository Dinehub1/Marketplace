import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Driver, DRIVER_POOL, FareBreakdown, ServiceId } from '@/lib/data';
import { supabase } from '@/lib/supabase';

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

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

function rowToTrip(row: any): Trip {
  let driver: Driver | undefined = undefined;
  if (row.driver) {
    driver = {
      id: row.driver.id,
      name: row.driver.name,
      rating: Number(row.driver.rating) || 4.9,
      trips: row.driver.trips || row.driver.total_rides || 0,
      totalRides: row.driver.total_rides || 0,
      years: row.driver.years || 5,
      carType: (row.driver.car_preference as any) || 'all',
      phone: row.driver.phone || '',
    };
  }

  return {
    id: row.id,
    service: row.service as ServiceId,
    serviceTitle: row.service_title,
    pickup: row.pickup,
    drop: row.drop_location,
    fare: row.fare_breakdown || { lines: [], total: Number(row.fare_total) || 0 },
    status: row.status as TripStatus,
    driver,
    etaMin: row.status === 'assigned' ? 6 : row.status === 'arrived' ? 0 : undefined,
    otp: row.otp || '1234',
    videoBefore: !!row.video_before_url,
    videoAfter: !!row.video_after_url,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    rating: row.rating ?? undefined,
    tip: row.tip ? Number(row.tip) : undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('customer');
  const [walletBalance, setWalletBalance] = useState(250);
  const [trips, setTrips] = useState<Trip[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>[]>>({});

  // 1. Initial auth state and trips fetch from Supabase
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (session?.user) {
          const userPhone = session.user.phone || session.user.user_metadata?.phone || null;
          if (userPhone) setPhone(userPhone.replace('+91', ''));

          // Load profile role
          const { data: profile } = await supabase
            .from('qd_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile?.role) {
            setRole(profile.role as Role);
          }
          if (profile?.wallet_balance) {
            setWalletBalance(Number(profile.wallet_balance));
          }

          // Fetch user's existing trips from Supabase
          const { data: dbTrips, error: tripsErr } = await supabase
            .from('qd_trips')
            .select('*, driver:qd_drivers(*)')
            .order('created_at', { ascending: false });

          if (!tripsErr && dbTrips && dbTrips.length > 0) {
            setTrips(dbTrips.map(rowToTrip));
          }
        }
      } catch (err) {
        console.warn('Error loading initial QuickDriver data:', err);
      }
    }

    loadInitialData();

    // 2. Realtime listener for live trip updates (finding -> assigned -> arrived -> ongoing -> completed)
    const channel = supabase
      .channel('qd_trips_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qd_trips' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            // Fetch associated driver details if assigned
            if (newRow.driver_id) {
              const { data: driverData } = await supabase
                .from('qd_drivers')
                .select('*')
                .eq('id', newRow.driver_id)
                .single();
              newRow.driver = driverData;
            }
            const incomingTrip = rowToTrip(newRow);
            setTrips((prev) => [
              incomingTrip,
              ...prev.filter((t) => t.id !== incomingTrip.id),
            ]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            if (updatedRow.driver_id) {
              const { data: driverData } = await supabase
                .from('qd_drivers')
                .select('*')
                .eq('id', updatedRow.driver_id)
                .single();
              updatedRow.driver = driverData;
            }
            const updatedTrip = rowToTrip(updatedRow);
            setTrips((prev) =>
              prev.map((t) => (t.id === updatedTrip.id ? { ...t, ...updatedTrip } : t))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any).id;
            setTrips((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTrip = useCallback((id: string, patch: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const clearTimers = useCallback((id: string) => {
    (timers.current[id] ?? []).forEach(clearTimeout);
    delete timers.current[id];
  }, []);

  // 3. Book Trip: Creates in Supabase, emits realtime event, with local optimistic UI
  const bookTrip = useCallback(
    (input: BookingInput) => {
      const tripId = generateUUID();
      const otp = String(Math.floor(1000 + Math.random() * 9000));

      const optimisticTrip: Trip = {
        ...input,
        id: tripId,
        status: 'finding',
        otp,
        videoBefore: false,
        videoAfter: false,
        createdAt: Date.now(),
      };

      setTrips((prev) => [optimisticTrip, ...prev]);

      // Fire Supabase Insert in background
      (async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id || null;

          const { error } = await supabase.from('qd_trips').insert({
            id: tripId,
            customer_id: userId,
            service: input.service,
            service_title: input.serviceTitle,
            pickup: input.pickup,
            drop_location: input.drop,
            fare_total: input.fare.total,
            fare_breakdown: input.fare,
            status: 'finding',
            otp,
          });

          if (error) {
            console.warn('Supabase booking error:', error.message);
          }
        } catch (err) {
          console.warn('Failed to persist trip to Supabase:', err);
        }
      })();

      // Local simulated progression fallback if testing in standalone mode
      const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)];
      const schedule: [number, () => void][] = [
        [
          5000,
          () => {
            updateTrip(tripId, { status: 'assigned', driver, etaMin: 6 });
            supabase
              .from('qd_trips')
              .update({ status: 'assigned', eta_min: 6 })
              .eq('id', tripId)
              .then(undefined, () => {});
          },
        ],
        [
          12000,
          () => {
            updateTrip(tripId, { status: 'arrived', etaMin: 0, videoBefore: true });
            supabase
              .from('qd_trips')
              .update({ status: 'arrived' })
              .eq('id', tripId)
              .then(undefined, () => {});
          },
        ],
      ];

      timers.current[tripId] = schedule.map(([ms, fn]) => setTimeout(fn, ms));
      return tripId;
    },
    [updateTrip]
  );

  const cancelTrip = useCallback(
    (id: string) => {
      clearTimers(id);
      updateTrip(id, { status: 'cancelled' });
      supabase
        .from('qd_trips')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .then(undefined, () => {});
    },
    [clearTimers, updateTrip]
  );

  const finishTrip = useCallback(
    (id: string, rating: number, tip: number) => {
      clearTimers(id);
      updateTrip(id, { rating, tip, status: 'completed' });
      if (tip > 0) setWalletBalance((b) => Math.max(b - tip, 0));
      supabase
        .from('qd_trips')
        .update({ status: 'completed', rating, tip })
        .eq('id', id)
        .then(undefined, () => {});
    },
    [clearTimers, updateTrip]
  );

  const activeTrip = useMemo(
    () =>
      trips.find(
        (t) =>
          !['completed', 'cancelled'].includes(t.status) ||
          (t.status === 'completed' && t.rating === undefined)
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
      signOut: async () => {
        await supabase.auth.signOut().catch(() => {});
        setPhone(null);
      },
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
