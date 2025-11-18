
import { useState, useEffect } from 'react';
import type { Task, LedgerEntry, User, UserRole } from '../types';

const storageKey = "copro_tasks_v3";
const ledgerKey = "copro_ledger_v3";
const userKey = "copro_user_v3";

export const fakeApi = {
  readTasks: async (): Promise<Task[]> => JSON.parse(localStorage.getItem(storageKey) || "[]"),
  writeTasks: async (tasks: Task[]): Promise<void> =>
    localStorage.setItem(storageKey, JSON.stringify(tasks)),
  readLedger: async (): Promise<LedgerEntry[]> => JSON.parse(localStorage.getItem(ledgerKey) || "[]"),
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
    const raw = localStorage.getItem(userKey);
    if (raw) {
      try {
        setUser(JSON.parse(raw) as User);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem(userKey);
      }
    }
  }, []);
  
  return { user, setUser };
}
