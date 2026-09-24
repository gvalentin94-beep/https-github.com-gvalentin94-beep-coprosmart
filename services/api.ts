import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Task, LedgerEntry, User, RegisteredUser } from '../types';
import { mockStore } from './mockStore';

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

export const isConfigured = !!supabaseUrl && supabaseUrl.includes("supabase.co") && !!supabaseKey;

const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseKey)
    : createClient('https://placeholder.supabase.co', 'placeholder');

// HELPER: Format Date to Task ID (AAAAMMJJ-HHMMSS)
export const formatTaskId = (dateStr: string | undefined) => {
    if (!dateStr) return "--------";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "--------";
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    } catch { return "--------"; }
};

const mapTask = (t: any): Task => ({
    id: t.id, title: t.title, category: t.category, scope: t.scope, details: t.details, location: t.location,
    startingPrice: t.starting_price, warrantyDays: t.warranty_days, status: t.status, residence: t.residence,
    createdBy: t.created_by_profile?.email || 'Inconnu', createdById: t.created_by, createdAt: t.created_at,
    photo: t.photo, awardedTo: t.awarded_to_profile?.email, awardedToId: t.awarded_to, awardedAmount: t.awarded_amount,
    completionAt: t.completion_at, biddingStartedAt: t.bidding_started_at,
    bids: t.bids?.map((b: any) => ({ id: b.id, userId: b.bidder_id, by: b.bidder_profile?.email, amount: b.amount, note: b.note, at: b.created_at, plannedExecutionDate: b.planned_date })) || [],
    approvals: t.approvals?.map((a: any) => ({ by: a.user_profile?.email, at: a.created_at })) || [],
    rejections: t.rejections?.map((r: any) => ({ by: r.user_profile?.email, at: r.created_at })) || [],
    ratings: t.ratings?.map((r: any) => ({ stars: r.stars, comment: r.comment, at: r.created_at, byHash: r.user_id })) || []
});

const mapLedger = (l: any): LedgerEntry => ({
    id: l.id, taskId: l.task_id, residence: l.residence, type: l.type,
    payer: l.payer_profile?.email || (l.type === 'charge_credit' ? 'Copro' : l.payer_id),
    payee: l.payee_profile?.email || l.payee_id,
    amount: l.amount, at: l.created_at,
    taskTitle: l.tasks?.title || l.manual_task_title || 'Tâche (Supprimée)',
    taskCreatedAt: l.tasks?.created_at || l.manual_task_created_at
});

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            if (!isConfigured) {
                try {
                    const saved = localStorage.getItem('coprosmart_current_user');
                    if (saved) {
                        setUser(JSON.parse(saved));
                    }
                } catch {
                    // ignore
                }
                setLoading(false);
                return;
            }
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    if (profile && profile.status === 'active') {
                        setUser({ id: profile.id, email: profile.email, firstName: profile.first_name, lastName: profile.last_name, role: profile.role, residence: profile.residence });
                    }
                }
            } catch (err) {
                console.error("Auth check failed:", err);
            }
            setLoading(false);
        };
        check();
    }, []);
    return { user, setUser, loading };
};

