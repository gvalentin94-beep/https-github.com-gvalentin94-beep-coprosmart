
import { useState, useEffect } from 'react';
import type { Task, LedgerEntry, User, UserRole, RegisteredUser, UserStatus } from '../types';

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

  // Auth & User Management
  signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string): Promise<void> => {
    if (!email || !password || !firstName || !lastName) throw new Error("Tous les champs sont requis.");
    const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Cet email est déjà utilisé.");
    }
    // New users are pending by default
    const newUser: RegisteredUser = { 
        id: email, 
        email, 
        firstName,
        lastName,
        role, 
        password,
        status: 'pending' 
    };
    localStorage.setItem(usersDbKey, JSON.stringify([...users, newUser]));
    // Do NOT log in automatically. Wait for validation.
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
    
    // Check status (default to 'active' for legacy users in local storage)
    const status = foundUser.status || 'active';
    if (status === 'pending') {
        throw new Error("Compte en attente de validation par le Conseil Syndical.");
    }
    if (status === 'rejected') {
        throw new Error("Demande de compte refusée.");
    }
    if (status === 'deleted') {
        throw new Error("Ce compte a été désactivé.");
    }

    // Create a session user object *without* the password
    const sessionUser: User = { 
        id: foundUser.id, 
        email: foundUser.email, 
        role: foundUser.role,
        firstName: foundUser.firstName || 'Prénom', // Fallback for old data
        lastName: foundUser.lastName || 'Nom',     // Fallback for old data
    };
    localStorage.setItem(userKey, JSON.stringify(sessionUser));
    return sessionUser;
  },
  
  logout: async (): Promise<void> => localStorage.removeItem(userKey),

  // Password Reset Flow
  requestPasswordReset: async (email: string): Promise<string> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (userIndex === -1) throw new Error("Aucun compte associé à cet email.");

      // Generate a simple fake token
      const token = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expires = Date.now() + 3600000; // 1 hour

      users[userIndex].resetToken = token;
      users[userIndex].resetTokenExpires = expires;
      
      localStorage.setItem(usersDbKey, JSON.stringify(users));
      return token; // Return token to simulate email sending
  },

  resetPassword: async (token: string, newPass: string): Promise<void> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      const userIndex = users.findIndex(u => u.resetToken === token);
      
      if (userIndex === -1) throw new Error("Jeton invalide.");
      const user = users[userIndex];

      if (!user.resetTokenExpires || Date.now() > user.resetTokenExpires) {
          throw new Error("Le jeton a expiré.");
      }

      // Update password and clear token
      users[userIndex].password = newPass;
      users[userIndex].resetToken = undefined;
      users[userIndex].resetTokenExpires = undefined;

      localStorage.setItem(usersDbKey, JSON.stringify(users));
  },

  // User Validation (CS/Admin)
  getPendingUsers: async (): Promise<RegisteredUser[]> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      return users.filter(u => u.status === 'pending');
  },

  approveUser: async (email: string): Promise<void> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      const idx = users.findIndex(u => u.email === email);
      if (idx > -1) {
          users[idx].status = 'active';
          localStorage.setItem(usersDbKey, JSON.stringify(users));
      }
  },

  rejectUser: async (email: string): Promise<void> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      // Either delete them or set to rejected. Deleting is cleaner for cleanup.
      const newUsers = users.filter(u => u.email !== email);
      localStorage.setItem(usersDbKey, JSON.stringify(newUsers));
  },

  // Directory & Admin Features
  getDirectory: async (): Promise<RegisteredUser[]> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      // Return all users except pending, but include deleted so admin can restore
      return users.filter(u => u.status !== 'pending');
  },

  updateUserStatus: async (email: string, status: UserStatus): Promise<void> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      const idx = users.findIndex(u => u.email === email);
      if (idx > -1) {
          users[idx].status = status;
          localStorage.setItem(usersDbKey, JSON.stringify(users));
      }
  },

  updateUser: async (email: string, data: Partial<Omit<RegisteredUser, 'id'|'email'|'password'>>): Promise<void> => {
      const users = safeJsonParse<RegisteredUser[]>(usersDbKey, []);
      const idx = users.findIndex(u => u.email === email);
      if (idx > -1) {
          // Merge updates
          users[idx] = { ...users[idx], ...data };
          localStorage.setItem(usersDbKey, JSON.stringify(users));

          // If updating the currently logged-in user, update session storage too
          const currentUser = safeJsonParse<User | null>(userKey, null);
          if (currentUser && currentUser.email === email) {
              const updatedSessionUser: User = {
                  ...currentUser,
                  firstName: users[idx].firstName,
                  lastName: users[idx].lastName,
                  role: users[idx].role
              };
              localStorage.setItem(userKey, JSON.stringify(updatedSessionUser));
          }
      }
  },

  deleteRating: async (taskId: string, ratingIndex: number): Promise<void> => {
      const tasks = safeJsonParse<Task[]>(storageKey, []);
      const taskIdx = tasks.findIndex(t => t.id === taskId);
      if (taskIdx > -1 && tasks[taskIdx].ratings) {
          // Remove rating at index
          tasks[taskIdx].ratings.splice(ratingIndex, 1);
          localStorage.setItem(storageKey, JSON.stringify(tasks));
      }
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const checkUser = () => {
        const userFromStorage = safeJsonParse<User | null>(userKey, null);
        // Simple check to see if data changed to trigger re-render
        setUser(prev => {
             if (JSON.stringify(prev) !== JSON.stringify(userFromStorage)) {
                 return userFromStorage;
             }
             return prev;
        });
    };
    
    checkUser();
    // Listen to storage events to sync across tabs or updates
    window.addEventListener('storage', checkUser);
    // Also poll briefly or create a custom event dispatch if needed, but for now re-mount or manual reload works.
    // Actually, we can just re-run this when needed if we pass a trigger, but let's keep it simple.
    
    return () => window.removeEventListener('storage', checkUser);
  }, []);
  
  return { user, setUser };
}
