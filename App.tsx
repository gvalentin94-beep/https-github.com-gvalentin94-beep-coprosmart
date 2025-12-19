
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, UserRole, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api, formatTaskId } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE, AVATARS, RESIDENCES } from './constants';
import { LoginCard } from './components/LoginCard';

// --- Safe Version Access ---
const APP_VERSION = '0.2.35';

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

// --- Legal Content Modals ---
interface LegalModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

function LegalModal({ title, isOpen, onClose, children }: LegalModalProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                <CardHeader className="border-b border-slate-800 shrink-0">
                    <div className="flex justify-between items-center">
                        <CardTitle>{title}</CardTitle>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
                    </div>
                </CardHeader>
                <div className="p-6 overflow-y-auto text-sm text-slate-300 leading-relaxed space-y-4">
                    {children}
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0 flex justify-end">
                    <Button onClick={onClose}>Fermer</Button>
                </div>
            </Card>
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
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [taskToReject, setTaskToReject] = useState<Task | null>(null);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>("ampoule");
  const [newTaskScope, setNewTaskScope] = useState<TaskScope>("copro");
  const [newTaskLocation, setNewTaskLocation] = useState(LOCATIONS[0]);
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [newTaskPrice, setNewTaskPrice] = useState("20");
  const [newTaskWarranty, setNewTaskWarranty] = useState("0");
  const [newTaskPhoto, setNewTaskPhoto] = useState<string | null>(null);
  const [previewTask, setPreviewTask] = useState<Partial<Task> | null>(null);

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
        setTasks(t);
        setLedger(l);
        setPendingUsers(p);
        setUsers(u);
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
          // Extraction robuste des IDs UUID requis pour le ledger
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

          if (!payeeId) throw new Error("ID de l'intervenant introuvable.");
          if (task.scope === 'apartment' && !payerId) throw new Error("ID du demandeur introuvable.");
          if (!task.awardedAmount) throw new Error("Montant introuvable.");

          // 1. D'abord on crée l'écriture comptable (plus critique)
          if (task.scope === 'copro') {
              await api.createLedgerEntry({
                  taskId: task.id,
                  type: 'charge_credit',
                  payerId: null,
                  payeeId: payeeId,
                  amount: task.awardedAmount
              }, selectedResidence);
          } else {
               await api.createLedgerEntry({
                  taskId: task.id,
                  type: 'apartment_payment',
                  payerId: payerId,
                  payeeId: payeeId,
                  amount: task.awardedAmount
              }, selectedResidence);
          }

          // 2. Puis on met à jour le statut de la tâche
          const timestamp = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          const validationNote = `\n\n[✅ VALIDATION EFFECTUÉE le ${timestamp}]\nValidé par : ${user.firstName} ${user.lastName}\nMontant : ${task.awardedAmount}€`;
          await api.updateTaskDetails(task.id, (task.details || "") + validationNote);
          await api.updateTaskStatus(task.id, 'completed', { validatedBy: user.id });

          notify("Terminé !", "Travaux validés et journal mis à jour.", "success");
          
          // Email
          try {
             await api.sendNotification(task.awardedTo!, `✅ Travaux validés - ${task.title}`, 
             `<p>Bravo ! Votre travail sur <strong>${task.title}</strong> a été validé et ${task.awardedAmount}€ ont été crédités.</p>`);
          } catch(e) { console.warn("Email non envoyé", e); }

          refreshData();
      } catch (e: any) {
          console.error(e);
          notify("Erreur Journal", e.message || "Échec de l'écriture comptable.", "error");
      }
  };

  const handleCreateTask = async () => {
    if (!user || !selectedResidence) return;
    try {
        const newTaskId = await api.createTask({
            title: newTaskTitle, category: newTaskCategory, scope: newTaskScope, location: newTaskLocation,
            details: newTaskDetails, startingPrice: Number(newTaskPrice), warrantyDays: Number(newTaskWarranty),
            status: 'pending', photo: newTaskPhoto || undefined
        }, user.id, selectedResidence);
        if (user.role === 'council' || user.role === 'admin') await api.addApproval(newTaskId, user.id);
        setPreviewTask(null); setShowCreateModal(false);
        setNewTaskTitle(""); setNewTaskDetails(""); setNewTaskPrice("20"); setNewTaskPhoto(null);
        await refreshData(); setTab('dashboard');
    } catch (e) { notify("Erreur", "Impossible de créer la demande.", "error"); }
  };

  const handleInviteUser = async (email: string) => {
    try {
        await api.inviteUser(email, `${user!.firstName} ${user!.lastName}`);
        notify("Succès", `Invitation envoyée à ${email}`, "success");
    } catch (e: any) {
        notify("Erreur Email", "Le service d'email n'est pas encore configuré ou la limite journalière est atteinte.", "error");
    }
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-indigo-500">Chargement...</div>;
  if (!user) return <><LoginCard onLogin={setUser} /><div className="fixed bottom-2 right-2 text-[10px] text-slate-700 font-mono">v{APP_VERSION}</div></>;

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
                 <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'text-white font-bold' : 'text-slate-400'}>Accueil</button>
                 <button onClick={() => setTab('directory')} className={tab === 'directory' ? 'text-white font-bold' : 'text-slate-400'}>Annuaire</button>
                 <button onClick={() => setTab('ledger')} className={tab === 'ledger' ? 'text-white font-bold' : 'text-slate-400'}>Journal</button>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => { api.logout(); setUser(null); }}>Déconnexion</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 min-h-[70vh]">
        {tab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Section title="1️⃣ À valider">
                    {tasks.filter(t => t.status === 'pending').length > 0 ? 
                        tasks.filter(t => t.status === 'pending').map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onApprove={() => api.addApproval(t.id, user.id).then(refreshData)} onReject={() => api.updateTaskStatus(t.id, 'rejected').then(refreshData)} onDelete={() => api.deleteTask(t.id).then(refreshData)} canDelete={user.role==='admin'} />) 
                        : <EmptyState icon="⏳" message="Rien à valider." />}
                </Section>
                <Section title="2️⃣ En cours">
                    {tasks.filter(t => ['open', 'awarded', 'verification'].includes(t.status)).length > 0 ?
                        tasks.filter(t => ['open', 'awarded', 'verification'].includes(t.status)).map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={(b) => api.addBid(t.id, b, user.id).then(refreshData)} onAward={() => api.updateTaskStatus(t.id, 'awarded', { awardedTo: t.bids[0].userId, awardedAmount: t.bids[0].amount }).then(refreshData)} onComplete={() => handleComplete(t)} onRate={() => {}} onDelete={() => api.deleteTask(t.id).then(refreshData)} canDelete={user.role==='admin'} />)
                        : <EmptyState icon="🔨" message="Aucun chantier." />}
                </Section>
            </div>
        )}
        {tab === 'ledger' && <Ledger entries={ledger} usersMap={usersMap} onDelete={(id) => api.deleteLedgerEntry(id).then(refreshData)} isAdmin={user.role === 'admin'} />}
      </main>

      {/* FOOTER */}
      <footer className="mt-20 py-12 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <div className="flex justify-center gap-8 mb-6">
             <button onClick={() => setShowCGU(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4">CGU</button>
             <button onClick={() => setShowMentions(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4">Mentions Légales</button>
        </div>
        <p>CoproSmart v{APP_VERSION} — Simple. Local. Gagnant-Gagnant.</p>
      </footer>

      {/* MODALS JURIDIQUES */}
      <LegalModal title="Conditions Générales d'Utilisation" isOpen={showCGU} onClose={() => setShowCGU(false)}>
          <h3 className="font-bold text-white">1. Objet</h3>
          <p>CoproSmart est une plateforme collaborative permettant aux copropriétaires d'effectuer des petits travaux de maintenance au sein de leur résidence en échange de crédits sur leurs charges.</p>
          <h3 className="font-bold text-white">2. Responsabilité</h3>
          <p>Chaque intervenant agit sous sa propre responsabilité. Les travaux doivent être réalisés dans le respect des règles de sécurité. CoproSmart décline toute responsabilité en cas de dommage matériel ou corporel.</p>
          <h3 className="font-bold text-white">3. Validation des travaux</h3>
          <p>Le Conseil Syndical est seul juge de la qualité des travaux réalisés pour débloquer les crédits comptables.</p>
      </LegalModal>

      <LegalModal title="Mentions Légales" isOpen={showMentions} onClose={() => setShowMentions(false)}>
          <p><strong>Éditeur :</strong> CoproSmart SAS, au capital de 1000€, immatriculée au RCS de Paris.</p>
          <p><strong>Siège social :</strong> Résidence Watteau, Paris, France.</p>
          <p><strong>Hébergement :</strong> Vercel Inc., 340 S Lemon Ave #1150 Walnut, CA 91789, USA.</p>
          <p><strong>Données personnelles :</strong> Conformément au RGPD, vous disposez d'un droit d'accès et de suppression de vos données via votre profil utilisateur.</p>
      </LegalModal>
    </div>
  );
}

// Composants auxiliaires simplifiés pour l'exemple
function EmptyState({ icon, message }: any) { return <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl"><div className="text-3xl mb-2 opacity-50">{icon}</div><p className="text-slate-500">{message}</p></div>; }
function Ledger({ entries, usersMap, onDelete, isAdmin }: any) {
  return (
    <Card className="bg-slate-900/50">
      <CardHeader><CardTitle>📒 Journal des écritures</CardTitle></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-slate-500 italic text-center py-10">Le journal est vide.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-xs text-left"><thead className="bg-slate-950 text-slate-500 uppercase"><tr><th className="p-3">Date</th><th className="p-3">Travail</th><th className="p-3">Bénéficiaire</th><th className="p-3 text-right">Montant</th></tr></thead>
          <tbody className="divide-y divide-slate-800">{entries.map((e:any) => (<tr key={e.id} className="hover:bg-slate-800/30"><td className="p-3">{new Date(e.at).toLocaleDateString()}</td><td className="p-3"><div>{e.taskTitle}</div><div className="text-[10px] text-slate-500">#{formatTaskId(e.taskCreatedAt)}</div></td><td className="p-3">{usersMap[e.payee] || e.payee}</td><td className="p-3 text-right font-bold text-white">{e.amount} €</td></tr>))}</tbody></table></div>
        )}
      </CardContent>
    </Card>
  );
}
