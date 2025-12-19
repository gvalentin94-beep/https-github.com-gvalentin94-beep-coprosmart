
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, UserRole, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api, formatTaskId } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE, AVATARS, RESIDENCES } from './constants';
import { LoginCard } from './components/LoginCard';
import { LegalModal, CGUContent, MentionsLegalesContent } from './components/LegalModals';

// --- Safe Version Access ---
const APP_VERSION = '0.2.38';

// --- Toast Notification System ---
interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto w-80 p-4 rounded-lg shadow-lg border transform transition-all duration-300 translate-y-0 opacity-100 flex justify-between items-start gap-2 ${
            t.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' :
            t.type === 'error' ? 'bg-rose-900/90 border-rose-700 text-rose-100' :
            'bg-slate-800/90 border-slate-700 text-slate-100'
          }`}
        >
          <div>
            <h4 className="font-bold text-sm">{t.title}</h4>
            <p className="text-xs opacity-90 mt-1 break-words">{t.message}</p>
          </div>
          <button onClick={() => onClose(t.id)} className="text-current opacity-50 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// --- Main App Component ---
export default function App() {
  const { user, setUser, loading: authLoading } = useAuth();
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedResidence, setSelectedResidence] = useState<string | null>("Résidence Watteau");
  
  // UI State
  const [tab, setTab] = useState<'dashboard' | 'directory' | 'ledger'>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
        const [t, l, p, u] = await Promise.all([
            api.readTasks(selectedResidence),
            api.readLedger(selectedResidence),
            api.getPendingUsers(selectedResidence),
            api.getDirectory(selectedResidence)
        ]);
        setTasks(t || []);
        setLedger(l || []);
        setPendingUsers(p || []);
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
          // RÉCUPÉRATION ROBUSTE DES UUID (Supabase exige des UUID pour le ledger)
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
             // Si on n'a toujours pas d'ID, on essaie de le chercher via l'annuaire complet
             const allUsers = await api.getDirectory(selectedResidence);
             const worker = allUsers.find(u => u.email === task.awardedTo);
             payeeId = worker?.id;
          }

          if (!payeeId) throw new Error("ID de l'intervenant introuvable. L'utilisateur doit être actif dans l'annuaire.");
          if (task.scope === 'apartment' && !payerId) throw new Error("ID du demandeur introuvable.");
          if (task.awardedAmount === undefined || task.awardedAmount === null) throw new Error("Montant de la prestation absent.");

          // 1. ÉCRITURE COMPTABLE
          await api.createLedgerEntry({
              taskId: task.id,
              type: task.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
              payerId: task.scope === 'copro' ? null : payerId,
              payeeId: payeeId,
              amount: task.awardedAmount
          }, selectedResidence);

          // 2. MISE À JOUR STATUT TÂCHE
          const timestamp = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          const validationNote = `\n\n[✅ VALIDATION EFFECTUÉE le ${timestamp}]\nValidé par : ${user.firstName} ${user.lastName}\nMontant transféré : ${task.awardedAmount}€`;
          await api.updateTaskDetails(task.id, (task.details || "") + validationNote);
          await api.updateTaskStatus(task.id, 'completed', { validatedBy: user.id });

          notify("Succès !", "Travaux validés et enregistrés au journal.", "success");
          
          // Notification Email (non bloquant)
          api.sendNotification(task.awardedTo!, `✅ Mission validée - ${task.title}`, 
             `<p>Félicitations ! Vos travaux sur <strong>${task.title}</strong> ont été approuvés.</p><p>Un crédit de <strong>${task.awardedAmount}€</strong> a été ajouté à votre journal CoproSmart.</p>`)
             .catch(e => console.warn("Email notify failed", e));

          refreshData();
      } catch (e: any) {
          console.error("handleComplete error", e);
          notify("Échec", e.message || "Erreur lors de la validation.", "error");
      }
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-indigo-500">Chargement...</div>;
  if (!user) return <LoginCard onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pb-0 font-sans selection:bg-indigo-500/30">
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg h-16 flex items-center">
        <div className="max-w-5xl mx-auto px-4 w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter text-white">CoproSmart<span className="text-indigo-500">.</span></h1>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>+ Nouvelle demande</Button>
            <div className="hidden md:flex gap-6 ml-6 border-l border-slate-700 pl-6">
                 <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}>Accueil</button>
                 <button onClick={() => setTab('directory')} className={tab === 'directory' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}>Annuaire</button>
                 <button onClick={() => setTab('ledger')} className={tab === 'ledger' ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}>Journal</button>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { api.logout(); setUser(null); }}>Déconnexion</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 min-h-[70vh]">
        {tab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Section title="1️⃣ À valider par le CS">
                    {tasks.filter(t => t.status === 'pending').length > 0 ? 
                        tasks.filter(t => t.status === 'pending').map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onApprove={() => api.addApproval(t.id, user.id).then(refreshData)} onReject={() => api.updateTaskStatus(t.id, 'rejected').then(refreshData)} onDelete={() => api.deleteTask(t.id).then(refreshData)} canDelete={user.role==='admin'} />) 
                        : <EmptyState icon="⏳" message="Aucune validation en attente." />}
                </Section>
                <Section title="2️⃣ Travaux en cours">
                    {tasks.filter(t => ['open', 'awarded', 'verification'].includes(t.status)).length > 0 ?
                        tasks.filter(t => ['open', 'awarded', 'verification'].includes(t.status)).map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={(b) => api.addBid(t.id, b, user.id).then(refreshData)} onAward={() => api.updateTaskStatus(t.id, 'awarded', { awardedTo: t.bids[0].userId, awardedAmount: t.bids[0].amount }).then(refreshData)} onComplete={() => handleComplete(t)} onDelete={() => api.deleteTask(t.id).then(refreshData)} canDelete={user.role==='admin'} />)
                        : <EmptyState icon="🔨" message="Pas de chantiers actifs." />}
                </Section>
            </div>
        )}
        {tab === 'ledger' && <Ledger entries={ledger} usersMap={usersMap} onDelete={(id: string) => api.deleteLedgerEntry(id).then(refreshData)} isAdmin={user.role === 'admin'} />}
        {tab === 'directory' && <div className="text-center py-20 text-slate-500">Contenu annuaire... (Chargement des profils)</div>}
      </main>

      {/* FOOTER */}
      <footer className="mt-20 py-12 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <div className="flex justify-center gap-8 mb-6">
             <button onClick={() => setShowCGU(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4">Conditions d'Utilisation</button>
             <button onClick={() => setShowMentions(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4">Mentions Légales</button>
        </div>
        <p>CoproSmart v{APP_VERSION} — Simple. Local. Gagnant-Gagnant.</p>
      </footer>

      {/* LEGAL MODALS */}
      <LegalModal title="Conditions Générales d'Utilisation" isOpen={showCGU} onClose={() => setShowCGU(false)}>
          <CGUContent />
      </LegalModal>

      <LegalModal title="Mentions Légales" isOpen={showMentions} onClose={() => setShowMentions(false)}>
          <MentionsLegalesContent />
      </LegalModal>
    </div>
  );
}

interface EmptyStateProps {
  icon: string;
  message: string;
}

function EmptyState({ icon, message }: EmptyStateProps) { 
  return <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
    <div className="text-3xl mb-2 opacity-40 grayscale">{icon}</div>
    <p className="text-slate-500 text-sm">{message}</p>
  </div>; 
}

interface LedgerProps {
  entries: LedgerEntry[];
  usersMap: Record<string, string>;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
}

function Ledger({ entries, usersMap, onDelete, isAdmin }: LedgerProps) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="bg-slate-950/50"><CardTitle>📒 Journal des écritures</CardTitle></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-slate-500 italic text-center py-10">Le journal est encore vide pour cette résidence.</p> : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-500 uppercase font-bold">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Nature</th>
                        <th className="p-4">Bénéficiaire</th>
                        <th className="p-4 text-right">Montant</th>
                        {isAdmin && <th className="p-4 text-center">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {entries.map((e: LedgerEntry) => (
                        <tr key={e.id} className="hover:bg-indigo-500/5 transition-colors">
                            <td className="p-4 text-slate-400">{new Date(e.at).toLocaleDateString()}</td>
                            <td className="p-4">
                                <div className="font-bold text-slate-200">{e.taskTitle}</div>
                                <div className="text-[10px] text-slate-500">Ref: #{formatTaskId(e.taskCreatedAt)}</div>
                            </td>
                            <td className="p-4 text-indigo-300 font-medium">{usersMap[e.payee] || e.payee}</td>
                            <td className="p-4 text-right font-black text-white text-base">{e.amount} €</td>
                            {isAdmin && e.id && (
                                <td className="p-4 text-center">
                                    <button 
                                      onClick={() => onDelete(e.id!)} 
                                      className="text-rose-500 hover:text-rose-400 text-[10px] font-bold uppercase tracking-widest"
                                    >
                                      Suppr
                                    </button>
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
