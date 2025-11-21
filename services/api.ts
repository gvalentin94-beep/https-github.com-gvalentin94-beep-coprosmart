import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import type { User, RegisteredUser, Task, LedgerEntry, Bid, Rating, UserRole } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Hook for auth
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
         fetchProfile(session.user.email || '').then(u => setUser(u)).catch(() => setUser(null));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.email || '').then(u => setUser(u));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, setUser, loading };
}

async function fetchProfile(email: string): Promise<User | null> {
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user?.email) throw new Error("No email found");
        
        const profile = await fetchProfile(data.user.email);
        if (!profile) throw new Error("Profile not found");
        return profile;
    },

    signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string): Promise<void> => {
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
                     await supabase.from('profiles').update({
                         first_name: firstName,
                         last_name: lastName,
                         role,
                         status: 'pending'
                     }).eq('id', authData.user.id);
                 } else {
                    throw profileError;
                 }
             }
        }
    },
    
    requestPasswordReset: async (email: string): Promise<string> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        // Generate a fake 6-digit code for simulation if needed, or return a placeholder
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    resetPassword: async (token: string, password: string): Promise<void> => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },
    
    readTasks: async (): Promise<Task[]> => {
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
        const { data, error } = await supabase.from('profiles').select('*').neq('status', 'pending');
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
        // Fetch creator email
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
             // fetch email for denormalization if needed, or assume backend handles join
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
        // Resolve emails if IDs are passed (from App.tsx)
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

        // Fetch task info if not provided
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
        await supabase.from('profiles').update({ status: 'active' }).eq('email', email);
    },

    rejectUser: async (email: string): Promise<void> => {
         await supabase.from('profiles').update({ status: 'rejected' }).eq('email', email);
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
            if (error.message.includes("violates foreign key constraint")) {
                throw new Error("Impossible de créer une fiche sans compte Auth associé (Restriction Base de Données).");
            }
            throw error;
        }
    }
};