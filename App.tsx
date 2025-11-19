
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
    const locationLabel = LOCATIONS.find(l => l === taskData.location) || taskData.location;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 shadow-2xl">
                <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-xl text-white">🔍 Vérifiez votre tâche</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    {taskData.photo && (
                         <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50">
                            <img src={taskData.photo} alt="Aperçu" className="w-full h-full object-cover" />
                         </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Titre</h3>
                            <p className="text-lg font-medium text-white">{taskData.title}</p>
                        </div>
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Prix de départ</h3>
                            <p className="text-lg font-medium text-indigo-400">{taskData.startingPrice} €</p>
                        </div>
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Emplacement</h3>
                            <p className="text-slate-300">{locationLabel}</p>
                        </div>
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Catégorie</h3>
                            <Badge variant="outline" className="text-slate-300 border-slate-600">{categoryLabel}</Badge>
                        </div>
                        <div>
                             <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Garantie</h3>
                             <p className="text-slate-300">{taskData.warrantyDays === 0 ? 'Sans garantie' : `${Math.round(taskData.warrantyDays / 30)} mois`}</p>
                        </div>
                        <div>
                            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Concerne</h3>
                            <p className="text-slate-300">{scopeLabel}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Description détaillée</h3>
                        <div className="bg-slate-800/50 p-4 rounded-lg text-slate-300 text-sm whitespace-pre-wrap border border-slate-700">
                            {taskData.details || <span className="italic text-slate-500">Aucune description.</span>}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <Button variant="outline" onClick={onCancel} className="flex-1">✏️ Modifier</Button>
                        <Button onClick={onConfirm} disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
                            {isSubmitting ? 'Envoi...' : '✅ Confirmer et soumettre'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function CreateTaskForm({ onSubmit, onCancel, initialData }: { onSubmit: (data: any) => void, onCancel: () => void, initialData?: any }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState<TaskCategory>(initialData?.category || "ampoule");
  const [scope, setScope] = useState<TaskScope>(initialData?.scope || "copro");
  const [details, setDetails] = useState(initialData?.details || "");
  const [location, setLocation] = useState(initialData?.location || LOCATIONS[0]);
  const [startingPrice, setStartingPrice] = useState(initialData?.startingPrice || "");
  const [warrantyDays, setWarrantyDays] = useState(initialData?.warrantyDays?.toString() || "0"); 
  const [photo, setPhoto] = useState<string | null>(initialData?.photo || null);

  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreview = () => {
      if (!title.trim()) { alert("Le titre est obligatoire."); return; }
      if (!location.trim()) { alert("L'emplacement est obligatoire."); return; }
      if (!startingPrice || Number(startingPrice) <= 0) { alert("Le prix de départ est obligatoire."); return; }
      if (Number(startingPrice) > MAX_TASK_PRICE) { alert(`Le prix de départ ne peut pas dépasser ${MAX_TASK_PRICE}€.`); return; }
      setShowPreview(true);
  };

  const handleFinalSubmit = () => {
      onSubmit({
        title,
        category,
        scope,
        details,
        location,
        startingPrice: Number(startingPrice),
        warrantyDays: Number(warrantyDays),
        photo,
      });
  };

  if (showPreview) {
      return <TaskPreviewModal 
        taskData={{ title, category, scope, details, location, startingPrice, warrantyDays: Number(warrantyDays), photo }} 
        onConfirm={handleFinalSubmit} 
        onCancel={() => setShowPreview(false)} 
      />;
  }

  return (
    <Card className="bg-slate-800 border-slate-700 text-slate-200">
      <CardHeader>
        <CardTitle className="text-white">Nouvelle tâche</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-400">Titre de la demande <span className="text-rose-500">*</span></Label>
          <Input placeholder="Ex: Remplacer ampoule hall" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-1.5">
                <Label className="text-slate-400">Emplacement <span className="text-rose-500">*</span></Label>
                <Select value={location} onChange={(e) => setLocation(e.target.value)}>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Prix de départ (€) <span className="text-rose-500">*</span></Label>
                <div className="relative">
                    <Input 
                        type="number" 
                        min="1" 
                        max={MAX_TASK_PRICE}
                        placeholder="15" 
                        value={startingPrice} 
                        onChange={(e) => setStartingPrice(e.target.value)} 
                        className="pr-8"
                    />
                    <span className="absolute right-3 top-2 text-slate-500">€</span>
                </div>
                <div className="text-xs text-slate-500">Max: {MAX_TASK_PRICE}€</div>
            </div>
        </div>

        <div className="space-y-1.5">
            <Label className="text-slate-400">Photo (optionnel)</Label>
            <Input type="file" accept="image/*" onChange={handleFileChange} className="text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
        </div>

        <div className="space-y-1.5">
             <Label className="text-slate-400 text-center block mb-2">Garantie offerte</Label>
             <div className="flex flex-wrap justify-center gap-2">
                {[
                    { v: "0", l: "Sans garantie" },
                    { v: "30", l: "1 mois" },
                    { v: "90", l: "3 mois" },
                    { v: "180", l: "6 mois" },
                    { v: "365", l: "12 mois" }
                ].map((opt) => (
                    <label key={opt.v} className={`cursor-pointer border rounded-md px-3 py-2 text-sm transition-all ${warrantyDays === opt.v ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                        <input type="radio" name="warranty" value={opt.v} checked={warrantyDays === opt.v} onChange={(e) => setWarrantyDays(e.target.value)} className="hidden" />
                        {opt.l}
                    </label>
                ))}
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label className="text-slate-400">Catégorie</Label>
                <Select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-slate-400">Concerne</Label>
                <Select value={scope} onChange={(e) => setScope(e.target.value as TaskScope)}>
                    {SCOPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
            </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-slate-400">Détails</Label>
          <Textarea placeholder="Décrivez le travail à effectuer..." value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        
        <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={onCancel} className="flex-1">Annuler</Button>
            <Button onClick={handlePreview} className="flex-1">Prévisualiser la tâche</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Ledger({ entries, tasks, usersMap, onDelete, isAdmin }: { entries: LedgerEntry[], tasks: Task[], usersMap: Record<string, string>, onDelete: (i:number) => void, isAdmin: boolean }) {
  if (entries.length === 0) {
      return <div className="text-slate-400 italic p-4 bg-slate-800 rounded-lg border border-slate-700">Aucune écriture comptable.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-slate-700">
          <tr>
            <th className="px-2 py-3">Date</th>
            <th className="px-2 py-3">Tâche & Créateur</th>
            <th className="px-2 py-3">Type</th>
            <th className="px-2 py-3">Payeur</th>
            <th className="px-2 py-3">Bénéficiaire</th>
            <th className="px-2 py-3 text-right">Montant</th>
            {isAdmin && <th className="px-2 py-3 text-right w-10"></th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const task = tasks.find(t => t.id === e.taskId);
            const payerName = e.payer === 'COPRO' ? 'Copropriété' : (usersMap[e.payer] || e.payer);
            const payeeName = usersMap[e.payee] || e.payee;
            const creatorName = task ? (usersMap[task.createdBy] || task.createdBy) : 'Inconnu';

            return (
            <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
              <td className="px-2 py-3 whitespace-nowrap">{new Date(e.at).toLocaleDateString()}</td>
              <td className="px-2 py-3">
                   {task ? (
                       <div className="flex flex-col">
                           <span className="font-medium text-white truncate max-w-[150px] block">{task.title}</span>
                           <span className="text-xs text-slate-500">Créée par {creatorName}</span>
                       </div>
                   ) : <span className="text-slate-500 italic">Tâche supprimée</span>}
              </td>
              <td className="px-2 py-3">
                {e.type === 'charge_credit' ? 
                  <Badge variant="secondary" color="emerald">Crédit Charges</Badge> : 
                  <Badge variant="secondary" color="indigo">Paiement Direct</Badge>
                }
              </td>
              <td className="px-2 py-3">{payerName}</td>
              <td className="px-2 py-3">{payeeName}</td>
              <td className="px-2 py-3 text-right font-mono text-emerald-400 font-bold">{e.amount} €</td>
              {isAdmin && (
                  <td className="px-2 py-3 text-right">
                      <Button variant="destructive" size="sm" className="h-6 w-6 p-0 flex items-center justify-center" onClick={() => onDelete(i)} title="Supprimer la ligne">🗑️</Button>
                  </td>
              )}
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}

function UserValidationQueue({ users, onApprove, onReject }: { users: RegisteredUser[], onApprove: (u:string)=>void, onReject: (u:string)=>void }) {
    if (users.length === 0) return null;
    return (
        <Card className="mb-6 border-amber-600/50 bg-amber-900/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 text-base flex items-center gap-2">
                    🔒 Inscriptions en attente de validation ({users.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2">
                    {users.map(u => (
                        <li key={u.email} className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-amber-900/50">
                            <div>
                                <div className="font-bold text-slate-200">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-slate-400">{u.email} • {ROLES.find(r => r.id === u.role)?.label}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 border-none text-white" onClick={() => onApprove(u.email)}>Accepter</Button>
                                <Button size="sm" variant="destructive" onClick={() => onReject(u.email)}>Refuser</Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

// --- User Directory Component ---

function UserDirectory({ users, tasks, onUpdateUser, onDeleteUser, onRestoreUser, onDeleteRating, currentUser }: { 
    users: RegisteredUser[], 
    tasks: Task[],
    onUpdateUser: (email: string, data: any) => void,
    onDeleteUser: (email: string) => void, 
    onRestoreUser: (email: string) => void,
    onDeleteRating: (taskId: string, index: number) => void,
    currentUser: User 
}) {
    const [editUser, setEditUser] = useState<RegisteredUser | null>(null);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', role: 'owner' });

    const canManage = currentUser.role === 'admin' || currentUser.role === 'council';
    const isAdmin = currentUser.role === 'admin';

    const handleEditClick = (u: RegisteredUser) => {
        setEditUser(u);
        setFormData({ firstName: u.firstName, lastName: u.lastName, role: u.role });
    };

    const handleSave = () => {
        if (editUser) {
            onUpdateUser(editUser.email, formData);
            setEditUser(null);
        }
    };

    return (
        <div className="space-y-6">
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
                        <CardHeader><CardTitle>Modifier le profil</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div><Label>Prénom</Label><Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></div>
                            <div><Label>Nom</Label><Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></div>
                            {canManage && (
                                <div>
                                    <Label>Rôle</Label>
                                    <Select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </Select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setEditUser(null)}>Annuler</Button>
                                <Button onClick={handleSave}>Enregistrer</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map(u => {
                    const isDeleted = u.status === 'deleted';
                    // Get completed tasks for this user
                    const userHistory = tasks.filter(t => t.awardedTo === u.email && t.status === 'completed');
                    
                    return (
                        <Card key={u.email} className={`bg-slate-800 border-slate-700 ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
                            <CardContent className="flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-lg text-white flex items-center gap-2">
                                                {u.firstName} {u.lastName?.toUpperCase() || ''}
                                                {isDeleted && <Badge variant="destructive">Banni</Badge>}
                                            </div>
                                            <div className="text-sm text-slate-400">{u.email}</div>
                                        </div>
                                        <Badge className={u.role === 'admin' ? 'bg-rose-900/50 text-rose-200' : u.role === 'council' ? 'bg-amber-900/50 text-amber-200' : 'bg-slate-700 text-slate-300'}>
                                            {ROLES.find(r => r.id === u.role)?.label}
                                        </Badge>
                                    </div>
                                    
                                    {/* Work History */}
                                    <div className="mt-4 space-y-2">
                                        <Label>Historique des travaux réalisés ({userHistory.length})</Label>
                                        {userHistory.length > 0 ? (
                                            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                                {userHistory.map(t => (
                                                    <div key={t.id} className="bg-slate-900/50 p-2 rounded text-xs border border-slate-700">
                                                        <div className="flex justify-between font-medium text-slate-300">
                                                            <span>{t.title}</span>
                                                            <span className="text-emerald-400">{t.awardedAmount} €</span>
                                                        </div>
                                                        <div className="text-slate-500">{new Date(t.completionAt || '').toLocaleDateString()}</div>
                                                        
                                                        {/* Ratings display */}
                                                        {t.ratings && t.ratings.length > 0 && (
                                                            <div className="mt-1 pt-1 border-t border-slate-700/50">
                                                                {t.ratings.map((r, idx) => (
                                                                    <div key={idx} className="flex justify-between items-start gap-1 mb-1 group">
                                                                        <div>
                                                                             <span className="text-amber-500 tracking-tighter">{'⭐'.repeat(r.stars)}</span>
                                                                             <span className="text-slate-400 italic ml-1">"{r.comment}"</span>
                                                                        </div>
                                                                        {canManage && (
                                                                             <button 
                                                                                onClick={() => onDeleteRating(t.id, idx)}
                                                                                className="text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100"
                                                                                title="Supprimer ce commentaire"
                                                                             >✕</button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-500 italic">Aucun travail réalisé.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-700">
                                    {(u.email === currentUser.email || canManage) && (
                                        <Button size="sm" variant="outline" onClick={() => handleEditClick(u)}>✏️ Modifier</Button>
                                    )}
                                    {canManage && !isDeleted && u.role !== 'admin' && (
                                        <Button size="sm" variant="destructive" onClick={() => onDeleteUser(u.email)}>Bannir</Button>
                                    )}
                                    {isAdmin && isDeleted && (
                                        <Button size="sm" className="bg-emerald-600 text-white" onClick={() => onRestoreUser(u.email)}>Rétablir</Button>
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

// --- Main Dashboard Component ---

function Dashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [view, setView] = useState<'home' | 'directory' | 'ledger'>('home');
  
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<RegisteredUser[]>([]);
  
  // Helper map for displaying names instead of emails
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const notify = async (recipients: string[], subject: string, message: string) => {
      // Visual Feedback
      addToast(`📧 Email envoyé`, `Sujet: ${subject}`, 'info');
      
      // Real API Call
      try {
          await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  to: recipients, 
                  subject: subject,
                  html: `<p>${message}</p><br/><p>Cordialement,<br/>L'équipe CoproSmart</p>`
              })
          });
      } catch (e) {
          console.error("Failed to send email", e);
      }
  };

  const refreshData = useCallback(async () => {
    setTasks(await fakeApi.readTasks());
    setLedger(await fakeApi.readLedger());
    
    if (user.role === 'admin' || user.role === 'council') {
        setPendingUsers(await fakeApi.getPendingUsers());
    }
    
    // Get directory for name resolution
    const users = await fakeApi.getDirectory();
    setDirectoryUsers(users);
    
    const map: Record<string, string> = {};
    users.forEach(u => {
        map[u.email] = `${u.firstName} ${u.lastName.toUpperCase()}`;
    });
    // Add self if not in list (e.g. admin sometimes)
    if (!map[user.email]) map[user.email] = `${user.firstName} ${user.lastName.toUpperCase()}`;
    
    setUsersMap(map);

  }, [user.role, user.email, user.firstName, user.lastName]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Auto-award mechanism check (Cron simulation)
  useEffect(() => {
      const checkAutoAward = async () => {
          const currentTasks = await fakeApi.readTasks();
          let changed = false;
          const now = new Date().getTime();

          currentTasks.forEach(t => {
              if (t.status === 'open' && t.bids.length > 0 && t.biddingStartedAt) {
                  const endTime = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000;
                  if (now > endTime) {
                       // Time is up, auto award
                       const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                       t.status = 'awarded';
                       t.awardedTo = lowestBid.by;
                       t.awardedAmount = lowestBid.amount;
                       changed = true;
                       
                       // Notify
                       const winnerName = usersMap[lowestBid.by] || lowestBid.by;
                       addToast("Attribution automatique", `Tâche "${t.title}" attribuée à ${winnerName}`);
                  }
              }
          });

          if (changed) {
              await fakeApi.writeTasks(currentTasks);
              setTasks(currentTasks);
          }
      };

      const timer = setInterval(checkAutoAward, 10000); // Check every 10s
      return () => clearInterval(timer);
  }, [usersMap]);


  // Handlers
  const handleCreateTask = async (data: any) => {
    const isAdmin = user.role === 'admin';
    const isCouncil = user.role === 'council';
    
    // Auto-approve logic: Admin -> Pending (needs force), Council -> 1 vote
    const initialApprovals = (isCouncil || isAdmin) ? [{ by: user.email, at: new Date().toISOString() }] : [];
    
    // Note: Admin tasks are now pending by default, so they can choose to force validate later.
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: 'pending',
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      bids: [],
      ratings: [],
      approvals: initialApprovals,
      rejections: []
    };

    const updated = [...tasks, newTask];
    await fakeApi.writeTasks(updated);
    setTasks(updated);
    setIsCreating(false);
    
    if (newTask.status === 'open') {
        notify(['tous@copro.fr'], "Nouvelle tâche disponible", `Une nouvelle tâche "${newTask.title}" est disponible.`);
    } else {
        // Notify Council for validation
        notify(['conseil@copro.fr'], "Nouvelle tâche à valider", `Tâche "${newTask.title}" en attente de validation.`);
    }
    
    addToast("Tâche créée", "Votre demande a été enregistrée.");
  };

  const handleBid = async (taskId: string, bidData: Omit<Bid, 'by' | 'at'>) => {
    const updated = tasks.map(t => {
        if (t.id === taskId) {
            // Logic for bidding start time (first bid triggers timer)
            const isFirstBid = t.bids.length === 0;
            const newBiddingStartedAt = isFirstBid ? new Date().toISOString() : t.biddingStartedAt;
            
            return {
                ...t,
                biddingStartedAt: newBiddingStartedAt,
                bids: [...t.bids, { ...bidData, by: user.email, at: new Date().toISOString() }]
            };
        }
        return t;
    });
    await fakeApi.writeTasks(updated);
    setTasks(updated);
    
    notify(['conseil@copro.fr', 'tous@copro.fr'], "Nouvelle enchère", `Une nouvelle offre de ${bidData.amount}€ a été faite sur une tâche.`);
    addToast("Offre enregistrée", `Vous vous êtes positionné à ${bidData.amount} €`);
  };

  const handleAward = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const lowestBid = task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]);
    
    const updated = tasks.map(t => t.id === taskId ? { ...t, status: 'awarded' as const, awardedTo: lowestBid.by, awardedAmount: lowestBid.amount } : t);
    await fakeApi.writeTasks(updated);
    setTasks(updated);
    
    notify([lowestBid.by], "Félicitations !", `Vous avez remporté la tâche "${task.title}".`);
    addToast("Tâche attribuée", "Le copropriétaire a été notifié.");
  };
  
  // Verification Workflow
  const handleRequestVerification = async (taskId: string) => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, status: 'verification' as const } : t);
      await fakeApi.writeTasks(updated);
      setTasks(updated);
      notify(['conseil@copro.fr'], "Vérification demandée", `Un copropriétaire a terminé la tâche. Merci de valider.`);
      addToast("Demande envoyée", "Le conseil syndical a été notifié.");
  };

  const handleRejectWork = async (taskId: string) => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, status: 'awarded' as const } : t);
      await fakeApi.writeTasks(updated);
      setTasks(updated);
      addToast("Travail refusé", "La tâche est retournée au copropriétaire.");
  };

  const handleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.awardedTo || !task.awardedAmount) return;

    const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: 'completed' as const, completionAt: new Date().toISOString() } : t);
    
    // Generate Ledger Entry
    const entry: LedgerEntry = {
        taskId: task.id,
        type: task.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
        payer: task.scope === 'copro' ? 'COPRO' : task.createdBy,
        payee: task.awardedTo,
        amount: task.awardedAmount,
        at: new Date().toISOString()
    };
    
    const updatedLedger = [...ledger, entry];
    
    await fakeApi.writeTasks(updatedTasks);
    await fakeApi.writeLedger(updatedLedger);
    
    setTasks(updatedTasks);
    setLedger(updatedLedger);
    
    notify(['conseil@copro.fr'], "Travaux terminés", `La tâche "${task.title}" est terminée et validée.`);
    addToast("Terminé", "La tâche est close et l'écriture comptable générée.");
  };

  const handleDeleteLedgerEntry = async (index: number) => {
      if (user.role !== 'admin') return;
      await fakeApi.deleteLedgerEntry(index);
      setLedger(await fakeApi.readLedger());
      addToast("Supprimé", "Ligne comptable supprimée.");
  };

  const handleApprove = async (taskId: string) => {
      const isAdmin = user.role === 'admin';
      const updated = tasks.map(t => {
          if (t.id === taskId) {
              const newApprovals = [...t.approvals, { by: user.email, at: new Date().toISOString() }];
              // Admin can force validation OR check if threshold reached
              const isApproved = isAdmin || newApprovals.length >= COUNCIL_MIN_APPROVALS;
              
              if (isApproved) {
                 notify(['tous@copro.fr'], "Nouvelle tâche", `La tâche "${t.title}" est ouverte aux offres !`);
              }
              
              return {
                  ...t,
                  approvals: newApprovals,
                  status: (isApproved ? 'open' : 'pending') as any
              };
          }
          return t;
      });
      await fakeApi.writeTasks(updated);
      setTasks(updated);
  };

  const handleReject = async (taskId: string) => {
       const updated = tasks.map(t => t.id === taskId ? { ...t, status: 'rejected' as const } : t);
       await fakeApi.writeTasks(updated);
       setTasks(updated);
  };

  const handleDelete = async (taskId: string) => {
      if (user.role !== 'admin') return; // Extra safety
      const updated = tasks.filter(t => t.id !== taskId);
      await fakeApi.writeTasks(updated);
      setTasks(updated);
      addToast("Supprimé", "Tâche supprimée définitivement.");
  };
  
  const handleRate = async (taskId: string, ratingData: Omit<Rating, 'at' | 'byHash'>) => {
      const updated = tasks.map(t => {
          if (t.id === taskId) {
              const newRating: Rating = {
                  ...ratingData,
                  at: new Date().toISOString(),
                  byHash: user.id // Simple ID tracking to prevent double rating
              };
              return { ...t, ratings: [...(t.ratings || []), newRating] };
          }
          return t;
      });
      await fakeApi.writeTasks(updated);
      setTasks(updated);
      addToast("Merci", "Votre avis a été enregistré.");
  };

  const handleDeleteRating = async (taskId: string, ratingIndex: number) => {
      await fakeApi.deleteRating(taskId, ratingIndex);
      refreshData();
      addToast("Supprimé", "Commentaire supprimé.");
  };

  // User Management Handlers
  const handleApproveUser = async (email: string) => {
      await fakeApi.approveUser(email);
      refreshData();
      notify([email], "Compte validé", "Votre compte CoproSmart a été validé par le Conseil Syndical. Vous pouvez vous connecter.");
  };
  const handleRejectUser = async (email: string) => {
      await fakeApi.rejectUser(email);
      refreshData();
  };
  const handleUpdateUser = async (email: string, data: any) => {
      await fakeApi.updateUser(email, data);
      refreshData();
      addToast("Succès", "Profil mis à jour.");
  };
  const handleDeleteUser = async (email: string) => {
      await fakeApi.updateUserStatus(email, 'deleted');
      refreshData();
      addToast("Banni", "Utilisateur banni.");
  };
  const handleRestoreUser = async (email: string) => {
      await fakeApi.updateUserStatus(email, 'active');
      refreshData();
      addToast("Rétabli", "Utilisateur rétabli.");
  };

  // Filter Tasks
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const openTasks = tasks.filter(t => t.status === 'open');
  const awardedTasks = tasks.filter(t => t.status === 'awarded' || t.status === 'verification');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-10">
      <Toaster toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }} className="text-2xl hover:opacity-80 transition-opacity">🏢</a>
                <div>
                    <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }} className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent block hover:opacity-80">
                        CoproSmart
                    </a>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Gestion Collaborative</span>
                </div>
            </div>

            {/* NAVIGATION */}
            <div className="flex gap-2">
                <Button variant={view === 'home' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('home')}>
                    🏠 Accueil
                </Button>
                <Button variant={view === 'directory' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('directory')}>
                    👥 Annuaire
                </Button>
                {(user.role === 'admin' || user.role === 'council') && (
                    <Button variant={view === 'ledger' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('ledger')}>
                        📒 Écritures
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{user.firstName} {user.lastName.toUpperCase()}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout}>Déconnexion</Button>
            </div>
          </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-8 mt-4">
        
        {/* HEADER ROLE DISPLAY (Mobile friendly) */}
        <div className="text-center sm:hidden mb-4">
             <div className="text-sm font-bold text-white">{user.firstName} {user.lastName.toUpperCase()}</div>
             <Badge variant="outline" className="mt-1">{ROLES.find(r => r.id === user.role)?.label}</Badge>
        </div>

        {/* VIEW: DIRECTORY */}
        {view === 'directory' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Annuaire de la Copropriété</h2>
                </div>
                <UserDirectory 
                    users={directoryUsers} 
                    tasks={tasks}
                    onUpdateUser={handleUpdateUser}
                    onDeleteUser={handleDeleteUser}
                    onRestoreUser={handleRestoreUser}
                    onDeleteRating={handleDeleteRating}
                    currentUser={user}
                />
            </div>
        )}

        {/* VIEW: LEDGER */}
        {view === 'ledger' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Journal des Écritures</h2>
                    <Badge variant="secondary" className="text-indigo-300">Admin & CS uniquement</Badge>
                </div>
                <Ledger entries={ledger} tasks={tasks} usersMap={usersMap} onDelete={handleDeleteLedgerEntry} isAdmin={user.role === 'admin'} />
            </div>
        )}

        {/* VIEW: HOME (DASHBOARD) */}
        {view === 'home' && (
        <>
            {(user.role === 'admin' || user.role === 'council') && pendingUsers.length > 0 && (
                <UserValidationQueue users={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />
            )}

            {/* Action Bar */}
            <div className="flex justify-between items-end">
            <div>
                <h2 className="text-xl font-bold text-white">Tableau de bord</h2>
                <p className="text-slate-400 text-sm">Bienvenue, {user.firstName}.</p>
            </div>
            <Button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-indigo-600 to-sky-600 border-none shadow-lg shadow-indigo-900/20 hover:scale-105 transition-transform">
                + Nouvelle tâche
            </Button>
            </div>

            {isCreating && (
            <div className="animate-fade-in">
                <CreateTaskForm 
                    onSubmit={handleCreateTask} 
                    onCancel={() => setIsCreating(false)} 
                />
            </div>
            )}

            {/* Pending Validation Queue (Visible to all, actionable by Admin/CS) */}
            {pendingTasks.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-amber-400">Tâches en attente de validation</h3>
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400">{pendingTasks.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {pendingTasks.map(task => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                me={user}
                                usersMap={usersMap}
                                onBid={() => {}}
                                onAward={() => {}}
                                onComplete={() => {}}
                                onRate={() => {}}
                                onPayApartment={() => {}}
                                onDelete={() => handleDelete(task.id)}
                                canDelete={user.role === 'admin'}
                                // Validation props
                                onApprove={user.role === 'admin' || user.role === 'council' ? () => handleApprove(task.id) : undefined}
                                onReject={user.role === 'admin' || user.role === 'council' ? () => handleReject(task.id) : undefined}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Ongoing Work (Public) */}
            {awardedTasks.length > 0 && (
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-sky-400">🏗️ Travaux en cours</h3>
                    <Badge variant="outline" className="border-sky-500/50 text-sky-400">{awardedTasks.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {awardedTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        me={user}
                        usersMap={usersMap}
                        onBid={() => {}} 
                        onAward={() => {}} 
                        onComplete={() => handleComplete(task.id)}
                        onRate={() => {}}
                        onPayApartment={() => {}}
                        onDelete={() => handleDelete(task.id)}
                        canDelete={user.role === 'admin'}
                        onRequestVerification={() => handleRequestVerification(task.id)}
                        onRejectWork={() => handleRejectWork(task.id)}
                    />
                ))}
                </div>
            </section>
            )}

            {/* Open Offers */}
            <section className="space-y-3">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-indigo-400">Offres ouvertes</h3>
                <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">{openTasks.length}</Badge>
            </div>
            {openTasks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-700 rounded-xl text-slate-500">
                    Aucune offre en cours. Créez une tâche pour commencer !
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openTasks.map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        me={user}
                        usersMap={usersMap}
                        onBid={(bid) => handleBid(task.id, bid)}
                        onAward={() => handleAward(task.id)}
                        onComplete={() => {}}
                        onRate={() => {}}
                        onPayApartment={() => {}}
                        onDelete={() => handleDelete(task.id)}
                        canDelete={user.role === 'admin'}
                    />
                ))}
                </div>
            )}
            </section>

            {/* Completed History */}
            {completedTasks.length > 0 && (
            <section className="space-y-3">
                <h3 className="text-lg font-semibold text-emerald-400">Historique terminé</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                {completedTasks.slice().reverse().map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task} 
                        me={user}
                        usersMap={usersMap}
                        onBid={() => {}} 
                        onAward={() => {}} 
                        onComplete={() => {}}
                        onRate={(r) => handleRate(task.id, r)}
                        onDeleteRating={user.role === 'admin' || user.role === 'council' ? handleDeleteRating : undefined}
                        onPayApartment={() => {}}
                        onDelete={() => handleDelete(task.id)}
                        canDelete={user.role === 'admin'}
                    />
                ))}
                </div>
            </section>
            )}
        </>
        )}

        {/* FOOTER */}
        <footer className="border-t border-slate-800 pt-8 mt-12 text-center text-slate-500 text-sm">
            <div className="mb-4">
                <h4 className="font-bold text-slate-400 mb-2">Conditions Générales d'Utilisation (CGU)</h4>
                <p className="max-w-2xl mx-auto text-xs leading-relaxed">
                    CoproSmart est une plateforme collaborative. L'initiative individuelle est encouragée. 
                    Les montants validés pour les tâches effectuées dans les parties communes sont crédités sur le compte de charges du copropriétaire concerné (déduction sur appel de fonds). 
                    Les travaux privatifs se règlent directement entre voisins. Le Conseil Syndical valide la conformité des travaux avant paiement.
                </p>
            </div>
            <p>&copy; 2024 CoproSmart - v0.1.0</p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  const { user, setUser } = useAuth();

  if (!user) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <LoginCard onLogin={setUser} />
        </div>
    );
  }

  return <Dashboard user={user} onLogout={() => { fakeApi.logout(); setUser(null); }} />;
}
