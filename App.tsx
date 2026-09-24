import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, UserRole, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api, formatTaskId, isConfigured } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE, AVATARS, RESIDENCES } from './constants';
import { LoginCard } from './components/LoginCard';
import { LegalModal, CGUContent, MentionsLegalesContent } from './components/LegalModals';
import { CreateTaskModal } from './components/CreateTaskModal';
import { DirectoryView } from './components/DirectoryView';

// --- Safe Version Access ---
const APP_VERSION = '0.2.36';

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
  
  const [selectedResidence, setSelectedResidence] = useState<string>("Résidence Watteau");
  
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

  const handleCreateTask = async (taskData: any) => {
    if (!user || !selectedResidence) return;
    try {
      await api.createTask(taskData, user.id, selectedResidence);
      notify("Demande enregistrée !", "Votre demande de travaux a été publiée avec succès.", "success");
      refreshData();
    } catch (e: any) {
      notify("Erreur", e.message || "Impossible de créer la tâche", "error");
    }
  };

  const handleApproveUser = async (email: string) => {
    try {
      await api.approveUser(email);
      notify("Accès validé", `L'utilisateur ${email} a été activé.`, "success");
      refreshData();
    } catch (e: any) {
      notify("Erreur", e.message || "Impossible de valider l'utilisateur", "error");
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      await api.deleteUser(email);
      notify("Utilisateur supprimé", `Le compte ${email} a été supprimé.`, "success");
      refreshData();
    } catch (e: any) {
      notify("Erreur", e.message || "Impossible de supprimer l'utilisateur", "error");
    }
  };

  const handleInviteUser = async (email: string) => {
    if (!user) return;
    try {
      await api.inviteUser(email, `${user.firstName} ${user.lastName}`);
      notify("Invitation envoyée", `Un message a été adressé à ${email}.`, "success");
    } catch (e: any) {
      notify("Information", "L'invitation a été enregistrée.", "info");
    }
  };

  const handleRate = async (taskId: string, rating: { stars: number; comment?: string }) => {
    if (!user) return;
    try {
      await api.addRating(taskId, rating, user.id);
      notify("Avis enregistré !", "Merci pour votre évaluation.", "success");
      refreshData();
    } catch (e: any) {
      notify("Erreur", e.message || "Impossible d'enregistrer la note", "error");
    }
  };

  const handleComplete = async (task: Task) => {
      if (!user || !selectedResidence) return;
      if (task.awardedTo === user.email && user.role !== 'admin') {
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

          if (!payeeId) throw new Error("Identifiant de l'intervenant introuvable.");
          if (task.scope === 'apartment' && !payerId) throw new Error("Identifiant du demandeur introuvable.");
          if (!task.awardedAmount) throw new Error("Montant de la prestation introuvable.");

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
          
          // Notification Email
          try {
             await api.sendNotification(task.awardedTo!, `✅ Mission validée - ${task.title}`, 
             `<p>Félicitations ! Vos travaux sur <strong>${task.title}</strong> ont été approuvés.</p><p>Un crédit de <strong>${task.awardedAmount}€</strong> a été ajouté à votre journal CoproSmart.</p>`);
          } catch(e) { console.warn("L'email n'a pas pu être envoyé mais l'opération est validée."); }

          refreshData();
      } catch (e: any) {
          console.error(e);
          notify("Échec", e.message || "Erreur lors de la validation.", "error");
      }
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-indigo-400 font-bold">Chargement de CoproSmart...</div>;
  if (!user) return <LoginCard onLogin={setUser} />;

  // 4 SECTIONS DEMANDÉES :
  // 1 : Demande de travaux (en attente de validation)
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  // 2 : Travaux à réaliser (approuvés, candidatures ouvertes ou attribués en cours de réalisation)
  const todoTasks = tasks.filter(t => ['open', 'awarded'].includes(t.status));
  // 3 : Travaux en attente de contrôle qualité (réalisés, preuve soumise, en attente de vérification)
  const verificationTasks = tasks.filter(t => t.status === 'verification');
  // 4 : Travaux terminés (validés et notés / archivés)
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pb-12 font-sans selection:bg-indigo-500/30">
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg min-h-16 py-2 flex items-center">
        <div className="max-w-5xl mx-auto px-4 w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter text-white">CoproSmart<span className="text-indigo-500">.</span></h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 hidden sm:inline-block">
                {selectedResidence}
              </span>
            </div>
            <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-500 font-bold">
              + Nouvelle demande
            </Button>
            <div className="flex gap-4 sm:gap-6 border-l border-slate-800 pl-4">
                 <button onClick={() => setTab('dashboard')} className={tab === 'dashboard' ? 'text-white font-bold border-b-2 border-indigo-500 pb-0.5' : 'text-slate-400 hover:text-white transition'}>Accueil</button>
                 <button onClick={() => setTab('directory')} className={tab === 'directory' ? 'text-white font-bold border-b-2 border-indigo-500 pb-0.5' : 'text-slate-400 hover:text-white transition'}>
                   Annuaire {pendingUsers.length > 0 && <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] rounded-full font-black">{pendingUsers.length}</span>}
                 </button>
                 <button onClick={() => setTab('ledger')} className={tab === 'ledger' ? 'text-white font-bold border-b-2 border-indigo-500 pb-0.5' : 'text-slate-400 hover:text-white transition'}>Journal</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">{user.firstName} {user.lastName}</div>
              <div className="text-[10px] text-indigo-300 font-medium">
                {user.role === 'admin' 
                  ? '👑 Admin • 🛡️ CS • 👤 Copro' 
                  : user.role === 'council' 
                  ? '🛡️ CS • 👤 Copropriétaire' 
                  : '👤 Copropriétaire'}
              </div>
            </div>

            <Button size="sm" variant="ghost" onClick={() => { api.logout(); setUser(null); }} className="text-slate-400 hover:text-white">
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 min-h-[70vh]">
        {tab === 'dashboard' && (
            <div className="space-y-8">
              {/* SECTION 1: Demande de travaux */}
              <Section title="1️⃣ Demande de travaux">
                  {pendingTasks.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {pendingTasks.map(t => (
                          <TaskCard 
                            key={t.id} 
                            task={t} 
                            me={user} 
                            usersMap={usersMap} 
                            users={users}
                            onApprove={() => api.addApproval(t.id, user.id).then(refreshData)} 
                            onReject={() => api.updateTaskStatus(t.id, 'rejected').then(refreshData)} 
                            onDelete={() => api.deleteTask(t.id).then(refreshData)} 
                            canDelete={user.role==='admin'} 
                          />
                        ))}
                      </div>
                  ) : (
                      <EmptyState icon="⏳" message="Aucune demande de travaux en attente de validation." />
                  )}
              </Section>

              {/* SECTION 2: Travaux à réaliser */}
              <Section title="2️⃣ Travaux à réaliser">
                  {todoTasks.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {todoTasks.map(t => (
                          <TaskCard 
                            key={t.id} 
                            task={t} 
                            me={user} 
                            usersMap={usersMap} 
                            users={users}
                            onBid={(b) => api.addBid(t.id, b, user.id).then(refreshData)} 
                            onAward={() => api.updateTaskStatus(t.id, 'awarded', { awardedTo: t.bids[0].userId, awardedAmount: t.bids[0].amount }).then(refreshData)} 
                            onRequestVerification={() => api.updateTaskStatus(t.id, 'verification').then(refreshData)}
                            onRejectWork={() => api.updateTaskStatus(t.id, 'awarded').then(refreshData)}
                            onComplete={() => handleComplete(t)} 
                            onRate={(r) => handleRate(t.id, r)} 
                            onDelete={() => api.deleteTask(t.id).then(refreshData)} 
                            canDelete={user.role==='admin'} 
                          />
                        ))}
                      </div>
                  ) : (
                      <EmptyState icon="🔨" message="Aucun travail à réaliser actuellement." />
                  )}
              </Section>

              {/* SECTION 3: Travaux en attente de contrôle qualité */}
              <Section title="3️⃣ Travaux en attente de contrôle qualité">
                  {verificationTasks.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {verificationTasks.map(t => (
                          <TaskCard 
                            key={t.id} 
                            task={t} 
                            me={user} 
                            usersMap={usersMap} 
                            users={users}
                            onRequestVerification={() => api.updateTaskStatus(t.id, 'verification').then(refreshData)}
                            onRejectWork={() => api.updateTaskStatus(t.id, 'awarded').then(refreshData)}
                            onComplete={() => handleComplete(t)} 
                            onRate={(r) => handleRate(t.id, r)} 
                            onDelete={() => api.deleteTask(t.id).then(refreshData)} 
                            canDelete={user.role==='admin'} 
                          />
                        ))}
                      </div>
                  ) : (
                      <EmptyState icon="🔍" message="Aucun chantier en attente de contrôle qualité." />
                  )}
              </Section>

              {/* SECTION 4: Travaux terminés */}
              <Section title="4️⃣ Travaux terminés">
                {completedTasks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {completedTasks.map(t => (
                      <TaskCard 
                        key={t.id} 
                        task={t} 
                        me={user} 
                        usersMap={usersMap} 
                        users={users}
                        onRate={(r) => handleRate(t.id, r)} 
                        onDelete={() => api.deleteTask(t.id).then(refreshData)} 
                        canDelete={user.role==='admin'} 
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="🏆" message="Aucun travail terminé enregistré." />
                )}
              </Section>
            </div>
        )}

        {tab === 'ledger' && (
          <Ledger 
            entries={ledger} 
            usersMap={usersMap} 
            onDelete={(id: string) => api.deleteLedgerEntry(id).then(refreshData)} 
            isAdmin={user.role === 'admin'} 
          />
        )}

        {tab === 'directory' && (
          <DirectoryView 
            users={users} 
            pendingUsers={pendingUsers} 
            currentUser={user} 
            onApproveUser={handleApproveUser} 
            onInviteUser={handleInviteUser} 
            onDeleteUser={user.role === 'admin' ? handleDeleteUser : undefined}
          />
        )}
      </main>

      {/* MODAL NOUVELLE DEMANDE */}
      <CreateTaskModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onSubmit={handleCreateTask} 
        isAdmin={user.role === 'admin'}
      />

      {/* FOOTER */}
      <footer className="mt-20 py-12 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <div className="flex justify-center gap-8 mb-4">
             <button onClick={() => setShowCGU(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4 transition">Conditions d'Utilisation</button>
             <button onClick={() => setShowMentions(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4 transition">Mentions Légales</button>
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

function EmptyState({ icon, message }: { icon: string; message: string }) { 
  return (
    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
      <div className="text-3xl mb-2 opacity-50">{icon}</div>
      <p className="text-slate-400 text-xs">{message}</p>
    </div>
  ); 
}

interface LedgerProps {
  entries: LedgerEntry[];
  usersMap: Record<string, string>;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

function Ledger({ entries, usersMap, onDelete, isAdmin }: LedgerProps) {
  const totalAmount = useMemo(() => entries.reduce((acc, e) => acc + (Number(e.amount) || 0), 0), [entries]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/80 border-slate-800 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total des économies</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{totalAmount} €</div>
          <div className="text-[10px] text-slate-500 mt-0.5">remisés sur les charges de la copropriété</div>
        </Card>
        <Card className="bg-slate-900/80 border-slate-800 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prestations validées</div>
          <div className="text-2xl font-black text-white mt-1">{entries.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">missions de maintenance réalisées</div>
        </Card>
        <Card className="bg-slate-900/80 border-slate-800 p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Économie moyenne</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">
            {entries.length > 0 ? Math.round(totalAmount / entries.length) : 0} €
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">par intervention de résident</div>
        </Card>
      </div>

      <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
        <CardHeader className="bg-slate-950/60 border-b border-slate-800">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            📒 Journal des écritures comptables
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-slate-500 italic text-center py-10 text-xs">Le journal est encore vide pour cette résidence.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                      <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Prestation</th>
                          <th className="p-3">Bénéficiaire (Crédité)</th>
                          <th className="p-3">Débiteur</th>
                          <th className="p-3 text-right">Crédit</th>
                          {isAdmin && <th className="p-3 text-center">Action</th>}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                      {entries.map((e) => (
                          <tr key={e.id} className="hover:bg-indigo-500/5 transition-colors">
                              <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                {new Date(e.at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="p-3">
                                  <div className="font-bold text-slate-200">{e.taskTitle}</div>
                                  <div className="text-[10px] text-slate-500">Ref: #{formatTaskId(e.taskCreatedAt)}</div>
                              </td>
                              <td className="p-3 text-indigo-300 font-medium">
                                {usersMap[e.payee] || e.payee}
                              </td>
                              <td className="p-3 text-slate-400">
                                {e.type === 'charge_credit' ? (
                                  <Badge className="bg-indigo-950 text-indigo-300 border-indigo-800/50">Copro (Charges)</Badge>
                                ) : (
                                  <Badge className="bg-pink-950 text-pink-300 border-pink-800/50">Privatif</Badge>
                                )}
                              </td>
                              <td className="p-3 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                                +{e.amount} €
                              </td>
                              {isAdmin && (
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => e.id && onDelete(e.id)}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold hover:underline"
                                    title="Supprimer l'écriture"
                                  >
                                    Supprimer
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
    </div>
  );
}
