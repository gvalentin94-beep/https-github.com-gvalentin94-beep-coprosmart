
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, UserRole, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api, formatTaskId } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE, AVATARS, RESIDENCES } from './constants';
import { LoginCard } from './components/LoginCard';
import { LegalModal, CGUContent, MentionsLegalesContent } from './components/LegalModals';

const APP_VERSION = '0.2.39';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-80 p-4 rounded-xl shadow-2xl border transform transition-all duration-300 animate-in slide-in-from-right-10 flex justify-between items-start gap-3 ${
            t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
            t.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
            'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex-1">
            <h4 className="font-bold text-sm leading-tight">{t.title}</h4>
            <p className="text-xs opacity-80 mt-1 leading-normal">{t.message}</p>
          </div>
          <button onClick={() => onClose(t.id)} className="text-current opacity-40 hover:opacity-100 p-1">✕</button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { user, setUser, loading: authLoading } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedResidence, setSelectedResidence] = useState<string | null>("Résidence Watteau");
  const [tab, setTab] = useState<'dashboard' | 'directory' | 'ledger'>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCGU, setShowCGU] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  
  const usersMap = useMemo(() => {
    return users.reduce((acc, u) => ({ 
        ...acc, 
        [u.email]: `${u.firstName} ${u.lastName}`,
        [u.id]: `${u.firstName} ${u.lastName}` 
    }), {} as Record<string, string>);
  }, [users]);

  const notify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const refreshData = useCallback(async () => {
    if (!user || !selectedResidence) return;
    setLoading(true);
    try {
        const [t, l, u] = await Promise.all([
            api.readTasks(selectedResidence),
            api.readLedger(selectedResidence),
            api.getDirectory(selectedResidence)
        ]);
        setTasks(t || []);
        setLedger(l || []);
        setUsers(u || []);
    } catch (e) {
        console.error("Refresh fail", e);
    } finally {
        setLoading(false);
    }
  }, [user, selectedResidence]);

  useEffect(() => {
    if (user) {
        if (user.role !== 'admin' && user.residence && user.residence !== selectedResidence) {
            setSelectedResidence(user.residence);
        } else if (selectedResidence) {
            refreshData();
        }
    }
  }, [user, refreshData, selectedResidence]);

  const handleComplete = async (task: Task) => {
      if (!user || !selectedResidence) return;
      if (task.awardedTo === user.email) {
          notify("Action impossible", "Un membre du Conseil Syndical ne peut pas valider son propre travail.", "error");
          return;
      }

      try {
          let payeeId = task.awardedToId;
          if (!payeeId && task.awardedTo) {
             const worker = users.find(u => u.email === task.awardedTo);
             payeeId = worker?.id;
          }

          let payerId = task.createdById;
          if (!payerId && task.createdBy) {
              const creator = users.find(u => u.email === task.createdBy);
              payerId = creator?.id;
          }

          if (!payeeId) {
             const allUsers = await api.getDirectory(selectedResidence);
             payeeId = allUsers.find(u => u.email === task.awardedTo)?.id;
          }

          if (!payeeId) throw new Error("ID de l'intervenant introuvable.");
          if (task.scope === 'apartment' && !payerId) throw new Error("ID du demandeur introuvable.");

          await api.createLedgerEntry({
              taskId: task.id,
              type: task.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
              payerId: task.scope === 'copro' ? null : payerId,
              payeeId: payeeId,
              amount: task.awardedAmount
          }, selectedResidence);

          const timestamp = new Date().toLocaleDateString('fr-FR');
          const validationNote = `\n[Validé le ${timestamp} par ${user.firstName} ${user.lastName}]`;
          await api.updateTaskDetails(task.id, (task.details || "") + validationNote);
          await api.updateTaskStatus(task.id, 'completed', { validatedBy: user.id });

          notify("Succès", "Validation effectuée et crédit enregistré.", "success");
          api.sendNotification(task.awardedTo!, `Mission validée - ${task.title}`, `<p>Votre travail sur <strong>${task.title}</strong> a été validé.</p>`).catch(e => console.warn(e));
          refreshData();
      } catch (e: any) {
          notify("Échec", e.message || "Erreur lors de la validation.", "error");
      }
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-indigo-500 font-medium">Chargement...</div>;
  if (!user) return <LoginCard onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* HEADER PLUS SOBRE */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 h-16 flex items-center shadow-sm">
        <div className="max-w-6xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-white tracking-tight">CoproSmart<span className="text-indigo-500">.</span></h1>
            <nav className="hidden md:flex gap-6">
                 <button onClick={() => setTab('dashboard')} className={`text-sm font-medium transition-colors ${tab === 'dashboard' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>Tableau de bord</button>
                 <button onClick={() => setTab('directory')} className={`text-sm font-medium transition-colors ${tab === 'directory' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>Annuaire</button>
                 <button onClick={() => setTab('ledger')} className={`text-sm font-medium transition-colors ${tab === 'ledger' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>Journal</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-slate-500 font-medium">Bonjour, {user.firstName}</span>
            <Button size="sm" variant="outline" onClick={() => { api.logout(); setUser(null); }}>Déconnexion</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-10 min-h-[calc(100vh-140px)]">
        {tab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Section title="En attente de validation">
                    {tasks.filter(t => t.status === 'pending').length > 0 ? 
                        tasks.filter(t => t.status === 'pending').map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onApprove={() => api.addApproval(t.id, user.id).then(refreshData)} onReject={() => api.updateTaskStatus(t.id, 'rejected').then(refreshData)} onDelete={() => api.deleteTask(t.id).then(refreshData)} canDelete={user.role==='admin'} />) 
                        : <div className="p-8 text-center text-slate-500 italic text-sm border border-slate-800 rounded-xl bg-slate-900/20">Aucune demande en attente.</div>}
                </Section>
                <Section title="Chantiers actifs">
                    {tasks.filter(t => ['open', 'awarded', 'verification'].includes(t.status)).length > 0 ?
                        tasks.filter(t => ['open', 'awarded', 'verification'].includes(t.status)).map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={(b) => api.addBid(t.id, b, user.id).then(refreshData)} onAward={() => api.updateTaskStatus(t.id, 'awarded', { awardedTo: t.bids[0].userId, awardedAmount: t.bids[0].amount }).then(refreshData)} onComplete={() => handleComplete(t)} onDelete={() => api.deleteTask(t.id).then(refreshData)} canDelete={user.role==='admin'} />)
                        : <div className="p-8 text-center text-slate-500 italic text-sm border border-slate-800 rounded-xl bg-slate-900/20">Pas de travaux en cours.</div>}
                </Section>
            </div>
        )}
        
        {tab === 'ledger' && <Ledger entries={ledger} usersMap={usersMap} isAdmin={user.role === 'admin'} onDelete={(id: string) => api.deleteLedgerEntry(id).then(refreshData)} />}
        
        {tab === 'directory' && <div className="p-20 text-center text-slate-600 font-medium">L'annuaire de la résidence est en cours de synchronisation...</div>}
      </main>

      {/* FOOTER DISCRET ET CLASSIQUE */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-slate-500 text-xs font-medium uppercase tracking-widest">CoproSmart v{APP_VERSION}</div>
            <div className="flex gap-6">
                <button onClick={() => setShowCGU(true)} className="text-slate-500 hover:text-indigo-400 text-xs font-medium underline-offset-4 hover:underline">Conditions d'Utilisation</button>
                <button onClick={() => setShowMentions(true)} className="text-slate-500 hover:text-indigo-400 text-xs font-medium underline-offset-4 hover:underline">Mentions Légales</button>
            </div>
        </div>
      </footer>

      <LegalModal title="Conditions Générales d'Utilisation" isOpen={showCGU} onClose={() => setShowCGU(false)}><CGUContent /></LegalModal>
      <LegalModal title="Mentions Légales" isOpen={showMentions} onClose={() => setShowMentions(false)}><MentionsLegalesContent /></LegalModal>
    </div>
  );
}

interface LedgerProps {
  entries: LedgerEntry[];
  usersMap: Record<string, string>;
  isAdmin: boolean;
  onDelete: (id: string) => Promise<void>;
}

function Ledger({ entries, usersMap, isAdmin, onDelete }: LedgerProps) {
  return (
    <Card className="bg-slate-900/40 border-slate-800">
      <CardHeader><CardTitle>Historique du Journal</CardTitle></CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? <p className="p-12 text-slate-500 text-center italic text-sm font-medium">Aucune écriture enregistrée.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-950/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Désignation</th>
                        <th className="px-6 py-4">Bénéficiaire</th>
                        <th className="px-6 py-4 text-right">Crédit (€)</th>
                        {isAdmin && <th className="px-6 py-4 text-center">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {entries.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{new Date(e.at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-200">{e.taskTitle}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Ref: {formatTaskId(e.taskCreatedAt)}</div>
                            </td>
                            <td className="px-6 py-4 text-indigo-400 font-medium">{usersMap[e.payee] || e.payee}</td>
                            <td className="px-6 py-4 text-right font-bold text-white text-base">{e.amount} €</td>
                            {isAdmin && (
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => onDelete(e.id!)} className="text-rose-500 hover:text-rose-400 font-bold text-[10px] uppercase">Annuler</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
