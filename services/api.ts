
import { useState, useEffect } from 'react';
import type { Task, LedgerEntry, User, UserRole, RegisteredUser } from '../types';

const storageKey = "copro_tasks_v3";
const ledgerKey = "copro_ledger_v3";
const userKey = "copro_user_v3";
const usersDbKey = "copro_users_db_v1";

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

  signUp: async (email: string, password: string, role: UserRole): Promise<User> => {
    if (!email || !password) throw new Error("Email et mot de passe requis.");
    const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Cet email est déjà utilisé.");
    }
    const newUser: RegisteredUser = { id: email, email, role, password };
    localStorage.setItem(usersDbKey, JSON.stringify([...users, newUser]));
    // Automatically log in the new user
    return fakeApi.login(email, password);
  },

  login: async (email: string, password: string): Promise<User> => {
    if (!email || !password) throw new Error("Email et mot de passe requis.");
    const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
        throw new Error("Utilisateur non trouvé.");
    }
    if (foundUser.password !== password) {
        throw new Error("Mot de passe incorrect.");
    }

    // Create a session user object *without* the password
    const sessionUser: User = { id: foundUser.id, email: foundUser.email, role: foundUser.role };
    localStorage.setItem(userKey, JSON.stringify(sessionUser));
    return sessionUser;
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