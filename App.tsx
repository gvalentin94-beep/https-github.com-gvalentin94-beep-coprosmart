
import React, { useState, useEffect, useCallback } from 'react';
import type { Task, User, LedgerEntry, TaskCategory, TaskScope, Rating, Bid, RegisteredUser, UserRole } from './types';
import { useAuth, fakeApi } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE } from './constants';
import { LoginCard } from './components/LoginCard';

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
            <p className="text-xs opacity-90 mt-1">{t.message}</p>
          </div>
          <button onClick={() => onClose(t.id)} className="text-current opacity-50 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

// --- Helper Components ---

function TaskPreviewModal({ task, onConfirm, onCancel }: { task: Partial<Task>; onConfirm: () => void; onCancel: () => void }) {
    const catLabel = CATEGORIES.find(c => c.id === task.category)?.label;
    const scopeLabel = SCOPES.find(s => s.id === task.scope)?.label;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <CardTitle>🔍 Vérifiez votre demande</CardTitle>
                    <p className="text-slate-400 text-sm">Relisez bien les informations avant de soumettre au Conseil Syndical.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-slate-500">Titre:</span> <div className="font-medium text-white">{task.title}</div></div>
                        <div><span className="text-slate-500">Concerne:</span> <div className="font-medium text-white">{scopeLabel}</div></div>
                        <div><span className="text-slate-500">Catégorie:</span> <div className="font-medium text-white">{catLabel}</div></div>
                        <div><span className="text-slate-500">Emplacement:</span> <div className="font-medium text-white">{task.location}</div></div>
                        <div><span className="text-slate-500">Prix départ:</span> <div className="font-medium text-indigo-400">{task.startingPrice} €</div></div>
                        <div><span className="text-slate-500">Garantie:</span> <div className="font-medium text-white">{task.warrantyDays} jours</div></div>
                    </div>
                    {task.photo && (
                        <div>
                            <span className="text-slate-500 text-sm">Photo:</span>
                            <img src={task.photo} alt="Aperçu" className="mt-1 h-40 rounded border border-slate-700 object-cover" />
                        </div>
                    )}
                    <div>
                        <span className="text-slate-500 text-sm">Détails:</span>
                        <div className="mt-1 p-3 bg-slate-800 rounded border border-slate-700 text-slate-300 text-sm whitespace-pre-wrap">{task.details}</div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <Button variant="outline" onClick={onCancel}>Modifier</Button>
                        <Button onClick={onConfirm}>✅ Confirmer et soumettre</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function UserValidationQueue({ pendingUsers, onApprove, onReject }: { pendingUsers: RegisteredUser[], onApprove: (email: string) => void, onReject: (email: string) => void }) {
    if (pendingUsers.length === 0) return null;

    return (
        <Card className="mb-6 border-amber-500/30 bg-amber-900/10">
            <CardHeader>
                <CardTitle className="text-amber-400 text-base">👥 Inscriptions en attente ({pendingUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {pendingUsers.map(u => (
                        <div key={u.email} className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
                            <div>
                                <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-slate-400">{u.email} - {ROLES.find(r => r.id === u.role)?.label}</div>
                                <div className="text-xs text-slate-500">{u.id}</div>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 border-none text-white" onClick={() => onApprove(u.email)}>Accepter</Button>
                                <Button size="sm" variant="destructive" onClick={() => onReject(u.email)}>Refuser</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function Ledger({ entries, usersMap, onDelete, isAdmin }: { entries: LedgerEntry[], usersMap: Record<string, string>, onDelete: (idx: number) => void, isAdmin: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>📒 Journal des écritures</CardTitle></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-slate-400 italic text-center">Aucune écriture comptable.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-2 py-3">Date</th>
                  <th className="px-2 py-3">Type</th>
                  <th className="px-2 py-3">Tâche / Objet</th>
                  <th className="px-2 py-3">Payeur</th>
                  <th className="px-2 py-3">Bénéficiaire</th>
                  <th className="px-2 py-3 text-right">Montant</th>
                  {isAdmin && <th className="px-2 py-3 text-center w-10">Action</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-800/50">
                    <td className="px-2 py-3">{new Date(e.at).toLocaleDateString()}</td>
                    <td className="px-2 py-3">
                        {e.type === 'charge_credit' 
                            ? <Badge color="emerald">Crédit Charges</Badge> 
                            : <Badge color="indigo">Privatif</Badge>}
                    </td>
                    <td className="px-2 py-3">
                        <div className="font-medium text-white">{e.taskTitle}</div>
                        <div className="text-xs text-slate-500">Créée par {usersMap[e.taskCreator || ''] || e.taskCreator}</div>
                    </td>
                    <td className="px-2 py-3">{e.payer === 'Copro' ? '🏢 Copropriété' : (usersMap[e.payer] || e.payer)}</td>
                    <td className="px-2 py-3">{usersMap[e.payee] || e.payee}</td>
                    <td className="px-2 py-3 text-right font-mono text-white font-bold">{e.amount} €</td>
                    {isAdmin && (
                        <td className="px-2 py-3 text-center">
                            <button onClick={() => onDelete(i)} className="text-rose-500 hover:text-rose-400" title="Supprimer">🗑️</button>
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

function UserDirectory({ users, tasks, me, onBan, onRestore, onUpdateUser, onDeleteRating }: { 
    users: RegisteredUser[], 
    tasks: Task[], 
    me: User, 
    onBan: (email: string) => void, 
    onRestore: (email: string) => void,
    onUpdateUser: (email: string, data: any) => void,
    onDeleteRating: (taskId: string, ratingIdx: number) => void
}) {
    const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editRole, setEditRole] = useState<UserRole>("owner");

    const handleEditClick = (u: RegisteredUser) => {
        setEditingUser(u);
        setEditFirstName(u.firstName);
        setEditLastName(u.lastName);
        setEditRole(u.role);
    };

    const handleSaveUser = () => {
        if (editingUser) {
            onUpdateUser(editingUser.email, {
                firstName: editFirstName,
                lastName: editLastName,
                role: (me.role === 'admin' || me.role === 'council') ? editRole : editingUser.role
            });
            setEditingUser(null);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">👥 Annuaire des Copropriétaires</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(u => {
                    const isMe = u.email === me.email;
                    const canEdit = isMe || me.role === 'admin' || me.role === 'council';
                    const isDeleted = u.status === 'deleted';
                    
                    // Get completed tasks for history
                    const history = tasks.filter(t => t.status === 'completed' && t.awardedTo === u.email);
                    
                    return (
                        <Card key={u.email} className={isDeleted ? 'opacity-50 grayscale' : ''}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg text-white">{u.firstName} {u.lastName}</div>
                                        <div className="text-sm text-slate-400">{u.email}</div>
                                        <div className="mt-1">
                                            <Badge>{ROLES.find(r => r.id === u.role)?.label}</Badge>
                                            {isDeleted && <Badge variant="destructive" className="ml-2">Banni</Badge>}
                                        </div>
                                    </div>
                                    {canEdit && !isDeleted && (
                                        <Button size="sm" variant="outline" onClick={() => handleEditClick(u)}>✏️</Button>
                                    )}
                                </div>

                                {/* Admin Actions */}
                                {(me.role === 'admin' || me.role === 'council') && !isMe && (
                                    <div className="pt-2 border-t border-slate-700 flex gap-2">
                                        {!isDeleted ? (
                                             <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={() => onBan(u.email)}>🚫 Bannir</Button>
                                        ) : (
                                             me.role === 'admin' && <Button size="sm" className="w-full h-7 text-xs bg-emerald-600 border-none text-white" onClick={() => onRestore(u.email)}>♻️ Rétablir</Button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Work History */}
                                <div className="pt-2 border-t border-slate-700">
                                    <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Travaux réalisés</div>
                                    {history.length === 0 ? (
                                        <p className="text-xs text-slate-600 italic">Aucun historique.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {history.map(t => (
                                                <li key={t.id} className="text-xs bg-slate-900/30 p-2 rounded">
                                                    <div className="flex justify-between text-slate-300">
                                                        <span>{t.title}</span>
                                                        <span className="font-mono text-emerald-400">+{t.awardedAmount}€</span>
                                                    </div>
                                                    <div className="text-slate-500 mt-0.5">{new Date(t.completionAt!).toLocaleDateString()}</div>
                                                    {/* Ratings display in directory */}
                                                    {t.ratings && t.ratings.length > 0 && (
                                                        <div className="mt-1 pt-1 border-t border-slate-700/50 space-y-1">
                                                            {t.ratings.map((r, idx) => (
                                                                <div key={idx} className="flex justify-between items-start gap-2 group">
                                                                    <div className="bg-slate-800/50 p-1 rounded w-full">
                                                                        <div className="text-[10px] text-amber-400">{Array(r.stars).fill('⭐').join('')}</div>
                                                                        <div className="text-[10px] text-slate-400 italic">"{r.comment}"</div>
                                                                    </div>
                                                                    {(me.role === 'admin' || me.role === 'council') && (
                                                                         <button 
                                                                            onClick={() => onDeleteRating(t.id, idx)}
                                                                            className="text-rose-500 opacity-0 group-hover:opacity-100"
                                                                            title="Supprimer avis"
                                                                         >✖</button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-slate-800 border-slate-700">
                        <CardHeader><CardTitle>Modifier le profil</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <Label>Prénom</Label>
                                <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                            </div>
                            <div>
                                <Label>Nom</Label>
                                <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                            </div>
                            {(me.role === 'admin' || me.role === 'council') && (
                                <div>
                                    <Label>Rôle</Label>
                                    <Select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </Select>
                                </div>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setEditingUser(null)}>Annuler</Button>
                                <Button onClick={handleSaveUser}>Enregistrer</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function CreateTaskForm({ me, onSubmit }: { me: User, onSubmit: (t: Partial<Task>) => void }) {
    // Form State
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<TaskCategory>("ampoule");
    const [scope, setScope] = useState<TaskScope>("copro");
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [details, setDetails] = useState("");
    const [startingPrice, setStartingPrice] = useState("");
    const [warranty, setWarranty] = useState("0"); // 0, 30, 90, 180, 365
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    
    // Preview State
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
        if (!title.trim() || !location || !startingPrice) {
            alert("Titre, Emplacement et Prix sont obligatoires.");
            return;
        }
        const price = Number(startingPrice);
        if (isNaN(price) || price <= 0) {
            alert("Prix invalide.");
            return;
        }
        if (price > MAX_TASK_PRICE) {
             alert(`Le prix ne peut pas dépasser ${MAX_TASK_PRICE}€.`);
             return;
        }
        setShowPreview(true);
    };

    const confirmSubmit = () => {
        onSubmit({
            title,
            category,
            scope,
            location,
            details,
            startingPrice: Number(startingPrice),
            warrantyDays: Number(warranty),
            photo
        });
        // Reset
        setTitle("");
        setDetails("");
        setStartingPrice("");
        setPhoto(undefined);
        setShowPreview(false);
    };

    const taskData = {
        title, category, scope, location, details, startingPrice: Number(startingPrice), warrantyDays: Number(warranty), photo
    };

    // Style helper for compact labels
    const LabelSm = ({ children }: { children: React.ReactNode }) => <Label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{children}</Label>;

    return (
        <>
            <div className="space-y-3">
                <div>
                    <LabelSm>Titre de la demande <span className="text-rose-500">*</span></LabelSm>
                    <Input placeholder="Ex: Ampoule grillée Hall A" value={title} onChange={(e) => setTitle(e.target.value)} className="text-sm py-1.5" />
                </div>

                {/* Category and Scope immediately below Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <LabelSm>Catégorie</LabelSm>
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id as TaskCategory)}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] transition-all ${
                                        category === cat.id ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {React.cloneElement(cat.icon, { className: "h-4 w-4 mb-0.5" })}
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <LabelSm>Concerne</LabelSm>
                        <div className="grid grid-cols-1 gap-2">
                            {SCOPES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setScope(s.id as TaskScope)}
                                    className={`p-2 rounded-lg border text-xs text-left transition-all ${
                                        scope === s.id ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <div>
                        <LabelSm>Emplacement <span className="text-rose-500">*</span></LabelSm>
                        <Select value={location} onChange={(e) => setLocation(e.target.value)} className="text-sm py-1.5">
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </Select>
                    </div>
                    <div>
                        <LabelSm>Prix de départ (€) <span className="text-rose-500">*</span></LabelSm>
                        <div className="relative">
                            <Input 
                                type="number" 
                                placeholder="15" 
                                className="pl-8 text-sm py-1.5"
                                value={startingPrice} 
                                onChange={(e) => setStartingPrice(e.target.value)} 
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">€</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Max: {MAX_TASK_PRICE}€</p>
                    </div>
                </div>

                <div>
                    <LabelSm>Détails (Optionnel)</LabelSm>
                    <Textarea placeholder="Précisions utiles..." value={details} onChange={(e) => setDetails(e.target.value)} className="text-sm py-1.5 min-h-[60px]" />
                </div>
                
                <div>
                    <LabelSm>Photo (Optionnel)</LabelSm>
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="p-1 text-xs file:mr-4 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                </div>

                <div className="space-y-2">
                    <LabelSm>Garantie offerte (Mois)</LabelSm>
                    <div className="flex justify-center gap-1.5">
                        {[
                            { val: "0", label: "Sans" },
                            { val: "30", label: "1 mois" },
                            { val: "90", label: "3 mois" },
                            { val: "180", label: "6 mois" },
                            { val: "365", label: "12 mois" }
                        ].map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => setWarranty(opt.val)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${
                                    warranty === opt.val ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Button className="w-full mt-2 text-sm" onClick={handlePreview}>Prévisualiser la tâche</Button>
            </div>

            {showPreview && (
                <TaskPreviewModal 
                    task={taskData} 
                    onConfirm={confirmSubmit} 
                    onCancel={() => setShowPreview(false)} 
                />
            )}
        </>
    );
}

// --- Main Dashboard Component ---

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [view, setView] = useState<'home' | 'directory' | 'ledger'>('home');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<RegisteredUser[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (title: string, message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // --- Email Notification via API ---
  const notify = async (recipients: string[], subject: string, message: string) => {
      // Visual feedback
      addToast("Notification", `Email envoyé pour : ${subject}`, "info");

      // Send via API (Serverless)
      try {
          await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  to: recipients,
                  subject: `[CoproSmart] ${subject}`,
                  html: `<div style="font-family: sans-serif;">
                            <h2 style="color: #4f46e5;">CoproSmart Notification</h2>
                            <p>${message}</p>
                            <hr/>
                            <p style="font-size: 12px; color: #888;">Ceci est une notification automatique.</p>
                         </div>`
              })
          });
      } catch (e) {
          console.error("Failed to send email via API", e);
      }
  };
  
  // Helper to get emails by role
  const getEmailsByRole = (roles: UserRole[]) => {
      return directoryUsers.filter(u => roles.includes(u.role)).map(u => u.email);
  }

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const t = await fakeApi.readTasks();
      setTasks(t);
      const l = await fakeApi.readLedger();
      setLedger(l);
      
      // Admin/Council specific data
      if (user.role === 'admin' || user.role === 'council') {
          const pu = await fakeApi.getPendingUsers();
          setPendingUsers(pu);
      }
      
      // Directory for names and emails
      const dir = await fakeApi.getDirectory();
      setDirectoryUsers(dir);
      
      // Build map email -> Name
      const mapping: Record<string, string> = {};
      dir.forEach(u => { mapping[u.email] = `${u.firstName} ${u.lastName.toUpperCase()}`; });
      setUsersMap(mapping);

    } catch (e) {
      console.error(e);
    }
  }, [user.role]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling for updates
    return () => clearInterval(interval);
  }, [loadData]);

  // --- AUTO AWARD LOGIC ---
  useEffect(() => {
      const interval = setInterval(() => {
          let changed = false;
          const newTasks = tasks.map(t => {
              // Check 24h timeout for Open tasks
              if (t.status === 'open' && t.biddingStartedAt && t.bids.length > 0) {
                  const endTime = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000;
                  const now = new Date().getTime();
                  
                  if (now > endTime) {
                      // Time is up! Auto-award to lowest bidder
                      const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                      
                      // Send emails
                      notify([lowestBid.by], "Félicitations ! Tâche attribuée", `Vous avez remporté la tâche "${t.title}" pour ${lowestBid.amount}€.`);
                      const councilEmails = getEmailsByRole(['council', 'admin']);
                      notify(councilEmails, "Attribution automatique", `La tâche "${t.title}" a été attribuée à ${lowestBid.by}.`);

                      changed = true;
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
              setTasks(newTasks);
              fakeApi.writeTasks(newTasks);
          }

      }, 5000); 
      return () => clearInterval(interval);
  }, [tasks]);


  // --- Handlers ---

  const handleCreateTask = async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskData.title!,
      category: taskData.category!,
      scope: taskData.scope!,
      details: taskData.details || "",
      location: taskData.location!,
      startingPrice: taskData.startingPrice!,
      warrantyDays: taskData.warrantyDays || 0,
      status: 'pending', // Admin tasks are now also pending by default, forcing a conscious "force validate" action
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      bids: [],
      ratings: [],
      approvals: [],
      rejections: [],
      photo: taskData.photo
    };

    // Auto-approve for council members creating tasks
    if (user.role === 'council' || user.role === 'admin') {
        newTask.approvals.push({ by: user.email, at: new Date().toISOString() });
    }

    const newTasks = [newTask, ...tasks];
    setTasks(newTasks);
    await fakeApi.writeTasks(newTasks);
    addToast("Succès", "Tâche créée et soumise.", "success");
  };

  const handleApprove = async (taskId: string) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              const alreadyApproved = t.approvals.some(a => a.by === user.email);
              // Admin force validation OR normal council vote
              const forceValidate = user.role === 'admin';
              
              const newApprovals = alreadyApproved ? t.approvals : [...t.approvals, { by: user.email, at: new Date().toISOString() }];
              
              // Check if we reached threshold OR if admin forced it
              if (newApprovals.length >= COUNCIL_MIN_APPROVALS || forceValidate) {
                  notify(getEmailsByRole(['owner', 'council', 'admin']), "Nouvelle offre disponible", `La tâche "${t.title}" est ouverte aux offres !`);
                  return { ...t, approvals: newApprovals, status: 'open' } as Task;
              } else {
                  return { ...t, approvals: newApprovals };
              }
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
  };

  const handleReject = async (taskId: string) => {
       const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              return { ...t, status: 'rejected', rejections: [...t.rejections, { by: user.email, at: new Date().toISOString() }] } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
  };

  const handleBid = async (taskId: string, bidData: Omit<Bid, 'by' | 'at'>) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              const newBid: Bid = { ...bidData, by: user.email, at: new Date().toISOString() };
              const updatedTask = { ...t, bids: [...t.bids, newBid] };
              
              // Start 24h timer if this is the FIRST bid
              if (!updatedTask.biddingStartedAt) {
                  updatedTask.biddingStartedAt = new Date().toISOString();
              }
              
              notify(getEmailsByRole(['owner', 'council', 'admin']), "Nouvelle enchère", `Nouvelle offre de ${bidData.amount}€ sur "${t.title}".`);
              return updatedTask;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
      addToast("Offre enregistrée", "Votre positionnement a été pris en compte.", "success");
  };

  const handleAward = async (taskId: string) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
              notify([lowestBid.by], "Tâche attribuée", `Félicitations, vous avez remporté la tâche "${t.title}".`);
              return { ...t, status: 'awarded', awardedTo: lowestBid.by, awardedAmount: lowestBid.amount } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
  };

  // --- Workflow: Verification & Completion ---

  const handleRequestVerification = async (taskId: string) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              notify(getEmailsByRole(['council', 'admin']), "Vérification demandée", `Le copropriétaire a terminé "${t.title}". Merci de vérifier.`);
              return { ...t, status: 'verification' } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
  };

  const handleRejectWork = async (taskId: string) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
               notify([t.awardedTo!], "Travail refusé", `Le CS a refusé votre travail sur "${t.title}". Merci de corriger.`);
               return { ...t, status: 'awarded' } as Task; // Back to awarded
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
  };

  const handleComplete = async (taskId: string) => {
      // 1. Update Task
      let amount = 0;
      let payer = "";
      let payee = "";
      let taskTitle = "";
      let taskCreator = "";
      let type: "charge_credit" | "apartment_payment" = "charge_credit";

      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              amount = t.awardedAmount || 0;
              payee = t.awardedTo || "";
              payer = t.scope === 'copro' ? 'Copro' : t.createdBy;
              taskTitle = t.title;
              taskCreator = t.createdBy;
              type = t.scope === 'copro' ? 'charge_credit' : 'apartment_payment';
              
              return { 
                  ...t, 
                  status: 'completed', 
                  completionAt: new Date().toISOString(),
                  validatedBy: user.email // Track who validated
              } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);

      // 2. Add to Ledger
      const newEntry: LedgerEntry = {
          taskId,
          type,
          payer,
          payee,
          amount,
          at: new Date().toISOString(),
          taskTitle: taskTitle,    // NEW: Add details for ledger visibility
          taskCreator: taskCreator // NEW
      };
      const newLedger = [...ledger, newEntry];
      setLedger(newLedger);
      await fakeApi.writeLedger(newLedger);

      notify([payee], "Paiement validé", `Votre travail sur "${taskTitle}" a été validé. ${amount}€ crédités.`);
  };

  const handleRate = async (taskId: string, rating: Omit<Rating, 'at' | 'byHash'>) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              const newRating = { ...rating, at: new Date().toISOString(), byHash: user.id };
              return { ...t, ratings: [...(t.ratings || []), newRating] } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
      addToast("Merci", "Votre avis a été enregistré.", "success");
  };

  const handleDeleteRating = async (taskId: string, ratingIndex: number) => {
      await fakeApi.deleteRating(taskId, ratingIndex, user.email); // Pass user email for history
      loadData();
      addToast("Supprimé", "Le commentaire a été supprimé et archivé.", "info");
  }

  const handleDelete = async (taskId: string) => {
      if (user.role !== 'admin') return; // Security
      if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
          const newTasks = tasks.filter(t => t.id !== taskId);
          setTasks(newTasks);
          await fakeApi.writeTasks(newTasks);
          addToast("Supprimé", "Tâche supprimée.", "info");
      }
  };
  
  const handleDeleteLedgerEntry = async (idx: number) => {
      if (user.role !== 'admin') return;
      if (confirm("Supprimer cette écriture comptable ?")) {
          await fakeApi.deleteLedgerEntry(idx);
          loadData();
      }
  }

  // --- User Validation Handlers ---
  const handleApproveUser = async (email: string) => {
      await fakeApi.approveUser(email);
      setPendingUsers(prev => prev.filter(u => u.email !== email));
      notify([email], "Compte validé", "Bienvenue sur CoproSmart ! Votre compte a été validé par le Conseil Syndical.");
      loadData();
  };
  const handleRejectUser = async (email: string) => {
      await fakeApi.rejectUser(email);
      setPendingUsers(prev => prev.filter(u => u.email !== email));
      loadData();
  };
  const handleBanUser = async (email: string) => {
      if (confirm(`Bannir ${email} ?`)) {
          await fakeApi.updateUserStatus(email, 'deleted');
          loadData();
      }
  }
  const handleRestoreUser = async (email: string) => {
      await fakeApi.updateUserStatus(email, 'active');
      loadData();
  }
  const handleUpdateUser = async (email: string, data: any) => {
      await fakeApi.updateUser(email, data);
      loadData();
  }


  // --- View Logic ---

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-slate-900/80 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
             <button onClick={() => setView('home')} className="flex flex-col items-start focus:outline-none group">
                <h1 className="text-2xl font-black tracking-tighter text-white group-hover:text-indigo-400 transition-colors">
                    CoproSmart
                </h1>
                <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-widest">Simple. Local. Gagnant-gagnant.</span>
            </button>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
                <button onClick={() => setView('home')} className={`text-sm font-medium transition-colors ${view === 'home' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Accueil</button>
                <button onClick={() => setView('directory')} className={`text-sm font-medium transition-colors ${view === 'directory' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>👥 Annuaire</button>
                {(user.role === 'admin' || user.role === 'council') && (
                    <button onClick={() => setView('ledger')} className={`text-sm font-medium transition-colors ${view === 'ledger' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>📒 Écritures</button>
                )}
            </nav>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{user.firstName} {user.lastName.toUpperCase()}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} title="Déconnexion">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-rose-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                </Button>
            </div>
        </div>
      </header>

      {/* --- Mobile Navigation Bar (Bottom) --- */}
       <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 flex justify-around py-3 z-40 pb-safe">
           <button onClick={() => setView('home')} className={`flex flex-col items-center ${view === 'home' ? 'text-indigo-400' : 'text-slate-500'}`}>
               <span className="text-xl">🏠</span><span className="text-[10px]">Accueil</span>
           </button>
           <button onClick={() => setView('directory')} className={`flex flex-col items-center ${view === 'directory' ? 'text-indigo-400' : 'text-slate-500'}`}>
               <span className="text-xl">👥</span><span className="text-[10px]">Annuaire</span>
           </button>
            {(user.role === 'admin' || user.role === 'council') && (
                 <button onClick={() => setView('ledger')} className={`flex flex-col items-center ${view === 'ledger' ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <span className="text-xl">📒</span><span className="text-[10px]">Compta</span>
                </button>
            )}
       </div>


      <main className="flex-grow max-w-5xl mx-auto w-full p-4 pb-24 md:pb-8 space-y-8">
        
        {/* USER VALIDATION QUEUE (Always visible if pending users exist) */}
        {(user.role === 'council' || user.role === 'admin') && pendingUsers.length > 0 && (
            <UserValidationQueue pendingUsers={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />
        )}

        {view === 'directory' && (
            <UserDirectory 
                users={directoryUsers} 
                tasks={tasks}
                me={user} 
                onBan={handleBanUser} 
                onRestore={handleRestoreUser} 
                onUpdateUser={handleUpdateUser}
                onDeleteRating={handleDeleteRating}
            />
        )}

        {view === 'ledger' && (
            <Ledger entries={ledger} usersMap={usersMap} onDelete={handleDeleteLedgerEntry} isAdmin={user.role === 'admin'} />
        )}

        {view === 'home' && (
            <>
                {/* 1. NEW TASK SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <Card className="border-indigo-500/30 bg-indigo-900/10 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-indigo-300 text-base">✨ Nouvelle tâche</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CreateTaskForm me={user} onSubmit={handleCreateTask} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        
                         {/* 2. PENDING VALIDATION (Visible to all, Actionable by CS/Admin) */}
                        {tasks.some(t => t.status === 'pending') && (
                            <Section title="⏳ En attente de validation">
                                {tasks.filter(t => t.status === 'pending').map(t => {
                                    // Permission Check: Only Admin or Council can validate
                                    const canValidate = user.role === 'admin' || user.role === 'council';
                                    return (
                                        <TaskCard 
                                            key={t.id} task={t} me={user} usersMap={usersMap}
                                            onBid={() => {}} onAward={() => {}} onComplete={() => {}} onRate={() => {}} onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                            canDelete={user.role === 'admin'}
                                            onApprove={canValidate ? () => handleApprove(t.id) : undefined}
                                            onReject={canValidate ? () => handleReject(t.id) : undefined}
                                        />
                                    );
                                })}
                            </Section>
                        )}

                        {/* 3. OPEN OFFERS */}
                        <Section title="🔥 Offres ouvertes">
                             {tasks.filter(t => t.status === 'open').length === 0 ? (
                                <p className="text-slate-500 italic">Aucune offre en cours.</p>
                             ) : (
                                tasks.filter(t => t.status === 'open').map(t => (
                                    <TaskCard 
                                        key={t.id} task={t} me={user} usersMap={usersMap}
                                        onBid={(bid) => handleBid(t.id, bid)} 
                                        onAward={() => handleAward(t.id)} 
                                        onComplete={() => {}} 
                                        onRate={() => {}} onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                        canDelete={user.role === 'admin'}
                                    />
                                ))
                             )}
                        </Section>

                        {/* 4. WORKS IN PROGRESS (Awarded & Verification) */}
                        <Section title="🏗️ Travaux en cours">
                            {tasks.filter(t => t.status === 'awarded' || t.status === 'verification').length === 0 ? (
                                <p className="text-slate-500 italic">Aucun chantier en cours.</p>
                             ) : (
                                tasks.filter(t => t.status === 'awarded' || t.status === 'verification').map(t => (
                                    <TaskCard 
                                        key={t.id} task={t} me={user} usersMap={usersMap}
                                        onBid={() => {}} onAward={() => {}} 
                                        onComplete={() => handleComplete(t.id)} 
                                        onRate={() => {}} onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                        canDelete={user.role === 'admin'}
                                        onRequestVerification={() => handleRequestVerification(t.id)}
                                        onRejectWork={() => handleRejectWork(t.id)}
                                    />
                                ))
                             )}
                        </Section>

                         {/* 5. COMPLETED HISTORY */}
                        <Section title="✅ Historique terminé">
                            {tasks.filter(t => t.status === 'completed').sort((a,b) => new Date(b.completionAt!).getTime() - new Date(a.completionAt!).getTime()).map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={user} usersMap={usersMap}
                                    onBid={() => {}} onAward={() => {}} onComplete={() => {}} 
                                    onRate={(r) => handleRate(t.id, r)} 
                                    onDeleteRating={handleDeleteRating}
                                    onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                    canDelete={user.role === 'admin'}
                                />
                            ))}
                        </Section>
                    </div>
                </div>
            </>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-slate-800 bg-slate-900/50 py-8 mt-auto">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
              <div className="text-indigo-500 font-black tracking-tight text-lg">CoproSmart</div>
              <p className="text-slate-400 text-sm leading-relaxed">
                CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes : une ampoule à changer, une porte à régler, des encombrants à évacuer… Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit supplémentaire sur ses propres charges.
              </p>
              <p className="text-slate-300 font-medium">Simple, local, gagnant-gagnant.</p>
              <div className="text-xs text-slate-600 pt-4">
                  v0.1.0 • Résidence Watteau
              </div>
          </div>
      </footer>
      
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}

export default function App() {
  const { user, setUser } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden pt-10 overflow-y-auto">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[100px]"></div>
             <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-rose-900/20 blur-[80px]"></div>
        </div>

        <div className="w-full max-w-md z-10 mb-8 text-center mx-auto">
            <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-white mb-2 leading-none">CoproSmart</h1>
            <h2 className="text-xl font-bold tracking-tight text-white">On réduit vos charges de copropriété.</h2>
        </div>
        
        <div className="w-full max-w-md z-10 mx-auto">
             <LoginCard onLogin={setUser} />
        </div>
        
        <div className="mt-8 text-center text-sm text-slate-400 z-10 max-w-4xl mx-auto leading-relaxed font-medium">
            CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes : une ampoule à changer, une porte à régler, des encombrants à évacuer… Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit supplémentaire sur ses propres charges. Simple, local, gagnant-gagnant.
        </div>
      </div>
    );
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
