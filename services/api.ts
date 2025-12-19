
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
            if (!isConfigured) { setLoading(false); return; }
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (profile && profile.status === 'active') {
                    setUser({ id: profile.id, email: profile.email, firstName: profile.first_name, lastName: profile.last_name, role: profile.role, residence: profile.residence });
                }
            }
            setLoading(false);
        };
        check();
    }, []);
    return { user, setUser, loading };
};

export const api = {
    sendNotification: async (to: string, subject: string, html: string): Promise<void> => {
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Email non envoyé");
        }
    },

    inviteUser: async (email: string, inviter: string): Promise<void> => {
        await api.sendNotification(email, `Invitation de ${inviter}`, `<p>${inviter} vous invite sur CoproSmart.</p>`);
    },

    signUp: async (email: string, pass: string, role: string, fn: string, ln: string, res: string) => {
        const { data, error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
        await supabase.from('profiles').insert({ id: data.user!.id, email, first_name: fn, last_name: ln, role, residence: res, status: 'pending' });
        return 'pending';
    },

    login: async (email: string, pass: string): Promise<User> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (!p || p.status !== 'active') throw new Error("Compte en attente de validation.");
        return { id: p.id, email: p.email, firstName: p.first_name, lastName: p.last_name, role: p.role, residence: p.residence };
    },

    logout: async () => { await supabase.auth.signOut(); },

    requestPasswordReset: async (email: string) => { await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); },

    readTasks: async (residence: string): Promise<Task[]> => {
        const { data, error } = await supabase.from('tasks').select(`*, created_by_profile:created_by(email), awarded_to_profile:awarded_to(email), bids(*, bidder_profile:bidder_id(email)), approvals(*, user_profile:user_id(email)), ratings(*)`)
            .eq('residence', residence).order('created_at', { ascending: false });
        if (error) return [];
        return data.map(mapTask);
    },

    createTask: async (task: any, uid: string, res: string) => {
        const { data, error } = await supabase.from('tasks').insert({ ...task, created_by: uid, residence: res, starting_price: task.startingPrice, warranty_days: task.warrantyDays }).select('id').single();
        if (error) throw error;
        return data.id;
    },

    updateTaskStatus: async (tid: string, status: string, extras: any = {}) => {
        const update: any = { status };
        if (extras.awardedTo) update.awarded_to = extras.awardedTo;
        if (extras.awardedAmount) update.awarded_amount = extras.awardedAmount;
        if (extras.validatedBy) update.validated_by = extras.validatedBy;
        if (status === 'completed') update.completion_at = new Date().toISOString();
        await supabase.from('tasks').update(update).eq('id', tid);
    },

    updateTaskDetails: async (tid: string, details: string) => { await supabase.from('tasks').update({ details }).eq('id', tid); },

    deleteTask: async (tid: string) => { await supabase.from('tasks').delete().eq('id', tid); },

    addBid: async (tid: string, bid: any, uid: string) => {
        await supabase.from('bids').insert({ task_id: tid, bidder_id: uid, amount: bid.amount, note: bid.note, planned_date: bid.plannedExecutionDate });
        await supabase.from('tasks').update({ bidding_started_at: new Date().toISOString() }).eq('id', tid);
    },

    addApproval: async (tid: string, uid: string) => { await supabase.from('approvals').insert({ task_id: tid, user_id: uid }); },

    readLedger: async (residence: string): Promise<LedgerEntry[]> => {
        try {
            // Jointure simple
            const { data, error } = await supabase.from('ledger').select(`*, payer_profile:payer_id(email), payee_profile:payee_id(email), tasks(title, created_at)`)
                .eq('residence', residence).order('created_at', { ascending: false });
            if (error) throw error;
            return (data || []).map(mapLedger);
        } catch (e) {
            // Fallback sans jointure si RLS bloque
            const { data } = await supabase.from('ledger').select('*').eq('residence', residence).order('created_at', { ascending: false });
            return (data || []).map(mapLedger);
        }
    },

    createLedgerEntry: async (entry: any, res: string) => {
        const { error } = await supabase.from('ledger').insert({
            task_id: entry.taskId, residence: res, type: entry.type,
            payer_id: entry.payerId, payee_id: entry.payeeId, amount: entry.amount
        });
        if (error) throw error;
    },

    deleteLedgerEntry: async (id: string) => { await supabase.from('ledger').delete().eq('id', id); },

    getPendingUsers: async (res: string): Promise<RegisteredUser[]> => {
        const { data } = await supabase.from('profiles').select('*').eq('residence', res).eq('status', 'pending');
        return (data || []).map(p => ({ ...p, firstName: p.first_name, lastName: p.last_name }));
    },

    approveUser: async (email: string) => { await supabase.from('profiles').update({ status: 'active' }).eq('email', email); },

    getDirectory: async (res: string): Promise<RegisteredUser[]> => {
        const { data } = await supabase.from('profiles').select('*').eq('residence', res).eq('status', 'active');
        return (data || []).map(p => ({ ...p, firstName: p.first_name, lastName: p.last_name }));
    }
};
