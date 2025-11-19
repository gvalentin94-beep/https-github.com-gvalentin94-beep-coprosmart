
import React, { useState, useEffect, useCallback } from 'react';
import type { Me, Task, User, LedgerEntry, TaskCategory, TaskScope, Rating, Bid, RegisteredUser, UserRole } from './types';
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

function UserDirectory({ me, users, tasks, onUpdateStatus, onDeleteRating, onEditUser }: { me: Me, users: RegisteredUser[], tasks: Task[], onUpdateStatus: (email: string, status: 'active'|'rejected'|'deleted') => void, onDeleteRating?: (taskId:string, ratingIdx:number) => void, onEditUser: (u: RegisteredUser) => void }) {
    const canManage = me.role === 'admin' || me.role === 'council';
    const isAdmin = me.role === 'admin';

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Annuaire de la Copropriété</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => {
                    const isMe = u.email === me.email;
                    const canEdit = canManage || isMe;
                    const userCompletedTasks = tasks.filter(t => t.status === 'completed' && t.awardedTo === u.email);

                    return (
                    <Card key={u.email} className={`border-slate-700 bg-slate-800 ${u.status === 'deleted' ? 'opacity-50 grayscale' : ''}`}>
                        <CardContent className="p-4 flex flex-col gap-3">
                             <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{u.firstName} {u.lastName}</h3>
                                    <p className="text-sm text-indigo-400">{ROLES.find(r => r.id === u.role)?.label}</p>
                                    <p className="text-xs text-slate-500 mt-1">{u.email}</p>
                                    {u.status === 'deleted' && <Badge variant="destructive" className="mt-1">Banni</Badge>}
                                </div>
                                <div className="text-2xl rounded-full bg-slate-700 p-2 w-12 h-12 flex items-center justify-center">
                                    {u.role === 'admin' ? '👮' : u.role === 'council' ? '🏛️' : '👤'}
                                </div>
                             </div>
                             
                             {/* History */}
                             <div className="pt-3 border-t border-slate-700">
                                 <div className="text-xs font-semibold text-slate-400 mb-2">Travaux réalisés ({userCompletedTasks.length}) :</div>
                                 {userCompletedTasks.length > 0 ? (
                                    <ul className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {userCompletedTasks.map(t => (
                                            <li key={t.id} className="flex justify-between text-xs text-slate-300 bg-slate-900/30 p-1.5 rounded">
                                                <span className="truncate max-w-[60%]">{t.title}</span>
                                                <span className="text-emerald-400">{t.awardedAmount} €</span>
                                            </li>
                                        ))}
                                    </ul>
                                 ) : (
                                     <div className="text-xs text-slate-500 italic">Aucun travail réalisé pour le moment.</div>
                                 )}
                             </div>

                             {/* Actions */}
                             <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                {canEdit && (
                                    <Button size="sm" variant="outline" className="flex-1" onClick={() => onEditUser(u)}>✏️ Modifier</Button>
                                )}
                                {canManage && !isMe && u.role !== 'admin' && (
                                    <>
                                        {u.status === 'active' ? (
                                            <Button size="sm" variant="destructive" onClick={() => onUpdateStatus(u.email, 'deleted')}>Bannir</Button>
                                        ) : isAdmin && u.status === 'deleted' ? (
                                            <Button size="sm" className="bg-emerald-600" onClick={() => onUpdateStatus(u.email, 'active')}>Rétablir</Button>
                                        ) : null}
                                    </>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                )})}
            </div>
        </div>
    );
}

