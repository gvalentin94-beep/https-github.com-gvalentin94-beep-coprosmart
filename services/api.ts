import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Task, LedgerEntry, User, UserRole, RegisteredUser, UserStatus, Bid, Rating, Approval, Rejection, DeletedRating, TaskCategory, TaskScope } from '../types';

// Init Supabase safely
// This prevents the "Cannot read properties of undefined" crash if import.meta.env is missing
const getEnv = () => {
    try {
        return (import.meta as any).env || {};
    } catch {
        return {};
    }
};

const env = getEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// Create client or fallback to placeholder to allow UI to load even if config is missing
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

// --- Helpers to map DB snake_case to App camelCase ---

const mapProfile = (p: any): RegisteredUser => ({
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    role: p.role,
    status: p.status
});

const mapTask = (t: any): Task => ({
    id: t.id,
    title: t.title,
    category: t.category as TaskCategory,
    scope: t.scope as TaskScope,
    details: t.details,
    location: t.location,
    startingPrice: t.starting_price,
    warrantyDays: t.warranty_days,
    status: t.status,
    createdBy: t.created_by_profile?.email || 'Unknown',
    createdById: t.created_by,
    createdAt: t.created_at,
    photo: t.photo,
    awardedTo: t.awarded_to_profile?.email,
    awardedToId: t.awarded_to,
    awardedAmount: t.awarded_amount,
    completionAt: t.completion_at,
    biddingStartedAt: t.bidding_started_at,
    validatedBy: t.validated_by_profile?.email,
    
    // Map relations
    bids: t.bids?.map((b: any) => ({
        id: b.id,
        userId: b.bidder_id,
        by: b.bidder_profile?.email || 'Unknown',
        amount: b.amount,
        note: b.note,
        at: b.created_at,
        plannedExecutionDate: b.planned_date
    })) || [],
    
    approvals: t.approvals?.map((a: any) => ({
        by: a.user_profile?.email || 'Unknown',
        at: a.created_at
    })) || [],
    
    rejections: t.rejections?.map((r: any) => ({
        by: r.user_profile?.email || 'Unknown',
        at: r.created_at
    })) || [],
    
    ratings: t.ratings?.map((r: any) => ({
        stars: r.stars,
        comment: r.comment,
        at: r.created_at,
        byHash: r.user_id
    })) || [],
    
    deletedRatings: t.deleted_ratings?.map((dr: any) => ({
        stars: dr.stars,
        comment: dr.comment,
        at: dr.created_at, // Using creation date of original rating? No, type says 'at'
        byHash: dr.original_author_id,
        deletedAt: dr.deleted_at,
        deletedBy: dr.deleter_profile?.email || 'Unknown'
    })) || []
});

const mapLedger = (l: any): LedgerEntry => ({
    id: l.id,
    taskId: l.task_id,
    type: l.type,
    payer: l.payer_profile?.email || (l.type === 'charge_credit' ? 'Copro' : 'Unknown'),
    payee: l.payee_profile?.email || 'Unknown',
    amount: l.amount,
    at: l.created_at,
    taskTitle: l.tasks?.title,
    taskCreator: l.tasks?.created_by_profile?.email
});

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            try {
                // Safety check for dummy client
                if (supabaseUrl === undefined) {
                    console.warn("Supabase not configured.");
                    setLoading(false);
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: profile, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                    
                    if (profile && !error && profile.status === 'active') {
                        setUser({
                            id: profile.id,
                            email: profile.email,
                            firstName: profile.first_name,
                            lastName: profile.last_name,
                            role: profile.role
                        });
                    }
                }
            } catch (e) {
                console.error("Session check failed", e);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
             if (!session) {
                 setUser(null);
             }
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, setUser, loading };
};