export const api = {
    sendNotification: async (to: string, subject: string, html: string): Promise<void> => {
        try {
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, html })
            });
            if (!res.ok) {
                console.warn("Notification email non envoyée (service optionnel)");
            }
        } catch {
            console.warn("Notification non envoyée (pas de backend email local)");
        }
    },

    inviteUser: async (email: string, inviter: string): Promise<void> => {
        await api.sendNotification(email, `Invitation de ${inviter}`, `<p>${inviter} vous invite sur CoproSmart.</p>`);
    },

    signUp: async (email: string, pass: string, role: string, fn: string, ln: string, res: string) => {
        const roleLabel = role === 'council' ? 'Membre du conseil syndical (et copropriétaire)' : 'Copropriétaire';
        const applicantName = `${fn.trim()} ${ln.trim()}`;
        const cleanEmail = email.trim();

        // Notification envoyée à l'administrateur (Guillaume VALENTIN)
        const adminEmail = 'g.valentin94@gmail.com';
        const emailSubject = `🔔 Nouvelle inscription CoproSmart : ${applicantName} (${roleLabel})`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h2 style="color: #4338ca; margin-top: 0;">Nouvelle demande d'inscription</h2>
                <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                    Un nouveau résident vient de créer son compte sur <strong>CoproSmart</strong> et attend votre validation :
                </p>
                <div style="background-color: #ffffff; padding: 16px; border-radius: 6px; border: 1px solid #cbd5e1; margin: 16px 0;">
                    <p style="margin: 6px 0; color: #1e293b;"><strong>Identité :</strong> ${applicantName}</p>
                    <p style="margin: 6px 0; color: #1e293b;"><strong>Email :</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
                    <p style="margin: 6px 0; color: #1e293b;"><strong>Profil demandé :</strong> ${roleLabel}</p>
                    <p style="margin: 6px 0; color: #1e293b;"><strong>Résidence :</strong> ${res}</p>
                    <p style="margin: 6px 0; color: #1e293b;"><strong>Date de la demande :</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p style="color: #64748b; font-size: 13px;">
                    👉 Connectez-vous à l'application CoproSmart en tant qu'administrateur pour valider ou refuser cette adhésion depuis l'onglet <strong>Annuaire / Demandes en attente</strong>.
                </p>
                <div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                    CoproSmart — Gestion collaborative des travaux de copropriété
                </div>
            </div>
        `;

        // Tentative d'envoi d'email à l'admin (asynchrone sans bloquer l'inscription)
        api.sendNotification(adminEmail, emailSubject, emailHtml).catch(err => {
            console.warn("Échec d'envoi de la notification admin:", err);
        });

        if (!isConfigured) {
            const newUser: RegisteredUser = {
                id: `usr-${Date.now()}`,
                email: cleanEmail,
                firstName: fn.trim(),
                lastName: ln.trim(),
                role: role as any,
                residence: res,
                status: 'pending'
            };
            mockStore.addUser(newUser);
            return 'pending';
        }
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: pass });
        if (error) throw error;
        await supabase.from('profiles').insert({ id: data.user!.id, email: cleanEmail, first_name: fn.trim(), last_name: ln.trim(), role, residence: res, status: 'pending' });
        return 'pending';
    },

    login: async (email: string, pass: string): Promise<User> => {
        const cleanEmail = email.trim().toLowerCase();
        let userProfile = mockStore.findUserByEmail(cleanEmail);

        // Si l'utilisateur est admin (admin@coprosmart.fr ou l'email personnel de l'admin),
        // ou si c'est un compte prédéfini actif, on garantit un statut actif
        const isAdminAccount = cleanEmail === 'admin@coprosmart.fr' || cleanEmail === 'g.valentin94@gmail.com' || (userProfile && userProfile.role === 'admin');

        if (isAdminAccount && userProfile && userProfile.status !== 'active') {
            userProfile.status = 'active';
            mockStore.approveUser(userProfile.email);
        }

        const isKnownLocal = !!userProfile;

        if (!isConfigured) {
            let p = userProfile;
            if (!p) {
                // Auto create demo user if not found
                p = {
                    id: `usr-${Date.now()}`,
                    email: cleanEmail,
                    firstName: cleanEmail.split('@')[0],
                    lastName: 'Résident',
                    role: 'owner',
                    residence: 'Résidence Watteau',
                    status: 'active'
                };
                mockStore.addUser(p);
            }
            if (p.status !== 'active') {
                throw new Error("Compte en attente de validation par le Conseil Syndical.");
            }
            const loggedUser: User = {
                id: p.id,
                email: p.email,
                firstName: p.firstName,
                lastName: p.lastName,
                role: p.role,
                residence: p.residence
            };
            localStorage.setItem('coprosmart_current_user', JSON.stringify(loggedUser));
            return loggedUser;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
            if (error) throw error;
            const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (!p || (p.status !== 'active' && !isAdminAccount)) throw new Error("Compte en attente de validation.");
            const loggedUser: User = { id: p.id, email: p.email, firstName: p.first_name, lastName: p.last_name, role: p.role, residence: p.residence };
            localStorage.setItem('coprosmart_current_user', JSON.stringify(loggedUser));
            return loggedUser;
        } catch (supabaseErr) {
            // Fallback si l'utilisateur est connu localement (ou si c'est l'administrateur)
            if (userProfile) {
                if (userProfile.status !== 'active' && !isAdminAccount) {
                    throw new Error("Compte en attente de validation par le Conseil Syndical.");
                }
                const fallbackUser: User = {
                    id: userProfile.id,
                    email: userProfile.email,
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    role: userProfile.role,
                    residence: userProfile.residence
                };
                localStorage.setItem('coprosmart_current_user', JSON.stringify(fallbackUser));
                return fallbackUser;
            }
            throw supabaseErr;
        }
    },

    logout: async () => {
        localStorage.removeItem('coprosmart_current_user');
        if (isConfigured) {
            await supabase.auth.signOut();
        }
    },

    requestPasswordReset: async (email: string) => {
        if (isConfigured) {
            await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        }
    },

    readTasks: async (residence: string): Promise<Task[]> => {
        if (!isConfigured) {
            return mockStore.getTasks().filter(t => !residence || t.residence === residence);
        }
        try {
            const { data, error } = await supabase.from('tasks').select(`*, created_by_profile:created_by(email), awarded_to_profile:awarded_to(email), bids(*, bidder_profile:bidder_id(email)), approvals(*, user_profile:user_id(email)), ratings(*)`)
                .eq('residence', residence).order('created_at', { ascending: false });
            if (error || !data || data.length === 0) {
                // Fallback si la table n'a pas encore été migrée ou est vide
                return mockStore.getTasks().filter(t => !residence || t.residence === residence);
            }
            return data.map(mapTask);
        } catch {
            return mockStore.getTasks().filter(t => !residence || t.residence === residence);
        }
    },

    createTask: async (task: any, uid: string, res: string) => {
        if (!isConfigured) {
            return mockStore.createTask(task, uid, res);
        }
        const { data, error } = await supabase.from('tasks').insert({ ...task, created_by: uid, residence: res, starting_price: task.startingPrice, warranty_days: task.warrantyDays }).select('id').single();
        if (error) throw error;
        return data.id;
    },

    updateTaskStatus: async (tid: string, status: string, extras: any = {}) => {
        if (!isConfigured) {
            mockStore.updateTaskStatus(tid, status as any, extras);
            return;
        }
        const update: any = { status };
        if (extras.awardedTo) update.awarded_to = extras.awardedTo;
        if (extras.awardedAmount) update.awarded_amount = extras.awardedAmount;
        if (extras.validatedBy) update.validated_by = extras.validatedBy;
        if (status === 'completed') update.completion_at = new Date().toISOString();
        await supabase.from('tasks').update(update).eq('id', tid);
    },

    updateTaskDetails: async (tid: string, details: string) => {
        if (!isConfigured) {
            mockStore.updateTaskDetails(tid, details);
            return;
        }
        await supabase.from('tasks').update({ details }).eq('id', tid);
    },

    deleteTask: async (tid: string) => {
        if (!isConfigured) {
            mockStore.deleteTask(tid);
            return;
        }
        await supabase.from('tasks').delete().eq('id', tid);
    },

    addBid: async (tid: string, bid: any, uid: string) => {
        if (!isConfigured) {
            mockStore.addBid(tid, bid, uid);
            return;
        }
        await supabase.from('bids').insert({ task_id: tid, bidder_id: uid, amount: bid.amount, note: bid.note, planned_date: bid.plannedExecutionDate });
        await supabase.from('tasks').update({ bidding_started_at: new Date().toISOString() }).eq('id', tid);
    },

    addApproval: async (tid: string, uid: string) => {
        if (!isConfigured) {
            mockStore.addApproval(tid, uid);
            return;
        }
        await supabase.from('approvals').insert({ task_id: tid, user_id: uid });
    },

    addRating: async (tid: string, rating: { stars: number; comment?: string }, uid: string) => {
        if (!isConfigured) {
            mockStore.addRating(tid, rating, uid);
            return;
        }
        await supabase.from('ratings').insert({ task_id: tid, user_id: uid, stars: rating.stars, comment: rating.comment || '' });
    },

    readLedger: async (residence: string): Promise<LedgerEntry[]> => {
        if (!isConfigured) {
            return mockStore.getLedger().filter(l => !residence || l.residence === residence);
        }
        try {
            const { data, error } = await supabase.from('ledger').select(`*, payer_profile:payer_id(email), payee_profile:payee_id(email), tasks(title, created_at)`)
                .eq('residence', residence).order('created_at', { ascending: false });
            if (error || !data || data.length === 0) {
                return mockStore.getLedger().filter(l => !residence || l.residence === residence);
            }
            return data.map(mapLedger);
        } catch {
            return mockStore.getLedger().filter(l => !residence || l.residence === residence);
        }
    },

    createLedgerEntry: async (entry: any, res: string) => {
        if (!isConfigured) {
            mockStore.createLedgerEntry(entry, res);
            return;
        }
        const { error } = await supabase.from('ledger').insert({
            task_id: entry.taskId, residence: res, type: entry.type,
            payer_id: entry.payerId, payee_id: entry.payeeId, amount: entry.amount
        });
        if (error) {
            console.warn("Supabase ledger insert failed, persisting locally:", error);
            mockStore.createLedgerEntry(entry, res);
        }
    },

    deleteLedgerEntry: async (id: string) => {
        if (!isConfigured) {
            mockStore.deleteLedgerEntry(id);
            return;
        }
        await supabase.from('ledger').delete().eq('id', id);
        mockStore.deleteLedgerEntry(id);
    },

    getPendingUsers: async (res: string): Promise<RegisteredUser[]> => {
        if (!isConfigured) {
            return mockStore.getUsers().filter(u => (!res || u.residence === res) && u.status === 'pending');
        }
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('residence', res).eq('status', 'pending');
            if (error || !data || data.length === 0) {
                return mockStore.getUsers().filter(u => (!res || u.residence === res) && u.status === 'pending');
            }
            return data.map(p => ({ ...p, firstName: p.first_name, lastName: p.last_name }));
        } catch {
            return mockStore.getUsers().filter(u => (!res || u.residence === res) && u.status === 'pending');
        }
    },

    approveUser: async (email: string) => {
        mockStore.approveUser(email);
        if (isConfigured) {
            try {
                await supabase.from('profiles').update({ status: 'active' }).eq('email', email);
            } catch (e) {
                console.warn("Supabase approveUser failed:", e);
            }
        }
    },

    deleteUser: async (email: string) => {
        mockStore.deleteUser(email);
        if (isConfigured) {
            try {
                await supabase.from('profiles').delete().eq('email', email);
            } catch (e) {
                console.warn("Supabase deleteUser failed:", e);
            }
        }
    },

    getDirectory: async (res: string): Promise<RegisteredUser[]> => {
        if (!isConfigured) {
            return mockStore.getUsers().filter(u => (!res || u.residence === res) && u.status === 'active');
        }
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('residence', res).eq('status', 'active');
            if (error || !data || data.length === 0) {
                return mockStore.getUsers().filter(u => (!res || u.residence === res) && u.status === 'active');
            }
            return data.map(p => ({ ...p, firstName: p.first_name, lastName: p.last_name }));
        } catch {
            return mockStore.getUsers().filter(u => (!res || u.residence === res) && u.status === 'active');
        }
    }
};
