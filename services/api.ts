
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Task, LedgerEntry, User, UserRole, RegisteredUser, UserStatus, Bid, Rating, Approval, Rejection, DeletedRating, TaskCategory, TaskScope } from '../types';

// Init Supabase safely
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

// Create client or fallback to placeholder
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
    residence: p.residence || "Résidence Watteau", // Fallback for legacy users
    status: p.status,
    avatar: p.avatar
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
    residence: t.residence || "Résidence Watteau",
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
        at: dr.created_at,
        byHash: dr.original_author_id,
        deletedAt: dr.deleted_at,
        deletedBy: dr.deleter_profile?.email || 'Unknown'
    })) || []
});

const mapLedger = (l: any): LedgerEntry => ({
    id: l.id,
    taskId: l.task_id,
    residence: l.residence || "Résidence Watteau",
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
                            role: profile.role,
                            residence: profile.residence || "Résidence Watteau" // Handle legacy null residence
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
    
    signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string, residence: string): Promise<UserStatus> => {
        if (!supabaseUrl) throw new Error("La base de données n'est pas connectée.");
        
        // 1. Create Auth User
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        if (error) throw error;
        if (!data.user) throw new Error("Erreur lors de la création du compte.");

        // 2. Create Profile linked to Auth ID
        // Try with residence first
        try {
            const { error: profileError } = await supabase.from('profiles').insert({
                id: data.user.id,
                email,
                first_name: firstName,
                last_name: lastName,
                role: role,
                residence: residence,
                status: 'pending' // Always pending by default
            });
            if (profileError) throw profileError;
        } catch (e: any) {
            // Fallback: If 'residence' column missing, insert without it
             if (e.message?.includes('column') || e.code === '42703') {
                const { error: legacyError } = await supabase.from('profiles').insert({
                    id: data.user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    role: role,
                    // residence omitted
                    status: 'pending'
                });
                if (legacyError) throw legacyError;
             } else {
                 throw e;
             }
        }

        return 'pending';
    },

    login: async (email: string, password: string): Promise<User> => {
        if (!supabaseUrl) throw new Error("La base de données n'est pas connectée.");

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user) throw new Error("Identifiants incorrects.");

        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        // AUTO-REPAIR: If profile is missing (e.g. RLS failure during signup), create it now
        if (!profile) {
            // Default to first residence if unknown during repair
            const defaultRes = "Résidence Watteau";
            const profilePayload: any = {
                id: data.user.id,
                email: email,
                first_name: '', 
                last_name: '',
                role: 'owner',
                residence: defaultRes,
                status: 'pending'
            };

            try {
                await supabase.from('profiles').insert(profilePayload);
            } catch {
                // Fallback for missing column
                delete profilePayload.residence;
                await supabase.from('profiles').insert(profilePayload);
            }
            
            const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            profile = newProfile;
        }

        if (!profile) throw new Error("Profil introuvable. Contactez l'administrateur.");

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
            role: profile.role,
            residence: profile.residence || "Résidence Watteau" // Handle legacy null
        };
    },
    
    logout: async () => {
        await supabase.auth.signOut();
    },

    requestPasswordReset: async (email: string): Promise<string> => {
        if (!supabaseUrl) return "SIMULATED";
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
        return "LINK_SENT";
    },

    onPasswordRecovery: (callback: () => void) => {
        return supabase.auth.onAuthStateChange((event, _session) => {
            if (event === 'PASSWORD_RECOVERY') {
                callback();
            }
        });
    },

    // --- DATA ---

    readTasks: async (residence: string): Promise<Task[]> => {
        if (!supabaseUrl) return [];

        const selectQuery = `
                *,
                created_by_profile:created_by(email),
                awarded_to_profile:awarded_to(email),
                validated_by_profile:validated_by(email),
                bids(*, bidder_profile:bidder_id(email)),
                approvals(*, user_profile:user_id(email)),
                rejections(*, user_profile:user_id(email)),
                ratings(*),
                deleted_ratings(*, deleter_profile:deleted_by(email))
            `;

        try {
            // Attempt 1: Filter by residence (Requires DB update)
            let query = supabase.from('tasks').select(selectQuery);

            if (residence === "Résidence Watteau") {
                query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            } else {
                query = query.eq('residence', residence);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(mapTask);
        } catch (e) {
            // Attempt 2: Fallback to Legacy (No residence filter)
            console.warn("Falling back to legacy task fetch", e);
            const { data, error } = await supabase.from('tasks').select(selectQuery).order('created_at', { ascending: false });
            if (error) return [];
            return data.map(mapTask);
        }
    },

    createTask: async (task: Partial<Task>, userId: string, residence: string): Promise<string> => {
        const payload: any = {
            title: task.title,
            category: task.category,
            scope: task.scope,
            location: task.location,
            details: task.details,
            starting_price: task.startingPrice,
            warranty_days: task.warrantyDays,
            status: task.status,
            created_by: userId,
            residence: residence, // Ensure task is created in user's residence
            photo: task.photo
        };

        try {
            const { data, error } = await supabase.from('tasks').insert(payload).select('id').single();
            if (error) throw error;
            return data.id;
        } catch (e: any) {
             // Fallback: Try without residence if column missing
             if (e.message?.includes('column') || e.code === '42703') {
                delete payload.residence;
                const { data, error } = await supabase.from('tasks').insert(payload).select('id').single();
                if (error) throw error;
                return data.id;
             }
             throw e;
        }
    },

    updateTaskStatus: async (taskId: string, status: string, extras: any = {}): Promise<void> => {
        const updateData: any = { status };
        if (extras.awardedTo) updateData.awarded_to = extras.awardedTo;
        if (extras.awardedAmount) updateData.awarded_amount = extras.awardedAmount;
        if (extras.validatedBy) updateData.validated_by = extras.validatedBy;
        if (extras.biddingStartedAt) updateData.bidding_started_at = extras.biddingStartedAt;
        if (status === 'completed') updateData.completion_at = new Date().toISOString();
        
        const { error } = await supabase.from('tasks').update(updateData).eq('id', taskId);
        if (error) throw error;
    },

    updateTaskDetails: async (taskId: string, details: string): Promise<void> => {
        const { error } = await supabase.from('tasks').update({ details }).eq('id', taskId);
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
            await supabase.from('deleted_ratings').insert({
                task_id: taskId,
                deleted_by: userId,
                original_author_id: r.user_id,
                stars: r.stars,
                comment: r.comment
            });
            await supabase.from('ratings').delete().eq('id', r.id);
        }
    },

    // --- LEDGER ---
    readLedger: async (residence: string): Promise<LedgerEntry[]> => {
        if (!supabaseUrl) return [];
        
        const selectQuery = `
                *,
                payer_profile:payer_id(email),
                payee_profile:payee_id(email),
                tasks(title, created_by_profile:created_by(email))
            `;

        try {
            let query = supabase.from('ledger').select(selectQuery);
            if (residence === "Résidence Watteau") {
                query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            } else {
                query = query.eq('residence', residence);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(mapLedger);
        } catch (e) {
            console.warn("Ledger residence filter failed, fetching all.", e);
            const { data, error } = await supabase.from('ledger').select(selectQuery).order('created_at', { ascending: false });
            if (error) return [];
            return data.map(mapLedger);
        }
    },

    createLedgerEntry: async (entry: any, residence: string): Promise<void> => {
        const payload: any = {
            task_id: entry.taskId,
            residence: residence,
            type: entry.type,
            payer_id: entry.payerId, // Can be null for Copro charges
            payee_id: entry.payeeId,
            amount: entry.amount
        };
        
        try {
            const { error } = await supabase.from('ledger').insert(payload);
            if (error) throw error;
        } catch (e: any) {
            if (e.message?.includes('column')) {
                 delete payload.residence;
                 const { error } = await supabase.from('ledger').insert(payload);
                 if (error) throw error;
            } else throw e;
        }
    },
    
    deleteLedgerEntry: async (id: string): Promise<void> => {
         const { error } = await supabase.from('ledger').delete().eq('id', id);
         if (error) throw error;
    },

    // --- USER MANAGEMENT ---
    
    getPendingUsers: async (residence: string): Promise<RegisteredUser[]> => {
        if (!supabaseUrl) return [];
        
        try {
            let query = supabase.from('profiles').select('*').eq('status', 'pending');
            if (residence === "Résidence Watteau") {
                query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            } else {
                query = query.eq('residence', residence);
            }
            const { data, error } = await query;
            if (error) throw error;
            return (data || []).map(mapProfile);
        } catch (e) {
            const { data } = await supabase.from('profiles').select('*').eq('status', 'pending');
            return (data || []).map(mapProfile);
        }
    },
    
    approveUser: async (email: string): Promise<void> => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ status: 'active' })
            .eq('email', email)
            .select();
        
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Droit insuffisant pour valider cet utilisateur.");
    },
    
    rejectUser: async (email: string): Promise<void> => {
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
    
    deleteUserProfile: async (email: string): Promise<void> => {
        const { data: user } = await supabase.from('profiles').select('role').eq('email', email).single();
        if (user?.role === 'admin') throw new Error("Impossible de supprimer l'administrateur.");
        
        const { error } = await supabase.from('profiles').delete().eq('email', email);
        if (error) throw error;
    },
    
    // Generic email sender
    sendNotification: async (to: string, subject: string, html: string): Promise<void> => {
         const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });

        if (!response.ok) {
             const errData = await response.json().catch(() => ({}));
             // Specific handling for 404 in dev environment
             if (response.status === 404) {
                 console.warn("API route not found (Dev Mode). Email simulated.");
                 return;
             }
             throw new Error(errData.error || `Erreur serveur mail (${response.status})`);
        }
    },
    
    inviteUser: async (email: string, inviterName: string): Promise<void> => {
        const subject = `Invitation de ${inviterName} à rejoindre CoproSmart`;
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4f46e5;">Bonjour !</h2>
                <p><strong>${inviterName}</strong> vous invite à rejoindre <strong>CoproSmart</strong>, l'application de votre copropriété.</p>
                
                <p>CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes :</p>
                <ul>
                    <li>💡 Changer une ampoule</li>
                    <li>🚪 Régler une porte</li>
                    <li>📦 Évacuer des encombrants</li>
                </ul>
                <p>Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit supplémentaire sur ses propres charges. <br/><strong>C'est simple, local et gagnant-gagnant.</strong></p>
                
                <p style="margin-top: 20px;">
                    <a href="https://coprosmart.com" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Rejoindre ma copropriété
                    </a>
                </p>
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                    Si le lien ne fonctionne pas, rendez-vous sur https://coprosmart.com
                </p>
            </div>
        `;
        
        // Re-use generic sender
        await api.sendNotification(email, subject, html);
    },

    getDirectory: async (residence: string): Promise<RegisteredUser[]> => {
        if (!supabaseUrl) return [];
        
        try {
            let query = supabase.from('profiles').select('*');
            if (residence === "Résidence Watteau") {
                query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            } else {
                query = query.eq('residence', residence);
            }
            const { data, error } = await query.order('last_name');
            if (error) throw error;
            return (data || []).map(mapProfile);
        } catch (e) {
            console.warn("Directory fallback", e);
            const { data } = await supabase.from('profiles').select('*').order('last_name');
            return (data || []).map(mapProfile);
        }
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
        if (updates.email) map.email = updates.email;
        if (updates.avatar) map.avatar = updates.avatar;
        
        const { error } = await supabase.from('profiles').update(map).eq('email', email);
        if (error) throw error;

        if (updates.password) {
            const { error: pwdError } = await supabase.auth.updateUser({ password: updates.password });
            if (pwdError) throw pwdError;
        }
    }
};