export const api = {
    
    // --- AUTH ---
    
    signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string): Promise<void> => {
        if (!supabaseUrl) throw new Error("La base de données n'est pas connectée.");
        
        // 1. Create Auth User
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Erreur lors de la création du compte.");

        // 2. Create Profile Entry (status pending by default)
        const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            role,
            status: 'pending' 
        });
        if (profileError) throw profileError;
    },

    login: async (email: string, password: string): Promise<User> => {
        if (!supabaseUrl) throw new Error("La base de données n'est pas connectée.");

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw new Error("Identifiants incorrects.");

        // Check Profile Status
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        // AUTO-REPAIR: If profile is missing (e.g. RLS failure during signup), create it now
        if (!profile) {
            const { error: insertError } = await supabase.from('profiles').insert({
                id: data.user.id,
                email: email,
                first_name: '', // User will need to update this later or we leave empty
                last_name: '',
                role: 'owner', // Default role
                status: 'pending'
            });
            
            // Try fetching again
            if (!insertError) {
                const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                profile = newProfile;
            }
        }

        if (!profile) throw new Error("Profil introuvable. Contactez l'administrateur.");

        // Auto-Restore Admin Logic
        if (profile.role === 'admin' && profile.status === 'deleted') {
            await supabase.from('profiles').update({ status: 'active' }).eq('id', profile.id);
            profile.status = 'active';
        }

        if (profile.status === 'pending') throw new Error("Compte en attente de validation par le Conseil Syndical.");
        if (profile.status === 'rejected') throw new Error("Demande de compte refusée.");
        if (profile.status === 'deleted') throw new Error("Ce compte a été désactivé.");

        return {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: profile.role
        };
    },
    
    logout: async () => {
        await supabase.auth.signOut();
    },

    requestPasswordReset: async (email: string): Promise<string> => {
        // In a real Supabase app, you'd use supabase.auth.resetPasswordForEmail(email)
        return "SIMULATED_TOKEN_123";
    },

    resetPassword: async (token: string, newPass: string): Promise<void> => {
        // Mock implementation
    },

    onPasswordRecovery: (callback: () => void) => {
        return supabase.auth.onAuthStateChange((event, _session) => {
            if (event === 'PASSWORD_RECOVERY') {
                callback();
            }
        });
    },

    // --- DATA ---

    readTasks: async (): Promise<Task[]> => {
        if (!supabaseUrl) return [];

        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                created_by_profile:created_by(email),
                awarded_to_profile:awarded_to(email),
                validated_by_profile:validated_by(email),
                bids(*, bidder_profile:bidder_id(email)),
                approvals(*, user_profile:user_id(email)),
                rejections(*, user_profile:user_id(email)),
                ratings(*),
                deleted_ratings(*, deleter_profile:deleted_by(email))
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(error);
            return [];
        }
        return data.map(mapTask);
    },

    createTask: async (task: Partial<Task>, userId: string): Promise<void> => {
        const { error } = await supabase.from('tasks').insert({
            title: task.title,
            category: task.category,
            scope: task.scope,
            location: task.location,
            details: task.details,
            starting_price: task.startingPrice,
            warranty_days: task.warrantyDays,
            status: task.status, // usually pending
            created_by: userId,
            photo: task.photo
        });
        if (error) throw error;
    },

    updateTaskStatus: async (taskId: string, status: string, extras: any = {}): Promise<void> => {
        const updateData: any = { status };
        if (extras.awardedTo) updateData.awarded_to = extras.awardedTo; // expect UUID
        if (extras.awardedAmount) updateData.awarded_amount = extras.awardedAmount;
        if (extras.validatedBy) updateData.validated_by = extras.validatedBy;
        if (extras.biddingStartedAt) updateData.bidding_started_at = extras.biddingStartedAt;
        if (status === 'completed') updateData.completion_at = new Date().toISOString();
        
        const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
        if (error) throw error;
    },

    deleteTask: async (taskId: string): Promise<void> => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
    },

    // --- BIDS ---
    addBid: async (taskId: string, bid: any, userId: string): Promise<void> => {
        const { error } = await supabase.from('bids').insert({
            task_id: taskId,
            bidder_id: userId,
            amount: bid.amount,
            note: bid.note,
            planned_date: bid.plannedExecutionDate
        });
        if (error) throw error;
    },

    // --- APPROVALS / REJECTIONS ---
    addApproval: async (taskId: string, userId: string): Promise<void> => {
        // Check if exists
        const { data } = await supabase.from('approvals').select('id').eq('task_id', taskId).eq('user_id', userId);
        if (data && data.length > 0) return;

        const { error } = await supabase.from('approvals').insert({ task_id: taskId, user_id: userId });
        if (error) throw error;
    },
    
    addRejection: async (taskId: string, userId: string): Promise<void> => {
        const { error } = await supabase.from('rejections').insert({ task_id: taskId, user_id: userId });
        if (error) throw error;
    },

    // --- RATINGS ---
    addRating: async (taskId: string, rating: any, userId: string): Promise<void> => {
        const { error } = await supabase.from('ratings').insert({
            task_id: taskId,
            user_id: userId,
            stars: rating.stars,
            comment: rating.comment
        });
        if (error) throw error;
    },

    deleteRating: async (taskId: string, ratingIdx: number, userId: string): Promise<void> => {
        const { data: ratings } = await supabase.from('ratings').select('*').eq('task_id', taskId).order('created_at', { ascending: true });
        if (ratings && ratings[ratingIdx]) {
            const r = ratings[ratingIdx];
            // Insert into history
            await supabase.from('deleted_ratings').insert({
                task_id: taskId,
                deleted_by: userId,
                original_author_id: r.user_id,
                stars: r.stars,
                comment: r.comment
            });
            // Delete
            await supabase.from('ratings').delete().eq('id', r.id);
        }
    },

    // --- LEDGER ---
    readLedger: async (): Promise<LedgerEntry[]> => {
        if (!supabaseUrl) return [];
        
        const { data, error } = await supabase
            .from('ledger')
            .select(`
                *,
                payer_profile:payer_id(email),
                payee_profile:payee_id(email),
                tasks(title, created_by_profile:created_by(email))
            `)
            .order('created_at', { ascending: false });
        if (error) return [];
        return data.map(mapLedger);
    },

    createLedgerEntry: async (entry: any): Promise<void> => {
        const { error } = await supabase.from('ledger').insert({
            task_id: entry.taskId,
            type: entry.type,
            payer_id: entry.payerId, // UUID or null
            payee_id: entry.payeeId, // UUID
            amount: entry.amount
        });
        if (error) throw error;
    },
    
    deleteLedgerEntry: async (id: string): Promise<void> => {
         const { error } = await supabase.from('ledger').delete().eq('id', id);
         if (error) throw error;
    },

    // --- USER MANAGEMENT ---
    
    getPendingUsers: async (): Promise<RegisteredUser[]> => {
        if (!supabaseUrl) return [];
        const { data } = await supabase.from('profiles').select('*').eq('status', 'pending');
        return (data || []).map(mapProfile);
    },
    
    approveUser: async (email: string): Promise<void> => {
        // Using data array to verify if update happened (RLS might block it silently)
        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'active' })
            .eq('email', email)
            .select();
        
        if (error) throw error;
        // If no data returned, it means row wasn't found or RLS blocked update
        if (!data || data.length === 0) throw new Error("Droit insuffisant pour valider cet utilisateur.");
    },
    
    rejectUser: async (email: string): Promise<void> => {
        // Check if trying to reject admin
        const { data: user } = await supabase.from('profiles').select('role').eq('email', email).single();
        if (user?.role === 'admin') throw new Error("Impossible de rejeter l'administrateur.");

        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'rejected' })
            .eq('email', email)
            .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Droit insuffisant pour rejeter cet utilisateur.");
    },

    updateUserStatus: async (email: string, status: UserStatus): Promise<void> => {
        const { data: user } = await supabase.from('profiles').select('role').eq('email', email).single();
        if (user?.role === 'admin' && (status === 'rejected' || status === 'deleted')) {
             throw new Error("Impossible de supprimer l'administrateur.");
        }
        await supabase.from('profiles').update({ status }).eq('email', email);
    },
    
    createDirectoryEntry: async (userData: { firstName: string, lastName: string, email: string, role: UserRole }): Promise<void> => {
        // This function allows admins to add a user to the directory.
        // Note: It does not create a Supabase Auth user (which requires admin credentials).
        // It only creates a profile entry.
        const id = crypto.randomUUID();
        const { error } = await supabase.from('profiles').insert({
            id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role,
            status: 'active'
        });
        if (error) throw error;
    },

    getDirectory: async (): Promise<RegisteredUser[]> => {
        if (!supabaseUrl) return [];
        // Return ALL users including admin, pending, rejected etc.
        const { data } = await supabase.from('profiles').select('*').order('last_name');
        return (data || []).map(mapProfile);
    },

    getAllUsers: async (): Promise<RegisteredUser[]> => {
        if (!supabaseUrl) return [];
        const { data } = await supabase.from('profiles').select('*');
        return (data || []).map(mapProfile);
    },

    updateUser: async (email: string, updates: any): Promise<void> => {
        const map: any = {};
        if (updates.firstName) map.first_name = updates.firstName;
        if (updates.lastName) map.last_name = updates.lastName;
        if (updates.role) map.role = updates.role;
        if (updates.email) map.email = updates.email; // Update display email
        
        // Update profile table
        const { error } = await supabase.from('profiles').update(map).eq('email', email);
        if (error) throw error;

        // If password is provided, update it via Auth (Only works if user is updating their own password)
        if (updates.password) {
            const { error: pwdError } = await supabase.auth.updateUser({ password: updates.password });
            if (pwdError) throw pwdError;
        }
    }
};