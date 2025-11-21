
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import type { User, RegisteredUser, Task, LedgerEntry, Bid, Rating, UserRole } from '../types';

// Safe initialization of Supabase client
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: any = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.error("Failed to init Supabase", e);
    }
}

export const supabase = supabaseInstance;

// Hook for auth
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
        setLoading(false);
        return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
         fetchProfile(session.user.email || '').then(u => setUser(u)).catch(() => setUser(null));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (event === 'PASSWORD_RECOVERY') {
          setRecoveryMode(true);
      }
      
      if (session?.user) {
        fetchProfile(session.user.email || '').then(u => setUser(u));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, setUser, loading, recoveryMode, setRecoveryMode };
}

async function fetchProfile(email: string): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
    
    if (error || !data) return null;
    
    return {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role
    };
}

export const api = {
    login: async (email: string, password: string): Promise<User> => {
        if (!supabase) throw new Error("Base de données non connectée.");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user?.email) throw new Error("No email found");
        
        // Auto-repair profile if missing
        let profile = await fetchProfile(data.user.email);
        if (!profile) {
             await supabase.from('profiles').insert({
                id: data.user.id,
                email: data.user.email,
                first_name: 'Nouveau',
                last_name: 'Membre',
                role: 'owner',
                status: 'pending'
            });
            profile = await fetchProfile(data.user.email);
        }
        
        if (!profile) throw new Error("Profile introuvable après tentative de création.");
        
        // Check status
        const status = (profile as any).status || 'active'; // default to active for old accounts
        if (status === 'pending') throw new Error("Votre compte est en attente de validation par le Conseil Syndical.");
        if (status === 'rejected') throw new Error("Votre demande d'inscription a été refusée.");
        if (status === 'deleted') {
             // Auto-restore admin
             if (profile.role === 'admin') {
                 await supabase.from('profiles').update({ status: 'active' }).eq('id', profile.id);
                 return profile;
             }
             throw new Error("Ce compte a été désactivé.");
        }

        return profile;
    },

    signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string): Promise<void> => {
        if (!supabase) throw new Error("Base de données non connectée.");
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });
        if (authError) throw authError;

        if (authData.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: authData.user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    role,
                    status: 'pending'
                });
             
             if (profileError) {
                 if (profileError.code === '23505') { // Unique violation
                     // Profile exists? update it
                 } else {
                    throw profileError;
                 }
             }
        }
    },
    
    requestPasswordReset: async (email: string): Promise<void> => {
        if (!supabase) throw new Error("Base de données non connectée.");
        // Use real Supabase Auth flow -> sends email with link
        // The link will redirect to the app, triggering 'PASSWORD_RECOVERY' event
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // Redirects back to this app
        });
        if (error) throw error;
    },

    resetPassword: async (password: string): Promise<void> => {
        if (!supabase) throw new Error("Base de données non connectée.");
        // Updates the password for the currently logged-in user (which happens after clicking the email link)
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },
    
    readTasks: async (): Promise<Task[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        
        return data.map((t: any) => ({
            id: t.id,
            title: t.title,
            category: t.category,
            scope: t.scope,
            details: t.details,
            location: t.location,
            startingPrice: t.starting_price,
            warrantyDays: t.warranty_days,
            status: t.status,
            createdBy: t.created_by_email || 'unknown', 
            createdById: t.created_by,
            createdAt: t.created_at,
            bids: t.bids || [],
            ratings: t.ratings || [],
            deletedRatings: t.deleted_ratings || [],
            approvals: t.approvals || [],
            rejections: t.rejections || [],
            awardedTo: t.awarded_to_email,
            awardedToId: t.awarded_to,
            awardedAmount: t.awarded_amount,
            completionAt: t.completion_at,
            biddingStartedAt: t.bidding_started_at,
            photo: t.photo,
            validatedBy: t.validated_by
        }));
    },

    readLedger: async (): Promise<LedgerEntry[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('ledger').select('*').order('at', { ascending: false });
        if (error) throw error;
        return data.map((l: any) => ({
            id: l.id,
            taskId: l.task_id,
            type: l.type,
            payer: l.payer_email, 
            payee: l.payee_email,
            amount: l.amount,
            at: l.at,
            taskTitle: l.task_title,
            taskCreator: l.task_creator
        }));
    },

    getPendingUsers: async (): Promise<RegisteredUser[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('profiles').select('*').eq('status', 'pending');
        if (error) throw error;
        return data.map((u: any) => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            status: u.status
        }));
    },

    getAllUsers: async (): Promise<RegisteredUser[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data.map((u: any) => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            status: u.status
        }));
    },
    
    getDirectory: async (): Promise<RegisteredUser[]> => {
        if (!supabase) return [];
        // Removed .neq('status', 'pending') and .neq('role', 'admin') as requested
        // to show everyone except admin, regardless of status.
        const { data, error } = await supabase.from('profiles').select('*').neq('role', 'admin');
        if (error) throw error;
        return data.map((u: any) => ({
             id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            status: u.status
        }));
    },

    createTask: async (task: Partial<Task>, userId: string): Promise<void> => {
        const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).single();
        
        const dbTask = {
            title: task.title,
            category: task.category,
            scope: task.scope,
            details: task.details,
            location: task.location,
            starting_price: task.startingPrice,
            warranty_days: task.warrantyDays,
            status: task.status,
            created_by: userId,
            created_by_email: user?.email,
            photo: task.photo,
            bids: [],
            ratings: [],
            approvals: [],
            rejections: []
        };
        const { error } = await supabase.from('tasks').insert(dbTask);
        if (error) throw error;
    },

    updateTaskStatus: async (taskId: string, status: string, extra: any = {}): Promise<void> => {
        const updates: any = { status };
        
        if (extra.awardedTo) {
             updates.awarded_to = extra.awardedTo;
             const { data: u } = await supabase.from('profiles').select('email').eq('id', extra.awardedTo).single();
             if (u) updates.awarded_to_email = u.email;
        }
        if (extra.awardedAmount) updates.awarded_amount = extra.awardedAmount;
        if (extra.biddingStartedAt) updates.bidding_started_at = extra.biddingStartedAt;
        if (extra.validatedBy) updates.validated_by = extra.validatedBy;
        if (status === 'completed') updates.completion_at = new Date().toISOString();

        const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
        if (error) throw error;
    },

    addBid: async (taskId: string, bid: Omit<Bid, 'by' | 'at'>, userId: string): Promise<void> => {
        const { data: task, error: fetchError } = await supabase.from('tasks').select('bids').eq('id', taskId).single();
        if (fetchError) throw fetchError;
        
        const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).single();
        
        const newBid = {
            userId,
            by: user?.email || 'unknown',
            amount: bid.amount,
            note: bid.note,
            at: new Date().toISOString(),
            plannedExecutionDate: bid.plannedExecutionDate
        };
        
        const updatedBids = [...(task.bids || []), newBid];
        
        const { error } = await supabase.from('tasks').update({ bids: updatedBids }).eq('id', taskId);
        if (error) throw error;
    },

    addApproval: async (taskId: string, userId: string): Promise<void> => {
         const { data: task } = await supabase.from('tasks').select('approvals').eq('id', taskId).single();
         const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).single();
         const newApproval = { by: user?.email, at: new Date().toISOString() };
         const updated = [...(task?.approvals || []), newApproval];
         await supabase.from('tasks').update({ approvals: updated }).eq('id', taskId);
    },

    addRejection: async (taskId: string, userId: string): Promise<void> => {
         const { data: task } = await supabase.from('tasks').select('rejections').eq('id', taskId).single();
         const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).single();
         const newRejection = { by: user?.email, at: new Date().toISOString() };
         const updated = [...(task?.rejections || []), newRejection];
         await supabase.from('tasks').update({ rejections: updated }).eq('id', taskId);
    },

    addRating: async (taskId: string, rating: Omit<Rating, 'at' | 'byHash'>, userId: string): Promise<void> => {
         const { data: task } = await supabase.from('tasks').select('ratings').eq('id', taskId).single();
         const newRating = { ...rating, byHash: userId, at: new Date().toISOString() };
         const updated = [...(task?.ratings || []), newRating];
         await supabase.from('tasks').update({ ratings: updated }).eq('id', taskId);
    },
    
    deleteRating: async (taskId: string, index: number, userId: string): Promise<void> => {
        const { data: task } = await supabase.from('tasks').select('ratings, deleted_ratings').eq('id', taskId).single();
        const ratings = task?.ratings || [];
        if (index >= 0 && index < ratings.length) {
            const removed = ratings[index];
            const remaining = ratings.filter((_: any, i: number) => i !== index);
            
            const { data: user } = await supabase.from('profiles').select('email').eq('id', userId).single();
            const deletedEntry = {
                ...removed,
                deletedAt: new Date().toISOString(),
                deletedBy: user?.email
            };
            const deletedHistory = [...(task?.deleted_ratings || []), deletedEntry];
            
            await supabase.from('tasks').update({ ratings: remaining, deleted_ratings: deletedHistory }).eq('id', taskId);
        }
    },

    deleteTask: async (taskId: string): Promise<void> => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
    },

    createLedgerEntry: async (entry: any): Promise<void> => {
        let payerEmail = entry.payer;
        let payeeEmail = entry.payee;
        
        if (!payerEmail && entry.payerId) {
             const { data: u } = await supabase.from('profiles').select('email').eq('id', entry.payerId).single();
             if (u) payerEmail = u.email;
        } else if (entry.payerId === null) {
            payerEmail = 'Copro';
        }

        if (!payeeEmail && entry.payeeId) {
             const { data: u } = await supabase.from('profiles').select('email').eq('id', entry.payeeId).single();
             if (u) payeeEmail = u.email;
        }

        let tTitle = entry.taskTitle;
        let tCreator = entry.taskCreator;
        if (!tTitle && entry.taskId) {
            const { data: t } = await supabase.from('tasks').select('title, created_by_email').eq('id', entry.taskId).single();
            if (t) {
                tTitle = t.title;
                tCreator = t.created_by_email;
            }
        }

        const dbEntry = {
            task_id: entry.taskId,
            type: entry.type,
            payer_email: payerEmail, 
            payee_email: payeeEmail,
            amount: entry.amount,
            at: new Date().toISOString(),
            task_title: tTitle,
            task_creator: tCreator
        };
        
         const { error } = await supabase.from('ledger').insert(dbEntry);
         if (error) throw error;
    },

    deleteLedgerEntry: async (id: string): Promise<void> => {
         await supabase.from('ledger').delete().eq('id', id);
    },

    approveUser: async (email: string): Promise<void> => {
        // Check if update works
        const { count, error } = await supabase.from('profiles').update({ status: 'active' }).eq('email', email).select('', { count: 'exact' });
        if (error) throw error;
        if (count === 0) {
             throw new Error("Droit insuffisant pour valider cet utilisateur (RLS).");
        }
    },

    rejectUser: async (email: string): Promise<void> => {
        const { count, error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('email', email).select('', { count: 'exact' });
        if (error) throw error;
        if (count === 0) {
             throw new Error("Droit insuffisant pour rejeter cet utilisateur (RLS).");
        }
    },

    updateUserStatus: async (email: string, status: string): Promise<void> => {
        await supabase.from('profiles').update({ status }).eq('email', email);
    },

    updateUser: async (email: string, updates: any): Promise<void> => {
        const map: any = {};
        if (updates.firstName) map.first_name = updates.firstName;
        if (updates.lastName) map.last_name = updates.lastName;
        if (updates.role) map.role = updates.role;
        if (updates.email) map.email = updates.email; 
        
        const { error } = await supabase.from('profiles').update(map).eq('email', email);
        if (error) throw error;

        if (updates.password) {
            const { error: pwdError } = await supabase.auth.updateUser({ password: updates.password });
            if (pwdError) throw pwdError;
        }
    },

    createDirectoryEntry: async (userData: any): Promise<void> => {
        const { error } = await supabase.from('profiles').insert({
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role,
            status: 'active'
        });
        
        if (error) {
            if (error.message.includes("violates foreign key constraint") || error.message.includes("violates row-level security")) {
                // This happens because we can't insert into 'profiles' if there is no 'auth.users' record.
                // Supabase restriction: profiles must match an auth user.
                throw new Error("Impossible de créer une fiche manuelle sans compte Auth associé (Restriction Supabase). Le résident doit s'inscrire lui-même.");
            }
            throw error;
        }
    }
};
