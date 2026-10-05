/**
 * The one place transactions and budgets live. Everything is kept on the device in
 * AsyncStorage (localStorage on web) — there is no account and no server, which is also
 * why the listing can honestly declare no permissions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import type { Budgets, Transaction } from '@/lib/money';

const KEY = 'moneymap:v1';

type State = { ready: boolean; transactions: Transaction[]; budgets: Budgets };

type Action =
  | { type: 'load'; transactions: Transaction[]; budgets: Budgets }
  | { type: 'save'; transaction: Transaction }
  | { type: 'remove'; id: string }
  | { type: 'budget'; category: string; amount: number | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return { ready: true, transactions: action.transactions, budgets: action.budgets };
    case 'save': {
      const exists = state.transactions.some((t) => t.id === action.transaction.id);
      return {
        ...state,
        transactions: exists
          ? state.transactions.map((t) => (t.id === action.transaction.id ? action.transaction : t))
          : [...state.transactions, action.transaction],
      };
    }
    case 'remove':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'budget': {
      const budgets = { ...state.budgets };
      if (action.amount === null) delete budgets[action.category];
      else budgets[action.category] = action.amount;
      return { ...state, budgets };
    }
  }
}

type Store = State & {
  saveTransaction: (t: Transaction) => void;
  removeTransaction: (id: string) => void;
  setBudget: (category: string, amount: number | null) => void;
};

const StoreContext = createContext<Store | null>(null);

export function MoneyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { ready: false, transactions: [], budgets: {} });
  const loaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let transactions: Transaction[] = [];
      let budgets: Budgets = {};
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.transactions)) transactions = parsed.transactions;
          if (parsed.budgets && typeof parsed.budgets === 'object') budgets = parsed.budgets;
        }
      } catch {
        // Unreadable storage (private browsing, corrupt JSON) starts the user empty rather than stuck.
      }
      if (!cancelled) dispatch({ type: 'load', transactions, budgets });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    // The first run after loading would only write back what was just read.
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    AsyncStorage.setItem(KEY, JSON.stringify({ transactions: state.transactions, budgets: state.budgets })).catch(() => {});
  }, [state]);

  const value = useMemo<Store>(
    () => ({
      ...state,
      saveTransaction: (transaction) => dispatch({ type: 'save', transaction }),
      removeTransaction: (id) => dispatch({ type: 'remove', id }),
      setBudget: (category, amount) => dispatch({ type: 'budget', category, amount }),
    }),
    [state],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useMoney(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useMoney must be used inside <MoneyProvider>');
  return store;
}