function UserEditModal({ user, me, onSave, onCancel }: { user: RegisteredUser, me: Me, onSave: (data: any) => void, onCancel: () => void }) {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [role, setRole] = useState<UserRole>(user.role);

    const canEditRole = me.role === 'admin' || me.role === 'council';

    const handleSave = () => {
        onSave({ firstName, lastName, role: canEditRole ? role : user.role });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                <CardHeader>
                    <CardTitle className="text-white">Modifier le profil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-slate-400">Prénom</Label>
                        <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-400">Nom</Label>
                        <Input value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                    {canEditRole && user.role !== 'admin' && (
                        <div className="space-y-1.5">
                            <Label className="text-slate-400">Rôle</Label>
                            <Select value={role} onChange={e => setRole(e.target.value as UserRole)}>
                                {ROLES.filter(r => r.id !== 'admin').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </Select>
                        </div>
                    )}
                    <div className="flex gap-2 pt-2">
                        <Button variant="secondary" className="flex-1" onClick={onCancel}>Annuler</Button>
                        <Button className="flex-1" onClick={handleSave}>Enregistrer</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- Main Dashboard ---

export default function App() {
  const { user, setUser } = useAuth();
  const [view, setView] = useState<'dashboard' | 'ledger' | 'cgu' | 'directory'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<any>(null); // For preserving form data
  
  // Admin/CS Data
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<RegisteredUser[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // REAL EMAIL NOTIFICATION LOGIC
  const notify = async (recipientRole: string | string[], subject: string) => {
      let recipients: string[] = [];

      // Resolve Recipients
      if (recipientRole === 'all') {
          recipients = directoryUsers.map(u => u.email);
      } else if (recipientRole === 'Conseil Syndical' || recipientRole === 'council') {
          recipients = directoryUsers.filter(u => u.role === 'council').map(u => u.email);
      } else if (Array.isArray(recipientRole)) {
          // It might be a mix of roles and emails
          for (const r of recipientRole) {
              if (r === 'Conseil Syndical' || r === 'council') {
                  const councilEmails = directoryUsers.filter(u => u.role === 'council').map(u => u.email);
                  recipients.push(...councilEmails);
              } else {
                  recipients.push(r);
              }
          }
      } else {
          // Single email string
          recipients = [recipientRole];
      }
      
      // Deduplicate
      recipients = [...new Set(recipients)];

      if (recipients.length === 0) return;

      // 1. Visual Notification (Toast)
      addToast(`📧 Envoi email...`, `Sujet: ${subject}`);

      // 2. Real API Call
      try {
          const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  to: recipients,
                  subject: `[CoproSmart] ${subject}`,
                  html: `<p>Bonjour,</p><p>${subject}</p><p>Connectez-vous sur CoproSmart pour en savoir plus.</p>`
              })
          });
          
          if (!res.ok) {
            console.warn("Email sending failed (expected in preview mode if no backend):", res.status);
          }
      } catch (e) {
          console.error("Email fetch error:", e);
          // Fail silently in frontend to not block user flow, as preview env doesn't have the API route.
      }
  };

  const refresh = useCallback(async () => {
    const t = await fakeApi.readTasks();
    const l = await fakeApi.readLedger();
    setTasks(t);
    setLedger(l);
    
    // Directory and Maps
    const dir = await fakeApi.getDirectory();
    setDirectoryUsers(dir);
    const map: Record<string, string> = {};
    dir.forEach(u => { map[u.email] = `${u.firstName} ${u.lastName}`; });
    // Also add myself if not in list
    if (user) map[user.email] = `${user.firstName} ${user.lastName}`;
    setUsersMap(map);

    if (user && (user.role === 'council' || user.role === 'admin')) {
        const p = await fakeApi.getPendingUsers();
        setPendingUsers(p);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-award logic (runs every 5s)
  useEffect(() => {
      const interval = setInterval(() => {
          const now = Date.now();
          let changed = false;
          const updatedTasks = tasks.map(t => {
              if (t.status === 'open' && t.biddingStartedAt) {
                  const deadline = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000;
                  if (now > deadline && t.bids.length > 0) {
                      // Auto award
                      const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                      changed = true;
                      notify([t.createdBy, lowestBid.by, 'Conseil Syndical'], `Tâche "${t.title}" attribuée automatiquement.`);
                      return { ...t, status: 'awarded', awardedTo: lowestBid.by, awardedAmount: lowestBid.amount } as Task;
                  }
              }
              return t;
          });
          
          if (changed) {
              setTasks(updatedTasks);
              fakeApi.writeTasks(updatedTasks);
          }
      }, 5000);
      return () => clearInterval(interval);
  }, [tasks]);


  if (!user) {
    return (
        // Replaced overflow-hidden with overflow-y-auto to allow scrolling on mobile devices (fixing login issue)
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-y-auto">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="relative z-10 w-full">
                <LoginCard onLogin={setUser} />
            </div>
            <div className="absolute bottom-4 text-slate-500 text-xs">v0.1.0</div>
        </div>
    );
  }

  // --- Handlers ---

  const handleCreateTask = async (data: any) => {
    const isAdmin = user.role === 'admin';
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      status: 'pending', 
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      bids: [],
      ratings: [],
      approvals: [],
      rejections: [],
    };

    // Auto-approve if creator is council (for records)
    // Admin tasks start pending with 0 approvals to allow choice (submit to CS or force)
    if (user.role === 'council') {
        newTask.approvals.push({ by: user.email, at: new Date().toISOString() });
    }

    const newTasks = [newTask, ...tasks];
    await fakeApi.writeTasks(newTasks);
    setTasks(newTasks);
    setShowCreateForm(false);
    setEditingTaskData(null);
    
    addToast("Succès", "Tâche créée et envoyée pour validation.", "success");
    notify('Conseil Syndical', `Nouvelle tâche à valider : ${newTask.title}`);
  };

  const handleApprove = async (taskId: string) => {
      const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
              const alreadyApproved = t.approvals.some(a => a.by === user.email);
              const isAdmin = user.role === 'admin';

              // If Admin clicks approve, force open immediately even if already approved via creation
              if (isAdmin) {
                   notify('all', `Nouvelle offre disponible : ${t.title}`);
                   // Add approval if not present just for history consistency
                   const approvals = alreadyApproved ? t.approvals : [...t.approvals, { by: user.email, at: new Date().toISOString() }];
                   return { ...t, approvals, status: 'open' as const };
              }

              // Standard flow
              if (alreadyApproved) return t;
              
              const newApprovals = [...t.approvals, { by: user.email, at: new Date().toISOString() }];

              // Threshold reached
              if (newApprovals.length >= COUNCIL_MIN_APPROVALS) {
                  notify('all', `Nouvelle offre disponible : ${t.title}`);
                  return { ...t, approvals: newApprovals, status: 'open' as const };
              }
              return { ...t, approvals: newApprovals };
          }
          return t;
      });
      await fakeApi.writeTasks(updatedTasks);
      setTasks(updatedTasks);
  };

  const handleReject = async (taskId: string) => {
      const updatedTasks = tasks.map(t => {
          if (t.id === taskId) return { ...t, status: 'rejected' as const };
          return t;
      });
      await fakeApi.writeTasks(updatedTasks);
      setTasks(updatedTasks);
  };

  const handleBid = async (taskId: string, bidData: Omit<Bid, 'by' | 'at'>) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        // 48h countdown starts on first bid
        const updates: Partial<Task> = {};
        if (t.bids.length === 0) {
            updates.biddingStartedAt = new Date().toISOString();
        }
        
        notify(['Conseil Syndical', t.createdBy], `Nouvelle enchère sur "${t.title}"`);
        notify('all', `Quelqu'un s'est positionné sur "${t.title}"`);

        return { 
            ...t, 
            ...updates,
            bids: [...t.bids, { ...bidData, by: user.email, at: new Date().toISOString() }] 
        };
      }
      return t;
    });
    await fakeApi.writeTasks(updatedTasks);
    setTasks(updatedTasks);
    addToast("Offre enregistrée", "Votre positionnement a été pris en compte.", "success");
  };

  const handleAward = async (taskId: string) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t || !t.bids.length) return;
    // Lowest bid
    const lowest = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
    
    const updatedTasks = tasks.map(x => x.id === taskId ? { ...x, status: 'awarded' as const, awardedTo: lowest.by, awardedAmount: lowest.amount } : x);
    await fakeApi.writeTasks(updatedTasks);
    setTasks(updatedTasks);
    notify([t.createdBy, lowest.by, 'Conseil Syndical'], `Offre retenue pour "${t.title}"`);
  };

  const handleComplete = async (taskId: string) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    
    // Add to ledger
    const entry: LedgerEntry = {
        taskId: t.id,
        type: t.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
        payer: t.scope === 'copro' ? 'COPRO' : t.createdBy,
        payee: t.awardedTo!,
        amount: t.awardedAmount!,
        at: new Date().toISOString(),
    };
    
    const newLedger = [...ledger, entry];
    await fakeApi.writeLedger(newLedger);
    setLedger(newLedger);

    const updatedTasks = tasks.map(x => x.id === taskId ? { ...x, status: 'completed' as const, completionAt: new Date().toISOString() } : x);
    await fakeApi.writeTasks(updatedTasks);
    setTasks(updatedTasks);
    notify('Conseil Syndical', `Travaux terminés : "${t.title}". En attente de notation.`);
  };

  const handleRate = async (taskId: string, ratingData: Omit<Rating, 'at' | 'byHash'>) => {
      const updatedTasks = tasks.map(t => {
          if (t.id === taskId) {
              return { ...t, ratings: [...(t.ratings || []), { ...ratingData, at: new Date().toISOString(), byHash: user.id }] };
          }
          return t;
      });
      await fakeApi.writeTasks(updatedTasks);
      setTasks(updatedTasks);
      addToast("Merci", "Votre avis a été enregistré.", "success");
  };

  const handleDelete = async (taskId: string) => {
      if (user.role !== 'admin') return; // Strict Security Check
      if(!confirm("Supprimer cette tâche ?")) return;
      const newTasks = tasks.filter(t => t.id !== taskId);
      await fakeApi.writeTasks(newTasks);
      setTasks(newTasks);
  };

  const handleDeleteLedgerEntry = async (index: number) => {
      if(!confirm("Supprimer cette ligne comptable ?")) return;
      await fakeApi.deleteLedgerEntry(index);
      refresh();
      addToast("Succès", "Ligne comptable supprimée.", "success");
  };

  // User Management Handlers
  const handleApproveUser = async (email: string) => {
      await fakeApi.approveUser(email);
      refresh();
      notify(email, "Votre compte CoproSmart a été validé !");
      addToast("Utilisateur validé", email, "success");
  };

  const handleRejectUser = async (email: string) => {
      if(!confirm("Rejeter cet utilisateur ?")) return;
      await fakeApi.rejectUser(email);
      refresh();
  };

  const handleUpdateUserStatus = async (email: string, status: 'active'|'rejected'|'deleted') => {
      await fakeApi.updateUserStatus(email, status);
      refresh();
  };

  const handleEditUser = async (data: any) => {
      if (!editingUser) return;
      await fakeApi.updateUser(editingUser.email, data);
      setEditingUser(null);
      refresh();
      addToast("Profil mis à jour", "", "success");
  };


  // --- Views ---

  const ValidationQueue = () => {
      // Now visible to everyone, but actions are restricted
      const pending = tasks.filter(t => t.status === 'pending');
      if (pending.length === 0) return null;
      
      const canAct = user.role === 'admin' || user.role === 'council';

      return (
          <div className="mb-8 space-y-4">
              <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                  ⚠️ Tâches en attente de validation ({pending.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                  {pending.map(t => (
                      <TaskCard 
                        key={t.id} 
                        task={t} 
                        me={user} 
                        usersMap={usersMap}
                        onBid={()=>{}} 
                        onAward={()=>{}} 
                        onComplete={()=>{}} 
                        onRate={()=>{}} 
                        onPayApartment={()=>{}} 
                        onDelete={() => handleDelete(t.id)}
                        canDelete={user.role === 'admin'} // Restriction: Only Admin
                        // Only pass approval handlers if user has rights to act
                        onApprove={canAct ? () => handleApprove(t.id) : undefined}
                        onReject={canAct ? () => handleReject(t.id) : undefined}
                      />
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-10">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-40 shadow-lg">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-inner"></div>
                    <h1 className="font-bold text-xl text-white tracking-tight">CoproSmart</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-bold text-white leading-none mb-0.5">
                            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold mr-1.5 align-middle">
                                {user.role === 'admin' ? 'ADMINISTRATEUR' : user.role === 'council' ? 'CONSEIL SYNDICAL' : 'COPROPRIÉTAIRE'}
                            </span>
                            {user.firstName} {user.lastName.toUpperCase()}
                        </div>
                        <div className="text-xs text-slate-400">{user.email}</div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => { fakeApi.logout(); setUser(null); }}>Déconnexion</Button>
                </div>
            </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
            
            {/* Navigation Tabs */}
            <nav className="flex flex-wrap gap-2 mb-8 border-b border-slate-700 pb-4">
                <Button variant={view === 'dashboard' ? 'primary' : 'ghost'} onClick={() => setView('dashboard')}>📋 Tableau de bord</Button>
                {(user.role === 'admin' || user.role === 'council') && (
                    <Button variant={view === 'ledger' ? 'primary' : 'ghost'} onClick={() => setView('ledger')}>📒 Écritures</Button>
                )}
                <Button variant={view === 'directory' ? 'primary' : 'ghost'} onClick={() => setView('directory')}>👥 Annuaire</Button>
                <Button variant={view === 'cgu' ? 'primary' : 'ghost'} onClick={() => setView('cgu')}>⚖️ CGU</Button>
            </nav>

            <Toaster toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

            {/* CGU VIEW */}
            {view === 'cgu' && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-2xl font-bold text-white">Conditions Générales d'Utilisation (CGU)</h2>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4 text-slate-300">
                        <section>
                            <h3 className="text-lg font-bold text-white mb-2">1. Philosophie & Initiative</h3>
                            <p>CoproSmart encourage l'initiative individuelle. Chaque copropriétaire est libre de proposer des améliorations ou des réparations pour la résidence. L'objectif est de réduire les coûts et d'accélérer les petits travaux grâce aux talents internes.</p>
                        </section>
                         <section>
                            <h3 className="text-lg font-bold text-white mb-2">2. Validation & Enchères</h3>
                            <p>Toute tâche proposée doit être validée par 2 membres du Conseil Syndical avant d'être ouverte aux offres. Une fois ouverte, un système d'enchères inversées permet d'obtenir le meilleur prix. L'attribution est automatique après 24h si des offres existent.</p>
                        </section>
                        <section>
                            <h3 className="text-lg font-bold text-white mb-2">3. Paiement & Déduction de charges</h3>
                            <p>Pour les travaux sur les parties communes, <b>aucun virement bancaire n'est effectué</b>. Le montant validé est inscrit au "Journal des écritures" et sera <b>déduit de votre prochain appel de charges</b> par le syndic.</p>
                            <p>Pour les travaux privatifs, le règlement se fait de la main à la main entre voisins.</p>
                        </section>
                         <section>
                            <h3 className="text-lg font-bold text-white mb-2">4. Responsabilité</h3>
                            <p>Le copropriétaire intervenant s'engage à réaliser la tâche avec soin et dans les délais annoncés. Une garantie de bonne exécution (définie lors de la création de la tâche) s'applique.</p>
                        </section>
                    </div>
                </div>
            )}

            {/* LEDGER VIEW */}
            {view === 'ledger' && (user.role === 'admin' || user.role === 'council') && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                     <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Journal des Écritures</h2>
                        <div className="text-sm text-slate-400">Total mouvements: <span className="text-white font-bold">{ledger.length}</span></div>
                     </div>
                     <p className="text-slate-400 text-sm">Ce journal fait foi pour la déduction des montants sur les appels de charges trimestriels.</p>
                     <Ledger entries={ledger} tasks={tasks} usersMap={usersMap} onDelete={handleDeleteLedgerEntry} isAdmin={user.role === 'admin'} />
                </div>
            )}

            {/* DIRECTORY VIEW */}
            {view === 'directory' && (
                <div className="animate-in fade-in duration-500">
                    <UserDirectory 
                        me={user} 
                        users={directoryUsers} 
                        tasks={tasks}
                        onUpdateStatus={handleUpdateUserStatus} 
                        onEditUser={setEditingUser}
                    />
                </div>
            )}

            {/* DASHBOARD VIEW */}
            {view === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    
                    {/* Pending Users (Admin/CS Only) */}
                    {(user.role === 'admin' || user.role === 'council') && (
                        <UserValidationQueue users={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />
                    )}

                    {/* Validation Queue */}
                    <ValidationQueue />

                    {/* Actions Bar */}
                    {!showCreateForm && (
                        <div className="flex justify-between items-center bg-gradient-to-r from-indigo-900/20 to-purple-900/20 p-6 rounded-2xl border border-indigo-500/20">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Bonjour, {user.firstName} !</h2>
                                <p className="text-slate-400">Il y a <span className="text-indigo-400 font-bold">{tasks.filter(t => t.status === 'open').length}</span> appels d'offres en cours.</p>
                            </div>
                            <Button size="lg" onClick={() => setShowCreateForm(true)} className="shadow-lg shadow-indigo-500/20">
                                <span className="text-lg mr-1">+</span> Nouvelle demande
                            </Button>
                        </div>
                    )}

                    {showCreateForm && (
                        <div className="animate-in slide-in-from-top-4 duration-300">
                            <CreateTaskForm onSubmit={handleCreateTask} onCancel={() => setShowCreateForm(false)} initialData={editingTaskData} />
                        </div>
                    )}

                    {/* Open Tasks */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                            🚀 Offres ouvertes <Badge className="ml-auto bg-indigo-500 text-white">{tasks.filter(t => t.status === 'open').length}</Badge>
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {tasks.filter(t => t.status === 'open').map(t => (
                                <TaskCard 
                                    key={t.id} 
                                    task={t} 
                                    me={user} 
                                    usersMap={usersMap}
                                    onBid={(b) => handleBid(t.id, b)} 
                                    onAward={() => handleAward(t.id)}
                                    onComplete={() => handleComplete(t.id)}
                                    onRate={(r) => handleRate(t.id, r)}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={user.role === 'admin'} // Restriction: Only Admin
                                />
                            ))}
                            {tasks.filter(t => t.status === 'open').length === 0 && (
                                <p className="text-slate-500 italic text-center py-8">Aucune offre ouverte pour le moment.</p>
                            )}
                        </div>
                    </div>
                    
                    {/* My Active Tasks (Awarded to me) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                            🛠️ Mes travaux à réaliser <Badge className="ml-auto bg-sky-500 text-white">{tasks.filter(t => t.status === 'awarded' && t.awardedTo === user.email).length}</Badge>
                        </h3>
                         <div className="grid grid-cols-1 gap-4">
                            {tasks.filter(t => t.status === 'awarded' && t.awardedTo === user.email).map(t => (
                                <TaskCard 
                                    key={t.id} 
                                    task={t} 
                                    me={user} 
                                    usersMap={usersMap}
                                    onBid={()=>{}} 
                                    onAward={()=>{}} 
                                    onComplete={() => handleComplete(t.id)}
                                    onRate={()=>{}} 
                                    onPayApartment={()=>{}}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={user.role === 'admin'} // Restriction: Only Admin
                                />
                            ))}
                             {tasks.filter(t => t.status === 'awarded' && t.awardedTo === user.email).length === 0 && (
                                <p className="text-slate-500 italic text-center py-4">Vous n'avez aucun travail en cours.</p>
                            )}
                        </div>
                    </div>

                    {/* Completed Tasks (History) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                            ✅ Historique terminé
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                             {tasks.filter(t => t.status === 'completed').map(t => (
                                <TaskCard 
                                    key={t.id} 
                                    task={t} 
                                    me={user} 
                                    usersMap={usersMap}
                                    onBid={()=>{}} 
                                    onAward={()=>{}} 
                                    onComplete={()=>{}} 
                                    onRate={(r) => handleRate(t.id, r)} 
                                    onPayApartment={()=>{}}
                                    onDelete={() => handleDelete(t.id)}
                                    canDelete={user.role === 'admin'} // Restriction: Only Admin
                                />
                            ))}
                        </div>
                    </div>

                     {/* Rejected Tasks (Collapsible or Bottom) */}
                     {tasks.filter(t => t.status === 'rejected').length > 0 && (
                        <div className="space-y-4 pt-8 border-t border-slate-800">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Refusées</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                                {tasks.filter(t => t.status === 'rejected').map(t => (
                                    <TaskCard 
                                        key={t.id} 
                                        task={t} 
                                        me={user} 
                                        usersMap={usersMap}
                                        onBid={()=>{}} 
                                        onAward={()=>{}} 
                                        onComplete={()=>{}} 
                                        onRate={()=>{}} 
                                        onPayApartment={()=>{}}
                                        onDelete={() => handleDelete(t.id)}
                                        canDelete={user.role === 'admin'} // Restriction: Only Admin
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <UserEditModal 
                    user={editingUser} 
                    me={user}
                    onSave={handleEditUser} 
                    onCancel={() => setEditingUser(null)} 
                />
            )}

        </main>
    </div>
  );
}
