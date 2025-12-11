
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

// Robust check for URL validity
const isValidUrl = (url: string) => {
    if (!url) return false;
    if (url.includes("your-project")) return false; // Common template placeholder
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const isConfigured = isValidUrl(supabaseUrl) && !!supabaseKey;

// Create client or fallback to placeholder (prevents crash on load)
const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

// --- Helpers to map DB snake_case to App camelCase ---

const mapProfile = (p: any): RegisteredUser => ({
    id: p.id,
    email: p.email,
    firstName: p.first_name,
    lastName: p.last_name,
    role: p.role,
    residence: p.residence || "Résidence Watteau",
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
                if (!isConfigured) {
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
                            residence: profile.residence || "Résidence Watteau"
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

// Error Helper
const handleAuthError = (error: any) => {
    if (!error) return;
    console.error("Auth Error:", error);
    const msg = error.message || error.toString();
    
    if (msg === "Invalid login credentials") throw new Error("Email ou mot de passe incorrect.");
    if (msg.includes("Email not confirmed")) throw new Error("Veuillez confirmer votre email.");
    if (msg === "Failed to fetch" || msg.includes("NetworkError")) throw new Error("Impossible de joindre le serveur. Vérifiez l'URL Supabase et votre connexion.");
    
    throw new Error(msg);
};

export const api = {
    
    // --- HELPER EMAIL ---
    sendNotification: async (to: string, subject: string, html: string): Promise<void> => {
         try {
             // In Vercel environment, /api/... routes are automatically handled.
             // In local Vite dev (without Vercel CLI), this will 404.
             if (import.meta.env.DEV) {
                 console.log(`[DEV EMAIL SIMULATION] To: ${to} | Subject: ${subject}`);
                 return;
             }
             
             await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, html })
            });
         } catch (e) { console.error("Email fail", e); }
    },

    inviteUser: async (email: string, inviterName: string): Promise<void> => {
        const link = window.location.origin;
        await api.sendNotification(email, `Invitation de ${inviterName}`, 
            `<p>Bonjour,</p><p>${inviterName} vous invite à rejoindre CoproSmart.</p><p><a href="${link}" style="display:inline-block;background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Rejoindre la copropriété</a></p>`);
    },

    // --- AUTH ---
    
    signUp: async (email: string, password: string, role: UserRole, firstName: string, lastName: string, residence: string): Promise<UserStatus> => {
        if (!isConfigured) throw new Error("Erreur configuration: Base de données non connectée.");

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) handleAuthError(error);
        if (!data.user) throw new Error("Erreur lors de la création du compte.");

        try {
            const profileData: any = {
                id: data.user.id,
                email,
                first_name: firstName,
                last_name: lastName,
                role: role,
                residence: residence,
                status: 'pending'
            };
            
            // Handle fallback if residence column missing
            try {
                await supabase.from('profiles').insert(profileData);
            } catch {
                delete profileData.residence;
                await supabase.from('profiles').insert(profileData);
            }

            // ALERT: Notify Admins of new user
            try {
                const { data: admins } = await supabase.from('profiles')
                    .select('email')
                    .or('role.eq.admin,role.eq.council')
                    .eq('status', 'active'); 
                
                const link = window.location.origin;
                if (admins && admins.length > 0) {
                    for (const admin of admins) {
                        await api.sendNotification(
                            admin.email, 
                            "🔔 Nouvelle inscription à valider", 
                            `<p><strong>${firstName} ${lastName}</strong> (${email}) demande à rejoindre ${residence}.</p><p><a href="${link}">Connectez-vous pour valider ou refuser</a></p>`
                        );
                    }
                }
            } catch (err) { console.warn("Failed to notify admins", err); }

        } catch (e: any) {
            throw e;
        }
        return 'pending';
    },

    login: async (email: string, password: string): Promise<User> => {
        if (!isConfigured) throw new Error("Erreur configuration: URL Supabase invalide.");

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) handleAuthError(error);
        
        if (!data.user) throw new Error("Erreur d'authentification.");

        let { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            
        // AUTO-REPAIR
        if (!profile) {
            console.log("Auto-repairing profile...");
            const payload: any = {
                id: data.user.id,
                email: email,
                first_name: 'Utilisateur', 
                last_name: '(Incomplet)',
                role: 'owner',
                residence: "Résidence Watteau",
                status: 'pending'
            };
            try { await supabase.from('profiles').insert(payload); } catch { delete payload.residence; await supabase.from('profiles').insert(payload); }
            const { data: newProfile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            profile = newProfile;
        }

        if (!profile) throw new Error("Profil introuvable.");
        if (profile.status === 'pending') throw new Error("Compte en attente de validation par le Conseil Syndical.");
        if (profile.status === 'rejected') throw new Error("Compte refusé.");
        if (profile.status === 'deleted') throw new Error("Compte désactivé.");

        return {
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            role: profile.role,
            residence: profile.residence || "Résidence Watteau"
        };
    },
    
    logout: async () => {
        await supabase.auth.signOut();
    },

    requestPasswordReset: async (email: string): Promise<string> => {
        // Uses Supabase's SMTP settings (configured in Dashboard)
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        return "LINK_SENT";
    },

    onPasswordRecovery: (callback: () => void) => {
        return supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') callback();
        });
    },

    // --- DATA ---

    readTasks: async (residence: string): Promise<Task[]> => {
        if (!isConfigured) return [];

        const selectQuery = `*, created_by_profile:created_by(email), awarded_to_profile:awarded_to(email), validated_by_profile:validated_by(email), bids(*, bidder_profile:bidder_id(email)), approvals(*, user_profile:user_id(email)), rejections(*, user_profile:user_id(email)), ratings(*), deleted_ratings(*, deleter_profile:deleted_by(email))`;

        try {
            let query = supabase.from('tasks').select(selectQuery);
            if (residence === "Résidence Watteau") query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            else query = query.eq('residence', residence);

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(mapTask);
        } catch (e) {
            console.warn("Legacy fetch", e);
            const { data } = await supabase.from('tasks').select(selectQuery).order('created_at', { ascending: false });
            return (data || []).map(mapTask);
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
            residence: residence,
            photo: task.photo
        };

        try {
            const { data, error } = await supabase.from('tasks').insert(payload).select('id').single();
            if (error) throw error;

            // ALERT: Notify Council
            try {
                const { data: council } = await supabase.from('profiles')
                    .select('email')
                    .or('role.eq.council,role.eq.admin')
                    .eq('status', 'active');
                
                const link = window.location.origin;
                if (council && council.length > 0) {
                    for (const member of council) {
                        await api.sendNotification(
                            member.email, 
                            "🆕 Nouvelle demande de travaux", 
                            `<p>Une nouvelle demande <strong>"${task.title}"</strong> a été créée.</p><p><a href="${link}">Connectez-vous pour valider sa pertinence</a></p>`
                        );
                    }
                }
            } catch (err) { console.warn("Failed to notify council", err); }

            return data.id;
        } catch (e: any) {
             if (e.message?.includes('column')) {
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

        // ALERT: When task requests verification
        if (status === 'verification') {
             try {
                const { data: task } = await supabase.from('tasks').select('title').eq('id', taskId).single();
                const { data: council } = await supabase.from('profiles')
                    .select('email')
                    .or('role.eq.council,role.eq.admin')
                    .eq('status', 'active');
                
                const link = window.location.origin;
                if (council && task) {
                    for (const member of council) {
                        await api.sendNotification(
                            member.email, 
                            "🛠️ Travaux terminés - Contrôle requis", 
                            `<p>L'intervenant a signalé la fin des travaux pour <strong>"${task.title}"</strong>.</p><p><a href="${link}">Merci de procéder au contrôle qualité</a></p>`
                        );
                    }
                }
             } catch(err) { console.warn("Verification email failed", err); }
        }
    },

    updateTaskDetails: async (taskId: string, details: string): Promise<void> => {
        const { error } = await supabase.from('tasks').update({ details }).eq('id', taskId);
        if (error) throw error;
    },

    deleteTask: async (taskId: string): Promise<void> => {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;
    },

    addBid: async (taskId: string, bid: any, userId: string): Promise<void> => {
        const { error } = await supabase.from('bids').insert({
            task_id: taskId,
            bidder_id: userId,
            amount: bid.amount,
            note: bid.note,
            planned_date: bid.plannedExecutionDate
        });
        if (error) throw error;

        // ALERT: Notify Task Creator
        try {
            // Get Task Title and Creator ID
            const { data: task } = await supabase.from('tasks').select('title, created_by').eq('id', taskId).single();
            if (task && task.created_by) {
                // Get Creator Email
                const { data: creator } = await supabase.from('profiles').select('email').eq('id', task.created_by).single();
                
                const link = window.location.origin;
                if (creator) {
                    await api.sendNotification(
                        creator.email,
                        `💰 Nouvelle offre sur "${task.title}"`,
                        `<p>Une offre de <strong>${bid.amount}€</strong> a été déposée pour votre demande (Intervention : ${new Date(bid.plannedExecutionDate).toLocaleDateString()}).</p><p><a href="${link}">Voir les détails</a></p>`
                    );
                }
            }
        } catch (err) { console.warn("Bid Notification Failed", err); }
    },

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

    readLedger: async (residence: string): Promise<LedgerEntry[]> => {
        if (!isConfigured) return [];
        // Fix: Use simple select and map manually if joins are problematic due to nulls (e.g. Copro Payer)
        // But let's try to keep join for efficiency but be robust.
        // We use inner joins by default in Supabase unless !inner is omitted? No, simple syntax is usually Left Join.
        // HOWEVER, if the foreign key (payer_id) is NULL, the joined object `payer_profile` will be null, but the row SHOULD exist.
        const selectQuery = `*, payer_profile:payer_id(email), payee_profile:payee_id(email), tasks(title, created_by_profile:created_by(email))`;
        try {
            let query = supabase.from('ledger').select(selectQuery);
            if (residence === "Résidence Watteau") query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            else query = query.eq('residence', residence);
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data.map(mapLedger);
        } catch {
            // Fallback for robustness
            const { data } = await supabase.from('ledger').select(selectQuery).order('created_at', { ascending: false });
            return (data || []).map(mapLedger);
        }
    },

    createLedgerEntry: async (entry: any, residence: string): Promise<void> => {
        const payload: any = {
            task_id: entry.taskId,
            residence: residence,
            type: entry.type,
            payer_id: entry.payerId, // Can be null for Copro
            payee_id: entry.payeeId,
            amount: entry.amount
        };
        try { await supabase.from('ledger').insert(payload); } catch (e: any) {
            if (e.message?.includes('column')) { delete payload.residence; await supabase.from('ledger').insert(payload); } else throw e;
        }
    },
    
    deleteLedgerEntry: async (id: string): Promise<void> => {
         const { error } = await supabase.from('ledger').delete().eq('id', id);
         if (error) throw error;
    },

    getPendingUsers: async (residence: string): Promise<RegisteredUser[]> => {
        if (!isConfigured) return [];
        try {
            let query = supabase.from('profiles').select('*').eq('status', 'pending');
            if (residence === "Résidence Watteau") query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            else query = query.eq('residence', residence);
            const { data } = await query;
            return (data || []).map(mapProfile);
        } catch {
            return [];
        }
    },
    
    approveUser: async (email: string): Promise<void> => {
        const { data, error } = await supabase.from('profiles').update({ status: 'active' }).eq('email', email).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Droit insuffisant.");
        
        const link = window.location.origin;
        await api.sendNotification(email, "Compte validé - CoproSmart", 
            `<p>Votre compte a été validé par le Conseil Syndical.</p><p><a href="${link}" style="display:inline-block;background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Se connecter</a></p>`);
    },
    
    rejectUser: async (email: string): Promise<void> => {
        const { data, error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('email', email).select();
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Droit insuffisant.");
    },

    updateUserStatus: async (email: string, status: UserStatus): Promise<void> => {
        await supabase.from('profiles').update({ status }).eq('email', email);
    },
    
    deleteUserProfile: async (email: string): Promise<void> => {
        const { error } = await supabase.from('profiles').delete().eq('email', email);
        if (error) throw error;
    },
    
    getDirectory: async (residence: string): Promise<RegisteredUser[]> => {
        if (!isConfigured) return [];
        try {
            // First try filtering by residence
            let query = supabase.from('profiles').select('*');
            if (residence === "Résidence Watteau") query = query.or(`residence.eq.Résidence Watteau,residence.is.null`);
            else query = query.eq('residence', residence);
            
            const { data, error } = await query.order('last_name');
            
            if (error || !data || data.length === 0) {
                 // Fallback: Fetch ALL to ensure directory isn't empty if residence mismatch
                 console.warn("Directory filtering yielded empty, fetching all for debug/fallback");
                 const { data: all } = await supabase.from('profiles').select('*').order('last_name');
                 return (all || []).map(mapProfile);
            }
            return data.map(mapProfile);
        } catch {
            return [];
        }
    },

    getAllUsers: async (): Promise<RegisteredUser[]> => {
        if (!isConfigured) return [];
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
        if (updates.password) await supabase.auth.updateUser({ password: updates.password });
    }
};
