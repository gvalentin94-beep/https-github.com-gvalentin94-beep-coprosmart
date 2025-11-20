
import React, { useState, useEffect, useCallback } from 'react';
import type { Task, User, LedgerEntry, TaskCategory, TaskScope, Rating, Bid, RegisteredUser, UserRole } from './types';
import { useAuth, fakeApi } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE } from './constants';
import { LoginCard } from './components/LoginCard';

// --- Toast Notification System ---
interface Toast {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

function Toaster({ toasts, onDismiss }: { toasts: Toast[], onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto w-80 p-4 rounded-lg shadow-lg border backdrop-blur-md transition-all transform translate-y-0 opacity-100 ${
          t.type === 'success' ? 'bg-emerald-900/80 border-emerald-700 text-emerald-100' :
          t.type === 'warning' ? 'bg-amber-900/80 border-amber-700 text-amber-100' :
          'bg-slate-800/80 border-slate-600 text-slate-200'
        }`}>
          <div className="flex justify-between items-start">
             <div>
               <h4 className="font-bold text-sm">{t.title}</h4>
               <p className="text-xs opacity-90 mt-1">{t.message}</p>
             </div>
             <button onClick={() => onDismiss(t.id)} className="text-xs hover:opacity-70">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Components ---

function TaskPreviewModal({ taskData, onConfirm, onCancel, isSubmitting }: any) {
    const categoryLabel = CATEGORIES.find(c => c.id === taskData.category)?.label || taskData.category;
    const scopeLabel = SCOPES.find(s => s.id === taskData.scope)?.label || taskData.scope;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 shadow-2xl">
                <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-xl text-white">🔍 Vérifiez votre tâche</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {taskData.photo && (
                        <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                             <img src={taskData.photo} alt="Aperçu" className="w-full h-full object-cover" />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                             <Label>Titre</Label>
                             <p className="text-lg font-bold text-white">{taskData.title}</p>
                        </div>
                         <div>
                             <Label>Prix de départ</Label>
                             <p className="text-lg font-bold text-indigo-400">{taskData.startingPrice} €</p>
                        </div>
                        <div>
                             <Label>Catégorie</Label>
                             <p className="text-slate-300">{categoryLabel}</p>
                        </div>
                        <div>
                             <Label>Concerne</Label>
                             <p className="text-slate-300">{scopeLabel}</p>
                        </div>
                         <div>
                             <Label>Emplacement</Label>
                             <p className="text-slate-300">{taskData.location}</p>
                        </div>
                        <div>
                             <Label>Garantie</Label>
                             <p className="text-slate-300">{taskData.warrantyDays > 0 ? `${taskData.warrantyDays / 30} mois` : 'Sans garantie'}</p>
                        </div>
                    </div>
                    <div>
                         <Label>Détails</Label>
                         <p className="text-slate-300 bg-slate-800 p-3 rounded-lg">{taskData.details}</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <Button variant="ghost" onClick={onCancel}>Modifier</Button>
                        <Button onClick={onConfirm} disabled={isSubmitting}>
                            {isSubmitting ? 'Envoi en cours...' : 'Confirmer et soumettre'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function UserValidationQueue({ onApprove, onReject }: { onApprove: (email: string) => void, onReject: (email: string) => void }) {
    const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);

    useEffect(() => {
        fakeApi.getPendingUsers().then(setPendingUsers);
        const interval = setInterval(() => fakeApi.getPendingUsers().then(setPendingUsers), 5000);
        return () => clearInterval(interval);
    }, []);

    if (pendingUsers.length === 0) return null;

    return (
        <Section title="👥 Inscriptions en attente" color="rose">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingUsers.map(u => (
                    <Card key={u.email} className="border-rose-500/30 bg-rose-900/10">
                        <CardContent className="flex flex-col gap-2 p-4">
                            <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                            <div className="text-sm text-rose-200">{u.email}</div>
                            <Badge className="w-fit">{ROLES.find(r => r.id === u.role)?.label}</Badge>
                            <div className="text-xs text-rose-300 mt-1">Résidence Watteau</div>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" className="bg-emerald-600 text-white border-none hover:bg-emerald-500" onClick={() => onApprove(u.email)}>Valider</Button>
                                <Button size="sm" variant="destructive" onClick={() => onReject(u.email)}>Refuser</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </Section>
    );
}

function Ledger({ isAdmin, onDeleteEntry, usersMap }: { isAdmin: boolean, onDeleteEntry: (idx: number) => void, usersMap: Record<string, string> }) {
  const [entries, setEntries] = useState<(LedgerEntry & { taskTitle?: string, taskCreator?: string })[]>([]);

  useEffect(() => {
    fakeApi.readLedger().then(async (data) => {
        const tasks = await fakeApi.readTasks();
        const enriched = data.map((entry: any) => {
            const task = tasks.find(t => t.id === entry.taskId);
            return {
                ...entry,
                taskTitle: task?.title || 'Tâche inconnue',
                taskCreator: task ? (usersMap[task.createdBy] || task.createdBy) : 'Inconnu'
            };
        });
        setEntries(enriched);
    });
  }, [usersMap]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300 border-collapse">
        <thead className="bg-slate-800 text-slate-100 uppercase tracking-wider text-xs">
          <tr>
            <th className="p-3 rounded-tl-lg">Date</th>
            <th className="p-3">Type</th>
            <th className="p-3">Tâche</th>
            <th className="p-3">Payeur</th>
            <th className="p-3">Bénéficiaire</th>
            <th className="p-3 text-right">Montant</th>
            {isAdmin && <th className="p-3 text-center rounded-tr-lg w-10">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-slate-800/50">
          {entries.length === 0 ? (
            <tr><td colSpan={isAdmin ? 7 : 6} className="p-4 text-center italic opacity-50">Aucune écriture comptable.</td></tr>
          ) : (
            entries.map((e, i) => (
              <tr key={i} className="hover:bg-slate-700/50 transition-colors">
                <td className="p-3">{new Date(e.at).toLocaleDateString()}</td>
                <td className="p-3">
                    <Badge color={e.type === 'charge_credit' ? 'indigo' : 'emerald'}>
                        {e.type === 'charge_credit' ? 'Crédit Charges' : 'Paiement Direct'}
                    </Badge>
                </td>
                <td className="p-3">
                    <div className="font-medium text-white">{e.taskTitle}</div>
                    <div className="text-xs text-slate-500">par {e.taskCreator}</div>
                </td>
                <td className="p-3">{e.payer === 'Copro' ? '🏢 Copropriété' : (usersMap[e.payer] || e.payer)}</td>
                <td className="p-3">{usersMap[e.payee] || e.payee}</td>
                <td className="p-3 text-right font-bold text-white">{e.amount} €</td>
                {isAdmin && (
                    <td className="p-3 text-center">
                        <button onClick={() => onDeleteEntry(i)} className="text-rose-400 hover:text-rose-300 p-1 transition" title="Supprimer l'écriture">
                            🗑️
                        </button>
                    </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CreateTaskForm({ onCreate, isSubmitting }: { onCreate: (t: Partial<Task>) => void, isSubmitting: boolean }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("ampoule");
  const [scope, setScope] = useState<TaskScope>("copro");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [startingPrice, setStartingPrice] = useState("");
  const [warrantyDays, setWarrantyDays] = useState("0");
  const [photo, setPhoto] = useState("");
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPhoto(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmitClick = () => {
      if (!title.trim()) { alert("Le titre est obligatoire."); return; }
      if (!location.trim()) { alert("L'emplacement est obligatoire."); return; }
      const price = Number(startingPrice);
      if (!price || price <= 0) { alert("Le prix de départ doit être positif."); return; }
      if (price > MAX_TASK_PRICE) { alert(`Le prix maximum autorisé est de ${MAX_TASK_PRICE}€.`); return; }
      
      setShowPreview(true);
  };

  const handleConfirmCreate = () => {
       onCreate({
          title,
          category,
          scope,
          details,
          location,
          startingPrice: Number(startingPrice),
          warrantyDays: Number(warrantyDays),
          photo
      });
      setShowPreview(false);
      // Reset form logic handled by parent usually, but here we might want to clear if successful
      // (kept simple for now as parent handles refresh)
  };

  return (
    <div className="space-y-4 border border-slate-700 rounded-xl p-5 bg-slate-800/50">
      <h3 className="font-bold text-lg text-white mb-2">✨ Nouvelle demande</h3>
      
      {showPreview && (
          <TaskPreviewModal 
            taskData={{ title, category, scope, details, location, startingPrice, warrantyDays, photo }}
            onConfirm={handleConfirmCreate}
            onCancel={() => setShowPreview(false)}
            isSubmitting={isSubmitting}
          />
      )}

      <div className="space-y-1.5">
        <Label>Titre de la demande <span className="text-rose-500">*</span></Label>
        <Input placeholder="Ex: Remplacement ampoule Hall A" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-1.5">
            <Label>Catégorie</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Concerne</Label>
            <Select value={scope} onChange={(e) => setScope(e.target.value as TaskScope)}>
              {SCOPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Emplacement <span className="text-rose-500">*</span></Label>
            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prix de départ (€) <span className="text-rose-500">*</span></Label>
            <div className="relative">
                <Input 
                    type="number" 
                    placeholder="15" 
                    value={startingPrice} 
                    onChange={(e) => setStartingPrice(e.target.value)} 
                    className="pl-8"
                />
                <span className="absolute left-3 top-2.5 text-slate-500">€</span>
            </div>
            <p className="text-xs text-slate-500">Max: {MAX_TASK_PRICE}€</p>
          </div>
      </div>

      <div className="space-y-1.5">
         <Label>Photo (optionnel)</Label>
         <Input type="file" accept="image/*" onChange={handlePhotoChange} className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-900 file:text-indigo-200 hover:file:bg-indigo-800" />
      </div>

      <div className="space-y-2">
        <Label className="text-center block">Garantie souhaitée</Label>
        <div className="flex flex-wrap justify-center gap-3">
            {[
                { val: "0", label: "Sans garantie" },
                { val: "30", label: "1 mois" },
                { val: "90", label: "3 mois" },
                { val: "180", label: "6 mois" },
                { val: "365", label: "12 mois" }
            ].map((opt) => (
                <label key={opt.val} className={`cursor-pointer px-3 py-2 rounded-lg border text-sm transition-all ${
                    warrantyDays === opt.val 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/50' 
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}>
                    <input 
                        type="radio" 
                        name="warranty" 
                        value={opt.val} 
                        className="hidden" 
                        checked={warrantyDays === opt.val} 
                        onChange={(e) => setWarrantyDays(e.target.value)}
                    />
                    {opt.label}
                </label>
            ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Détails</Label>
        <Textarea placeholder="Décrivez le problème..." value={details} onChange={(e) => setDetails(e.target.value)} />
      </div>

      <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20" onClick={handleSubmitClick} disabled={isSubmitting}>
        {isSubmitting ? 'Création...' : 'Prévisualiser la tâche'}
      </Button>
    </div>
  );
}

function UserDirectory({ usersMap, currentUser, onUpdateUserStatus, onUpdateUser, onDeleteRating }: any) {
    const [users, setUsers] = useState<RegisteredUser[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', role: 'owner' });

    const fetchUsers = async () => {
        const allUsers = await fakeApi.getDirectory();
        setUsers(allUsers);
        const allTasks = await fakeApi.readTasks();
        setTasks(allTasks);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const canEdit = (targetUser: RegisteredUser) => {
        if (currentUser.role === 'admin' || currentUser.role === 'council') return true;
        return currentUser.email === targetUser.email;
    };

    const startEdit = (u: RegisteredUser) => {
        setEditingUser(u);
        setEditForm({ firstName: u.firstName, lastName: u.lastName, role: u.role });
    };

    const saveEdit = async () => {
        if (editingUser) {
            await fakeApi.updateUser(editingUser.email, {
                firstName: editForm.firstName,
                lastName: editForm.lastName,
                role: editForm.role as UserRole
            });
            setEditingUser(null);
            fetchUsers();
            if (onUpdateUser) onUpdateUser(); // Refresh parent
        }
    };
    
    const handleDeleteUser = async (email: string) => {
        if (confirm("Voulez-vous vraiment bannir cet utilisateur ?")) {
            await fakeApi.updateUserStatus(email, 'deleted');
            fetchUsers();
        }
    };

    const handleRestoreUser = async (email: string) => {
        if (confirm("Rétablir cet utilisateur ?")) {
            await fakeApi.updateUserStatus(email, 'active');
            fetchUsers();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">👥 Annuaire de la Résidence</h2>
            
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
                        <CardHeader><CardTitle>Modifier le profil</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Prénom</Label>
                                <Input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                            </div>
                            <div>
                                <Label>Nom</Label>
                                <Input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                            </div>
                            {(currentUser.role === 'admin' || currentUser.role === 'council') && (
                                <div>
                                    <Label>Rôle</Label>
                                    <Select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </Select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="ghost" onClick={() => setEditingUser(null)}>Annuler</Button>
                                <Button onClick={saveEdit}>Enregistrer</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {users.map(u => {
                    const userTasks = tasks.filter(t => t.awardedTo === u.email && t.status === 'completed');
                    const totalEarned = userTasks.reduce((acc, t) => acc + (t.awardedAmount || 0), 0);
                    const isMe = currentUser.email === u.email;
                    const isDeleted = u.status === 'deleted';

                    return (
                        <Card key={u.email} className={`relative overflow-hidden transition-all hover:border-indigo-500/50 ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
                            {isMe && <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-bl-lg">Moi</div>}
                            
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold ${
                                        u.role === 'admin' ? 'bg-rose-900 text-rose-200' :
                                        u.role === 'council' ? 'bg-amber-900 text-amber-200' :
                                        'bg-indigo-900 text-indigo-200'
                                    }`}>
                                        {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{u.firstName} {u.lastName}</h3>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">{ROLES.find(r => r.id === u.role)?.label}</Badge>
                                            {isDeleted && <Badge variant="destructive">Banni</Badge>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 border-t border-slate-700 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Travaux réalisés</span>
                                        <span className="text-white font-mono">{userTasks.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Total gagné</span>
                                        <span className="text-emerald-400 font-mono">{totalEarned} €</span>
                                    </div>
                                    
                                    {/* Recent Reviews */}
                                    {userTasks.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Derniers avis</div>
                                            <div className="max-h-32 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                                                {userTasks.map(t => (
                                                    t.ratings?.map((r, idx) => (
                                                        <div key={`${t.id}-${idx}`} className="bg-slate-900/50 p-2 rounded text-xs border border-slate-800">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-amber-400 tracking-widest">{'⭐'.repeat(r.stars)}</span>
                                                                {(currentUser.role === 'admin' || currentUser.role === 'council') && (
                                                                    <button onClick={() => onDeleteRating(t.id, idx)} className="text-rose-500 hover:text-rose-300">×</button>
                                                                )}
                                                            </div>
                                                            <p className="text-slate-300 italic">"{r.comment}"</p>
                                                            <div className="text-[10px] text-slate-500 mt-1 text-right">Projet: {t.title}</div>
                                                        </div>
                                                    ))
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700 justify-end">
                                    {canEdit(u) && !isDeleted && (
                                        <Button size="sm" variant="ghost" onClick={() => startEdit(u)}>✏️ Modifier</Button>
                                    )}
                                    {(currentUser.role === 'admin' || currentUser.role === 'council') && !isMe && (
                                        isDeleted 
                                        ? (currentUser.role === 'admin' && <Button size="sm" onClick={() => handleRestoreUser(u.email)}>Rétablir</Button>)
                                        : <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.email)}>Bannir</Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function Section({ title, children, color = "indigo" }: { title: string, children: React.ReactNode, color?: string }) {
  const colorClass = {
      indigo: "text-indigo-300 border-indigo-500/30",
      emerald: "text-emerald-300 border-emerald-500/30",
      amber: "text-amber-300 border-amber-500/30",
      rose: "text-rose-300 border-rose-500/30",
      sky: "text-sky-300 border-sky-500/30",
      fuchsia: "text-fuchsia-300 border-fuchsia-500/30",
  }[color] || "text-slate-300 border-slate-600";

  return (
    <section className="space-y-4 animate-fade-in">
      <div className={`flex items-center gap-3 pb-2 border-b ${colorClass}`}>
        <h2 className={`text-xl font-bold uppercase tracking-wide ${colorClass.split(' ')[0]}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Dashboard({ me, onLogout }: { me: User, onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'home' | 'directory' | 'ledger'>('home');

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  
  const refreshData = async () => {
      const t = await fakeApi.readTasks();
      setTasks(t);
      // Build user map
      const users = await fakeApi.getDirectory();
      const map: Record<string, string> = {};
      users.forEach(u => { map[u.email] = `${u.firstName} ${u.lastName}`; });
      setUsersMap(map);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Auto-award Cron (Simulated) - Check every 5s
  useEffect(() => {
      const checkAutoAward = async () => {
          const currentTasks = await fakeApi.readTasks();
          let changed = false;
          const now = new Date().getTime();

          const updatedTasks = currentTasks.map(t => {
              if (t.status === 'open' && t.biddingStartedAt && t.bids.length > 0) {
                  const deadline = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000; // 24h
                  if (now > deadline) {
                      // Time's up! Award to lowest bidder
                      const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                      changed = true;
                      // Notify
                      notify([lowestBid.by], "Tâche attribuée", `Bravo, vous avez remporté la tâche "${t.title}" !`);
                      notify(['council', 'admin'], "Attribution automatique", `La tâche "${t.title}" a été attribuée à ${lowestBid.by}.`);
                      
                      return {
                          ...t,
                          status: 'awarded',
                          awardedTo: lowestBid.by,
                          awardedAmount: lowestBid.amount
                      } as Task;
                  }
              }
              return t;
          });

          if (changed) {
              await fakeApi.writeTasks(updatedTasks);
              setTasks(updatedTasks);
          }
      };
      const timer = setInterval(checkAutoAward, 5000);
      return () => clearInterval(timer);
  }, []);

  // --- ACTIONS ---

  const notify = async (recipients: string[], subject: string, message: string) => {
    // Visual notification
    addToast(`📧 Envoi Email`, `À: ${recipients.join(', ')} - ${subject}`, 'info');
    
    // Real API call (Backend)
    // Map roles to emails if needed, but here we assume recipients are emails or role-keywords handled by backend or simple simulation
    // For this prototype, if recipient is a role, we pick actual emails from usersMap keys if we had full user objects, 
    // but for now we just send the role string to the API which acts as a placeholder or actual distribution list.
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: recipients, subject, html: `<p>${message}</p>` })
        });
    } catch (e) {
        console.error("Failed to send email", e);
    }
  };

  const handleCreateTask = async (t: Partial<Task>) => {
    setIsSubmitting(true);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: t.title!,
      category: t.category!,
      scope: t.scope!,
      details: t.details || "",
      location: t.location!,
      startingPrice: t.startingPrice!,
      warrantyDays: t.warrantyDays!,
      status: 'pending',
      createdBy: me.email,
      createdAt: new Date().toISOString(),
      bids: [],
      ratings: [],
      approvals: [],
      rejections: [],
      photo: t.photo
    };

    // If Admin/Council creates it, they auto-approve it
    if (me.role === 'admin' || me.role === 'council') {
        newTask.approvals.push({ by: me.email, at: new Date().toISOString() });
    }

    // Admin-created tasks are NOT auto-opened anymore (as requested), 
    // they go to pending so Admin can choose to "Force Validate" manually or let CS vote.

    await fakeApi.writeTasks([...tasks, newTask]);
    await refreshData();
    addToast("Succès", "Votre demande a été créée et envoyée pour validation.", "success");
    
    notify(['council', 'admin'], "Nouvelle tâche à valider", `Une nouvelle tâche "${newTask.title}" est en attente.`);
    
    setIsSubmitting(false);
  };

  const handleBid = async (taskId: string, bid: Omit<Bid, 'by' | 'at'>) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        // Check rules: 1 bid per user max, unless they were the first bidder (allow 2nd)
        const myBids = t.bids.filter(b => b.by === me.email);
        const isFirstBidder = t.bids.length > 0 && t.bids[0].by === me.email;
        
        if (isFirstBidder) {
            if (myBids.length >= 2) throw new Error("Vous avez déjà utilisé vos 2 offres autorisées (Bonus 1er enchérisseur).");
        } else {
            if (myBids.length >= 1) throw new Error("Une seule offre autorisée par copropriétaire.");
        }

        // Start Countdown if it's the VERY first bid overall
        let biddingStart = t.biddingStartedAt;
        if (t.bids.length === 0) {
             biddingStart = new Date().toISOString();
        }

        const newBid: Bid = { ...bid, by: me.email, at: new Date().toISOString() };
        
        // Notifications
        notify(t.bids.map(b => b.by).concat([t.createdBy, 'council']), "Nouvelle enchère", `Une nouvelle offre de ${bid.amount}€ a été faite sur "${t.title}".`);

        return { ...t, bids: [...t.bids, newBid], biddingStartedAt: biddingStart };
      }
      return t;
    });
    
    try {
        await fakeApi.writeTasks(updatedTasks);
        refreshData();
        addToast("Offre enregistrée", `Vous vous êtes positionné à ${bid.amount}€`, "success");
    } catch (e: any) {
        addToast("Erreur", e.message, "warning");
    }
  };

  const handleAward = async (taskId: string) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    
    // Admin can force award anytime. Creator must wait for timer.
    // Logic is handled in UI enablement, here we just execute.

    const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, status: 'awarded' as const, awardedTo: lowestBid.by, awardedAmount: lowestBid.amount } : task
    );
    await fakeApi.writeTasks(updatedTasks);
    refreshData();
    addToast("Attribution effectuée", `Tâche attribuée à ${lowestBid.by}`, "success");
    notify([lowestBid.by], "Félicitations", `La tâche "${t.title}" vous a été attribuée.`);
  };

  // Step 1: Worker requests verification
  const handleRequestVerification = async (taskId: string) => {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'verification' as const } : t);
      await fakeApi.writeTasks(updatedTasks);
      refreshData();
      addToast("Envoyé pour vérification", "Le Conseil Syndical a été notifié.", "info");
      notify(['council', 'admin'], "Vérification demandée", `Le travail sur "${updatedTasks.find(t=>t.id===taskId)?.title}" est terminé. Merci de vérifier.`);
  };

  // Step 2a: CS Rejects work
  const handleRejectWork = async (taskId: string) => {
      const t = tasks.find(x => x.id === taskId);
      if (!t) return;
      const updatedTasks = tasks.map(task => task.id === taskId ? { ...task, status: 'awarded' as const } : task);
      await fakeApi.writeTasks(updatedTasks);
      refreshData();
      addToast("Travail refusé", "La tâche est retournée au copropriétaire.", "warning");
      if (t.awardedTo) notify([t.awardedTo], "Travail refusé", `Votre travail sur "${t.title}" a été jugé incomplet. Merci de le reprendre.`);
  };

  // Step 2b: CS Validates work (Completion)
  const handleComplete = async (taskId: string) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t || !t.awardedTo || !t.awardedAmount) return;

    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { 
          ...task, 
          status: 'completed' as const, 
          completionAt: new Date().toISOString(),
          validatedBy: me.email // Record who validated it
      } : task
    );
    
    // Ledger Entry
    const entry: LedgerEntry = {
        taskId: t.id,
        type: t.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
        payer: t.scope === 'copro' ? 'Copro' : t.createdBy,
        payee: t.awardedTo,
        amount: t.awardedAmount,
        at: new Date().toISOString()
    };

    await fakeApi.writeTasks(updatedTasks);
    const currentLedger = await fakeApi.readLedger();
    await fakeApi.writeLedger([...currentLedger, entry]);
    
    refreshData();
    addToast("Terminé", "Tâche clôturée et écriture comptable générée.", "success");
    notify(['council', 'admin'], "Intervention validée", `La tâche "${t.title}" est terminée et validée.`);
  };

  const handleApprove = async (taskId: string) => {
      const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
              const newApprovals = [...t.approvals, { by: me.email, at: new Date().toISOString() }];
              // Admin force or enough votes
              if (me.role === 'admin' || newApprovals.length >= COUNCIL_MIN_APPROVALS) {
                   // Open the task
                   notify(['owner'], "Nouvelle opportunité", `La tâche "${t.title}" est ouverte aux offres !`);
                   return { ...t, status: 'open' as const, approvals: newApprovals };
              }
              return { ...t, approvals: newApprovals };
          }
          return t;
      });
      await fakeApi.writeTasks(updatedTasks);
      refreshData();
  };

  const handleReject = async (taskId: string) => {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'rejected' as const, rejections: [...t.rejections, { by: me.email, at: new Date().toISOString() }] } : t);
      await fakeApi.writeTasks(updatedTasks);
      refreshData();
      const t = tasks.find(x => x.id === taskId);
      if (t) notify([t.createdBy], "Tâche refusée", `Votre demande "${t.title}" a été refusée.`);
  };
  
  const handleDelete = async (taskId: string) => {
      if (me.role !== 'admin') return; // Double security
      if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche définitivement ?")) return;
      const newTasks = tasks.filter(t => t.id !== taskId);
      await fakeApi.writeTasks(newTasks);
      refreshData();
      addToast("Supprimé", "La tâche a été effacée.", "warning");
  };

  const handleDeleteLedgerEntry = async (idx: number) => {
      if (me.role !== 'admin') return;
      await fakeApi.deleteLedgerEntry(idx);
      refreshData();
      addToast("Supprimé", "Ligne comptable effacée.", "warning");
  };

  const handleRate = async (taskId: string, rating: Omit<Rating, 'at' | 'byHash'>) => {
      const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
              const newRating: Rating = { ...rating, at: new Date().toISOString(), byHash: me.id };
              return { ...t, ratings: [...(t.ratings || []), newRating] };
          }
          return t;
      });
      await fakeApi.writeTasks(updatedTasks);
      refreshData();
      addToast("Merci", "Votre avis a été enregistré.", "success");
  };

  const handleDeleteRating = async (taskId: string, index: number) => {
      if (me.role !== 'admin' && me.role !== 'council') return;
      if (!confirm("Supprimer ce commentaire ?")) return;
      await fakeApi.deleteRating(taskId, index);
      refreshData();
      addToast("Supprimé", "Le commentaire a été retiré.", "info");
  };

  // --- VIEWS ---

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const openTasks = tasks.filter(t => t.status === 'open');
  // "In Progress" = Awarded OR Verification
  const activeTasks = tasks.filter(t => t.status === 'awarded' || t.status === 'verification');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const canValidate = me.role === 'admin' || me.role === 'council';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Toaster toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-700 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
             {/* Clickable Logo */}
             <div onClick={() => setView('home')} className="cursor-pointer group">
               <h1 className="text-2xl font-extrabold text-white tracking-tight group-hover:text-indigo-400 transition-colors">CoproSmart</h1>
               <p className="text-xs text-slate-400 -mt-1">Gestion Collaborative</p>
             </div>

             <div className="flex items-center gap-4">
                 {/* Navigation */}
                 <nav className="hidden md:flex items-center gap-1 mr-4">
                   <Button variant={view === 'home' ? 'secondary' : 'ghost'} onClick={() => setView('home')} size="sm">
                     🏠 Accueil
                   </Button>
                   <Button variant={view === 'directory' ? 'secondary' : 'ghost'} onClick={() => setView('directory')} size="sm">
                     👥 Annuaire
                   </Button>
                   {(me.role === 'admin' || me.role === 'council') && (
                     <Button variant={view === 'ledger' ? 'secondary' : 'ghost'} onClick={() => setView('ledger')} size="sm">
                       📒 Écritures
                     </Button>
                   )}
                </nav>

                {/* User Info */}
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{me.firstName} {me.lastName.toUpperCase()}</div>
                    <div className="text-xs text-slate-400">{me.email}</div>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout} className="text-xs border-slate-600">Déconnexion</Button>
             </div>
          </div>
          
          {/* Mobile Nav (Simplified) */}
          <div className="md:hidden flex justify-around border-t border-slate-800 p-2 bg-slate-900">
               <button onClick={() => setView('home')} className={`text-xs font-bold ${view === 'home' ? 'text-indigo-400' : 'text-slate-500'}`}>Accueil</button>
               <button onClick={() => setView('directory')} className={`text-xs font-bold ${view === 'directory' ? 'text-indigo-400' : 'text-slate-500'}`}>Annuaire</button>
               {(me.role === 'admin' || me.role === 'council') && (
                   <button onClick={() => setView('ledger')} className={`text-xs font-bold ${view === 'ledger' ? 'text-indigo-400' : 'text-slate-500'}`}>Écritures</button>
               )}
          </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 pb-20 space-y-8">
        
        {view === 'home' && (
            <>
                {/* Validation Queue for Admin/CS + View Only for Owners */}
                {pendingTasks.length > 0 && (
                     <Section title="⏳ En attente de validation" color="amber">
                        <div className="grid gap-4 md:grid-cols-2">
                            {pendingTasks.map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={me} usersMap={usersMap}
                                    onBid={() => {}} onAward={() => {}} onComplete={() => {}} onRate={() => {}} onPayApartment={() => {}}
                                    onApprove={canValidate ? () => handleApprove(t.id) : undefined}
                                    onReject={canValidate ? () => handleReject(t.id) : undefined}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={me.role === 'admin'}
                                />
                            ))}
                        </div>
                     </Section>
                )}

                {/* User Approvals (CS Only) */}
                {(me.role === 'admin' || me.role === 'council') && (
                    <UserValidationQueue 
                        onApprove={fakeApi.approveUser} 
                        onReject={fakeApi.rejectUser} 
                    />
                )}

                {/* Create Task */}
                <Section title="✨ Nouvelle tâche" color="indigo">
                   <CreateTaskForm onCreate={handleCreateTask} isSubmitting={isSubmitting} />
                </Section>

                {/* Open Tasks */}
                <Section title="📢 Offres ouvertes" color="indigo">
                    {openTasks.length === 0 ? <p className="text-slate-500 italic">Aucune offre en cours.</p> : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {openTasks.map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={me} usersMap={usersMap}
                                    onBid={(b) => handleBid(t.id, b)}
                                    onAward={() => handleAward(t.id)}
                                    onComplete={() => handleComplete(t.id)}
                                    onRate={(r) => handleRate(t.id, r)}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={me.role === 'admin'}
                                />
                            ))}
                        </div>
                    )}
                </Section>

                {/* Active Tasks (Awarded + Verification) - Visible to ALL */}
                <Section title="🏗️ Travaux en cours" color="sky">
                    {activeTasks.length === 0 ? <p className="text-slate-500 italic">Aucun chantier en cours.</p> : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {activeTasks.map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={me} usersMap={usersMap}
                                    onBid={() => {}}
                                    onAward={() => {}}
                                    onComplete={() => handleComplete(t.id)}
                                    onRequestVerification={() => handleRequestVerification(t.id)}
                                    onRejectWork={() => handleRejectWork(t.id)}
                                    onRate={() => {}}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={me.role === 'admin'}
                                />
                            ))}
                        </div>
                    )}
                </Section>

                {/* Completed History */}
                <Section title="✅ Historique terminé" color="emerald">
                    <div className="grid gap-4 md:grid-cols-2 opacity-80 hover:opacity-100 transition-opacity">
                         {completedTasks.slice(0, 10).map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={me} usersMap={usersMap}
                                    onBid={() => {}}
                                    onAward={() => {}}
                                    onComplete={() => {}}
                                    onRate={(r) => handleRate(t.id, r)}
                                    onDeleteRating={handleDeleteRating}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={me.role === 'admin'}
                                />
                         ))}
                    </div>
                </Section>
            </>
        )}

        {view === 'directory' && (
            <UserDirectory 
                usersMap={usersMap} 
                currentUser={me} 
                onUpdateUserStatus={refreshData} 
                onUpdateUser={refreshData} 
                onDeleteRating={handleDeleteRating}
            />
        )}

        {view === 'ledger' && (me.role === 'admin' || me.role === 'council') && (
             <Section title="📒 Journal des écritures" color="fuchsia">
                <Ledger isAdmin={me.role === 'admin'} onDeleteEntry={handleDeleteLedgerEntry} usersMap={usersMap} />
             </Section>
        )}

      </main>
      
      <footer className="border-t border-slate-800 mt-12 py-8 text-center text-slate-500 text-sm bg-slate-900">
        <p>CoproSmart v0.1.0 — Gestion collaborative de résidence</p>
      </footer>
    </div>
  );
}

export default function App() {
  const { user, setUser } = useAuth();
  
  return (
    <div className="bg-slate-900 min-h-screen">
      {!user ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-10 overflow-y-auto items-start">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">CoproSmart</h1>
                <p className="text-lg text-indigo-300 font-medium">Gestion Collaborative</p>
            </div>
            <LoginCard onLogin={setUser} />
        </div>
      ) : (
        <Dashboard me={user} onLogout={() => { fakeApi.logout(); setUser(null); }} />
      )}
    </div>
  );
}
