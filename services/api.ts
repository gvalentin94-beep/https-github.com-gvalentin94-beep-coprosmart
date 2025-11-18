import { useState, useEffect } from 'react';
import type { Task, LedgerEntry, User, UserRole } from '../types';

const storageKey = "copro_tasks_v3";
const ledgerKey = "copro_ledger_v3";
const userKey = "copro_user_v3";

// Helper to safely parse JSON from localStorage, returning a default value and clearing if corrupt.
const safeJsonParse = <T>(key: string, defaultValue: T): T => {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    try {
        return JSON.parse(raw) as T;
    } catch (e) {
        console.error(`Failed to parse localStorage item "${key}", removing it.`, e);
        localStorage.removeItem(key);
        return defaultValue;
    }
};

export const fakeApi = {
  readTasks: async (): Promise<Task[]> => safeJsonParse<Task[]>(storageKey, []),
  writeTasks: async (tasks: Task[]): Promise<void> =>
    localStorage.setItem(storageKey, JSON.stringify(tasks)),
  readLedger: async (): Promise<LedgerEntry[]> => safeJsonParse<LedgerEntry[]>(ledgerKey, []),
  writeLedger: async (entries: LedgerEntry[]): Promise<void> =>
    localStorage.setItem(ledgerKey, JSON.stringify(entries)),
  login: async (email: string, role: UserRole): Promise<User> => {
    if (!email) throw new Error("Email requis");
    const user = { id: email, email, role };
    localStorage.setItem(userKey, JSON.stringify(user));
    return user;
  },
  logout: async (): Promise<void> => localStorage.removeItem(userKey),
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const userFromStorage = safeJsonParse<User | null>(userKey, null);
    if (userFromStorage) {
        setUser(userFromStorage);
    }
  }, []);
  
  return { user, setUser };
}