
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto shadow-2xl">
                <CardHeader className="border-b border-slate-800">
                    <CardTitle>🔍 Vérifiez votre demande</CardTitle>
                    <p className="text-slate-400 text-sm">Relisez bien les informations avant de soumettre.</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Titre</span> <div className="font-medium text-white text-lg">{task.title}</div></div>
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Prix départ</span> <div className="font-mono text-xl text-indigo-400 font-bold">{task.startingPrice} €</div></div>
                        
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Concerne</span> <div className="font-medium text-white flex items-center gap-2">{task.scope === 'copro' ? '🏢' : '🏠'} {scopeLabel}</div></div>
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Catégorie</span> <div className="font-medium text-white">{catLabel}</div></div>
                        
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Emplacement</span> <div className="font-medium text-white">{task.location}</div></div>
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Garantie</span> <div className="font-medium text-white">{task.warrantyDays} jours</div></div>
                    </div>
                    
                    {task.photo && (
                        <div>
                            <span className="text-slate-500 uppercase text-xs font-bold tracking-wider block mb-2">Photo</span>
                            <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                                <img src={task.photo} alt="Aperçu" className="w-full h-64 object-cover" />
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <span className="text-slate-500 uppercase text-xs font-bold tracking-wider block mb-2">Détails</span>
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{task.details || "Aucun détail supplémentaire."}</div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                        <Button variant="ghost" onClick={onCancel}>Modifier</Button>
                        <Button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6">✅ Confirmer et soumettre</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function UserValidationQueue({ pendingUsers, onApprove, onReject }: { pendingUsers: RegisteredUser[], onApprove: (email: string) => void, onReject: (email: string) => void }) {
    if (pendingUsers.length === 0) return null;

    return (
        <Card className="mb-8 border-amber-500/30 bg-amber-950/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-amber-400 text-base flex items-center gap-2">
                    <span>👥</span> Inscriptions en attente ({pendingUsers.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-3">
                    {pendingUsers.map(u => (
                        <div key={u.email} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-amber-900/30 gap-3">
                            <div>
                                <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-slate-400">{u.email} • <span className="text-amber-200">{ROLES.find(r => r.id === u.role)?.label}</span></div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button size="sm" className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 border-none text-white" onClick={() => onApprove(u.email)}>Accepter</Button>
                                <Button size="sm" variant="destructive" className="flex-1 sm:flex-none" onClick={() => onReject(u.email)}>Refuser</Button>
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
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader><CardTitle className="text-2xl">📒 Journal des écritures</CardTitle></CardHeader>
      <CardContent>
        {entries.length === 0 ? <p className="text-slate-400 italic text-center py-10">Aucune écriture comptable enregistrée.</p> : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950">
                <tr>
                  <th className="px-4 py-4 font-medium">Date</th>
                  <th className="px-4 py-4 font-medium">Type</th>
                  <th className="px-4 py-4 font-medium">Travail</th>
                  <th className="px-4 py-4 font-medium">Payeur</th>
                  <th className="px-4 py-4 font-medium">Bénéficiaire</th>
                  <th className="px-4 py-4 text-right font-medium">Montant</th>
                  {isAdmin && <th className="px-4 py-4 text-center w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/20">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(e.at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                        {e.type === 'charge_credit' 
                            ? <Badge className="bg-emerald-900/30 text-emerald-300 border-emerald-800">Crédit Charges</Badge> 
                            : <Badge className="bg-indigo-900/30 text-indigo-300 border-indigo-800">Privatif</Badge>}
                    </td>
                    <td className="px-4 py-3">
                        <div className="font-medium text-white">{e.taskTitle}</div>
                        <div className="text-xs text-slate-500">par {usersMap[e.taskCreator || ''] || e.taskCreator}</div>
                    </td>
                    <td className="px-4 py-3">{e.payer === 'Copro' ? '🏢 Copropriété' : (usersMap[e.payer] || e.payer)}</td>
                    <td className="px-4 py-3">{usersMap[e.payee] || e.payee}</td>
                    <td className="px-4 py-3 text-right font-mono text-white font-bold text-base">{e.amount} €</td>
                    {isAdmin && (
                        <td className="px-4 py-3 text-center">
                            <button onClick={() => onDelete(i)} className="text-slate-600 hover:text-rose-500 transition-colors p-2" title="Supprimer">🗑️</button>
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
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white tracking-tight">👥 Annuaire</h2>
                <Badge className="bg-slate-800 text-slate-400 border-slate-700">{users.length} membres</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => {
                    const isMe = u.email === me.email;
                    const canEdit = isMe || me.role === 'admin' || me.role === 'council';
                    const isDeleted = u.status === 'deleted';
                    const history = tasks.filter(t => t.status === 'completed' && t.awardedTo === u.email);
                    
                    return (
                        <Card key={u.email} className={`border-slate-700 bg-slate-800/50 hover:border-slate-600 transition-all ${isDeleted ? 'opacity-50 grayscale' : ''}`}>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-lg border border-indigo-500/30">
                                            {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-white leading-tight">{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-slate-400">{u.email}</div>
                                        </div>
                                    </div>
                                    {canEdit && !isDeleted && (
                                        <Button size="sm" variant="ghost" onClick={() => handleEditClick(u)} className="h-8 w-8 p-0 rounded-full hover:bg-slate-700">✏️</Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                     <Badge className={u.role === 'owner' ? 'bg-slate-700' : u.role === 'council' ? 'bg-amber-900/40 text-amber-200 border-amber-800' : 'bg-rose-900/40 text-rose-200 border-rose-800'}>
                                        {ROLES.find(r => r.id === u.role)?.label}
                                    </Badge>
                                    {isDeleted && <Badge variant="destructive">Banni</Badge>}
                                </div>

                                {/* Admin Actions */}
                                {(me.role === 'admin' || me.role === 'council') && !isMe && (
                                    <div className="pt-3 border-t border-slate-700/50 flex gap-2">
                                        {!isDeleted ? (
                                             <Button size="sm" variant="destructive" className="w-full h-8 text-xs opacity-80 hover:opacity-100" onClick={() => onBan(u.email)}>🚫 Bannir</Button>
                                        ) : (
                                             me.role === 'admin' && <Button size="sm" className="w-full h-8 text-xs bg-emerald-600 border-none text-white" onClick={() => onRestore(u.email)}>♻️ Rétablir</Button>
                                        )}
                                    </div>
                                )}
                                
                                {/* Work History */}
                                <div className="pt-3 border-t border-slate-700/50">
                                    <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Derniers travaux</div>
                                    {history.length === 0 ? (
                                        <p className="text-xs text-slate-600 italic">Aucun historique.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {history.slice(0, 3).map(t => (
                                                <li key={t.id} className="text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
                                                    <div className="flex justify-between text-slate-300 mb-1">
                                                        <span className="truncate pr-2">{t.title}</span>
                                                        <span className="font-mono text-emerald-400 font-bold">+{t.awardedAmount}€</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-600">{new Date(t.completionAt!).toLocaleDateString()}</span>
                                                        {/* Ratings */}
                                                        {t.ratings && t.ratings.length > 0 && (
                                                            <div className="flex gap-0.5">
                                                                {Array(Math.round(t.ratings.reduce((a,b)=>a+b.stars,0)/t.ratings.length)).fill(0).map((_,i)=><span key={i} className="text-[8px]">⭐</span>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Comments display */}
                                                    {t.ratings && t.ratings.length > 0 && t.ratings.map((r, idx) => (
                                                        r.comment && (
                                                            <div key={idx} className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-500 italic flex justify-between group">
                                                                <span className="truncate">"{r.comment}"</span>
                                                                {(me.role === 'admin' || me.role === 'council') && (
                                                                    <button onClick={() => onDeleteRating(t.id, idx)} className="text-rose-500 opacity-0 group-hover:opacity-100 px-1">×</button>
                                                                )}
                                                            </div>
                                                        )
                                                    ))}
                                                </li>
                                            ))}
                                            {history.length > 3 && <li className="text-[10px] text-center text-slate-600">et {history.length - 3} autres...</li>}
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
                    <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                        <CardHeader><CardTitle>Modifier le profil</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Prénom</Label>
                                <Input value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nom</Label>
                                <Input value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                            </div>
                            {(me.role === 'admin' || me.role === 'council') && (
                                <div className="space-y-1.5">
                                    <Label>Rôle</Label>
                                    <Select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </Select>
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
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

// --- NEW PAGE: CREATE TASK ---
function CreateTaskPage({ me, onSubmit, onCancel }: { me: User, onSubmit: (t: Partial<Task>) => void, onCancel: () => void }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<TaskCategory | "">("");
    const [scope, setScope] = useState<TaskScope | "">("");
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [details, setDetails] = useState("");
    const [startingPrice, setStartingPrice] = useState("");
    const [warranty, setWarranty] = useState("0");
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    const [showPreview, setShowPreview] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePreview = () => {
        if (!title.trim() || !location || !startingPrice || !category || !scope) {
            alert("Merci de remplir tous les champs obligatoires (Titre, Catégorie, Type, Emplacement, Prix).");
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
        onSubmit({ title, category: category as TaskCategory, scope: scope as TaskScope, location, details, startingPrice: Number(startingPrice), warrantyDays: Number(warranty), photo });
    };

    const taskData = { title, category: category as TaskCategory, scope: scope as TaskScope, location, details, startingPrice: Number(startingPrice), warrantyDays: Number(warranty), photo };

    return (
        <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6 flex items-center justify-between">
                 <h2 className="text-3xl font-black text-white tracking-tight">✨ Nouvelle Tâche</h2>
                 <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white">Annuler</Button>
            </div>

            <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-8">
                    
                    {/* 1. BASIC INFO */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-base text-white">Titre de la demande <span className="text-rose-500">*</span></Label>
                            <Input 
                                placeholder="Ex: Remplacer ampoule Hall A, Évacuer carton..." 
                                value={title} onChange={(e) => setTitle(e.target.value)} 
                                className="h-12 text-lg bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:ring-indigo-500"
                            />
                        </div>
                        
                        {/* CATEGORY & SCOPE moved here */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base text-white">Catégorie <span className="text-rose-500">*</span></Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {CATEGORIES.map(c => (
                                        <div 
                                            key={c.id}
                                            onClick={() => setCategory(c.id as TaskCategory)}
                                            className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center text-center gap-1 transition-all ${category === c.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            <div className="scale-110">{React.cloneElement(c.icon, { className: "h-5 w-5" })}</div>
                                            <span className="text-[10px] font-medium">{c.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-base text-white">Concerne <span className="text-rose-500">*</span></Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {SCOPES.map(s => (
                                        <div 
                                            key={s.id}
                                            onClick={() => setScope(s.id as TaskScope)}
                                            className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center text-center gap-1 transition-all ${scope === s.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            <span className="text-xl">{s.id === 'copro' ? '🏢' : '🏠'}</span>
                                            <span className="text-[10px] font-bold">{s.id === 'copro' ? 'Parties Communes' : 'Privatif'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base text-white">Emplacement <span className="text-rose-500">*</span></Label>
                                <Select value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 bg-slate-800 border-slate-700 text-white">
                                    {LOCATIONS.map(l => <option key={l} value={l}>📍 {l}</option>)}
                                </Select>
                            </div>
                            
                            {/* PRICE */}
                            <div className="space-y-2">
                                 <Label className="text-base text-white">Prix de départ (€) <span className="text-rose-500">*</span></Label>
                                 <div className="relative">
                                    <Input 
                                        type="number" 
                                        placeholder="15" 
                                        className="pl-10 h-12 text-lg font-mono font-bold bg-white text-slate-900"
                                        value={startingPrice} 
                                        onChange={(e) => setStartingPrice(e.target.value)} 
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-bold">€</span>
                                </div>
                                <p className="text-xs text-slate-500">Max: {MAX_TASK_PRICE}€</p>
                            </div>
                        </div>
                    </div>

                    {/* WARRANTY */}
                    <div className="space-y-2 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                        <Label className="text-base text-white">Garantie souhaitée</Label>
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 h-10">
                            {[
                                { val: "0", label: "Sans" },
                                { val: "30", label: "1 mois" },
                                { val: "180", label: "6 mois" },
                                { val: "365", label: "1 an" }
                            ].map((opt) => (
                                <button
                                    key={opt.val}
                                    onClick={() => setWarranty(opt.val)}
                                    className={`flex-1 rounded-md text-xs font-bold transition-all ${
                                        warranty === opt.val ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. DETAILS & PHOTO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-base text-white">Détails supplémentaires</Label>
                            <Textarea 
                                placeholder="Décrivez précisément ce qu'il y a à faire..." 
                                value={details} onChange={(e) => setDetails(e.target.value)} 
                                className="h-32 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 resize-none" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-base text-white">Photo</Label>
                            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${photo ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600'}`}>
                                {photo ? (
                                    <div className="relative w-full h-full group">
                                        <img src={photo} alt="Preview" className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-40 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-bold">Changer</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="text-3xl mb-2">📷</span>
                                        <p className="text-sm text-slate-400"><span className="font-semibold">Cliquez pour ajouter</span></p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                         <Button className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-900/20" onClick={handlePreview}>
                            Prévisualiser la tâche
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showPreview && (
                <TaskPreviewModal task={taskData} onConfirm={confirmSubmit} onCancel={() => setShowPreview(false)} />
            )}
        </div>
    );
}

// --- Main Dashboard Component ---

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [view, setView] = useState<'home' | 'create-task' | 'directory' | 'ledger'>('home');
  
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

  // Email Notification
  const notify = async (recipients: string[], subject: string, message: string) => {
      addToast("Notification", `Email envoyé pour : ${subject}`, "info");
      try {
          await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  to: recipients,
                  subject: `[CoproSmart] ${subject}`,
                  html: `<div style="font-family: sans-serif;"><h2 style="color: #4f46e5;">CoproSmart Notification</h2><p>${message}</p></div>`
              })
          });
      } catch (e) { console.error(e); }
  };
  
  const getEmailsByRole = (roles: UserRole[]) => directoryUsers.filter(u => roles.includes(u.role)).map(u => u.email);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const t = await fakeApi.readTasks();
      setTasks(t);
      const l = await fakeApi.readLedger();
      setLedger(l);
      if (user.role === 'admin' || user.role === 'council') {
          setPendingUsers(await fakeApi.getPendingUsers());
      }
      
      // Get ALL users for mapping names (even admin or deleted)
      const allUsers = await fakeApi.getAllUsers();
      const mapping: Record<string, string> = {};
      allUsers.forEach(u => { mapping[u.email] = `${u.firstName} ${u.lastName.toUpperCase()}`; });
      setUsersMap(mapping);

      // Get Directory users for the list (filtered)
      const dir = await fakeApi.getDirectory();
      setDirectoryUsers(dir);
    } catch (e) { console.error(e); }
  }, [user.role]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Auto Award
  useEffect(() => {
      const interval = setInterval(() => {
          let changed = false;
          const newTasks = tasks.map(t => {
              if (t.status === 'open' && t.biddingStartedAt && t.bids.length > 0) {
                  const endTime = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000;
                  if (new Date().getTime() > endTime) {
                      const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                      notify([lowestBid.by], "Félicitations ! Tâche attribuée", `Vous avez remporté la tâche "${t.title}" pour ${lowestBid.amount}€.`);
                      notify(getEmailsByRole(['council', 'admin']), "Attribution automatique", `La tâche "${t.title}" a été attribuée à ${lowestBid.by}.`);
                      changed = true;
                      return { ...t, status: 'awarded', awardedTo: lowestBid.by, awardedAmount: lowestBid.amount } as Task;
                  }
              }
              return t;
          });
          if (changed) { setTasks(newTasks); fakeApi.writeTasks(newTasks); }
      }, 5000); 
      return () => clearInterval(interval);
  }, [tasks]);

  // Handlers
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
      status: 'pending',
      createdBy: user.email,
      createdAt: new Date().toISOString(),
      bids: [],
      ratings: [],
      approvals: [],
      rejections: [],
      photo: taskData.photo
    };
    if (user.role === 'council' || user.role === 'admin') {
        newTask.approvals.push({ by: user.email, at: new Date().toISOString() });
    }
    const newTasks = [newTask, ...tasks];
    setTasks(newTasks);
    await fakeApi.writeTasks(newTasks);
    addToast("Succès", "Tâche créée et soumise.", "success");
    setView('home'); // Return home
  };

  const handleApprove = async (taskId: string) => {
      const newTasks = tasks.map(t => {
          if (t.id === taskId) {
              const alreadyApproved = t.approvals.some(a => a.by === user.email);
              const forceValidate = user.role === 'admin';
              const newApprovals = alreadyApproved ? t.approvals : [...t.approvals, { by: user.email, at: new Date().toISOString() }];
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
              if (!updatedTask.biddingStartedAt) updatedTask.biddingStartedAt = new Date().toISOString();
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
               return { ...t, status: 'awarded' } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);
  };

  const handleComplete = async (taskId: string) => {
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
              return { ...t, status: 'completed', completionAt: new Date().toISOString(), validatedBy: user.email } as Task;
          }
          return t;
      });
      setTasks(newTasks);
      await fakeApi.writeTasks(newTasks);

      const newEntry: LedgerEntry = { taskId, type, payer, payee, amount, at: new Date().toISOString(), taskTitle: taskTitle, taskCreator: taskCreator };
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
      await fakeApi.deleteRating(taskId, ratingIndex, user.email);
      loadData();
      addToast("Supprimé", "Le commentaire a été supprimé et archivé.", "info");
  }

  const handleDelete = async (taskId: string) => {
      if (user.role !== 'admin') return;
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

  const handleApproveUser = async (email: string) => { await fakeApi.approveUser(email); setPendingUsers(prev => prev.filter(u => u.email !== email)); notify([email], "Compte validé", "Bienvenue sur CoproSmart !"); loadData(); };
  const handleRejectUser = async (email: string) => { await fakeApi.rejectUser(email); setPendingUsers(prev => prev.filter(u => u.email !== email)); loadData(); };
  const handleBanUser = async (email: string) => { if (confirm(`Bannir ${email} ?`)) { await fakeApi.updateUserStatus(email, 'deleted'); loadData(); } }
  const handleRestoreUser = async (email: string) => { await fakeApi.updateUserStatus(email, 'active'); loadData(); }
  const handleUpdateUser = async (email: string, data: any) => { await fakeApi.updateUser(email, data); loadData(); }

  // --- View Logic ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-18 md:h-20 flex items-center justify-between">
             <button onClick={() => setView('home')} className="flex flex-col items-start focus:outline-none group mr-6">
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white group-hover:text-indigo-400 transition-colors">
                    CoproSmart
                </h1>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest hidden sm:block">Simple. Local. Gagnant-gagnant.</span>
            </button>
            
            {/* Create Task Button - Moved to Right of Logo */}
            {view !== 'create-task' && (
                <Button onClick={() => setView('create-task')} className="ml-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20 rounded-full px-4 sm:px-6 py-2">
                    + <span className="hidden sm:inline">Nouvelle Tâche</span>
                </Button>
            )}
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-end mr-8">
                <button onClick={() => setView('home')} className={`text-sm font-bold transition-colors ${view === 'home' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Accueil</button>
                <button onClick={() => setView('directory')} className={`text-sm font-bold transition-colors ${view === 'directory' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Annuaire</button>
                {(user.role === 'admin' || user.role === 'council') && (
                    <button onClick={() => setView('ledger')} className={`text-sm font-bold transition-colors ${view === 'ledger' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Écritures</button>
                )}
            </nav>

            <div className="flex items-center gap-4">
                <div className="text-right hidden lg:block border-l border-slate-800 pl-4 ml-2">
                    <div className="text-sm font-bold text-white">{user.firstName} {user.lastName.toUpperCase()}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={onLogout} title="Déconnexion" className="text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-full w-10 h-10 p-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                </Button>
            </div>
        </div>
      </header>

      {/* --- Mobile Navigation Bar --- */}
       <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around py-3 z-50 pb-safe">
           <button onClick={() => setView('home')} className={`flex flex-col items-center ${view === 'home' ? 'text-indigo-400' : 'text-slate-500'}`}>
               <span className="text-2xl">🏠</span><span className="text-[9px] font-bold mt-1">Accueil</span>
           </button>
           <button onClick={() => setView('create-task')} className={`flex flex-col items-center ${view === 'create-task' ? 'text-indigo-400' : 'text-slate-500'}`}>
               <div className="bg-indigo-600 text-white rounded-full w-10 h-10 flex items-center justify-center -mt-4 shadow-lg border-4 border-slate-900 text-xl">+</div>
           </button>
           <button onClick={() => setView('directory')} className={`flex flex-col items-center ${view === 'directory' ? 'text-indigo-400' : 'text-slate-500'}`}>
               <span className="text-2xl">👥</span><span className="text-[9px] font-bold mt-1">Annuaire</span>
           </button>
            {(user.role === 'admin' || user.role === 'council') && (
                 <button onClick={() => setView('ledger')} className={`flex flex-col items-center ${view === 'ledger' ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <span className="text-2xl">📒</span><span className="text-[9px] font-bold mt-1">Compta</span>
                </button>
            )}
       </div>


      <main className="flex-grow max-w-6xl mx-auto w-full p-4 pb-24 md:pb-12 space-y-8">
        
        {/* USER VALIDATION (Global) */}
        {(user.role === 'council' || user.role === 'admin') && pendingUsers.length > 0 && (
            <UserValidationQueue pendingUsers={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />
        )}

        {view === 'create-task' && (
            <CreateTaskPage me={user} onSubmit={handleCreateTask} onCancel={() => setView('home')} />
        )}

        {view === 'directory' && (
            <UserDirectory users={directoryUsers} tasks={tasks} me={user} onBan={handleBanUser} onRestore={handleRestoreUser} onUpdateUser={handleUpdateUser} onDeleteRating={handleDeleteRating} />
        )}

        {view === 'ledger' && (
            <Ledger entries={ledger} usersMap={usersMap} onDelete={handleDeleteLedgerEntry} isAdmin={user.role === 'admin'} />
        )}

        {view === 'home' && (
            <div className="space-y-10 animate-in fade-in duration-500 pt-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12 space-y-12">
                        
                        {/* PENDING VALIDATION */}
                        {tasks.some(t => t.status === 'pending') && (
                            <Section title="⏳ En attente de validation">
                                <div className="grid grid-cols-1 gap-3">
                                {tasks.filter(t => t.status === 'pending').map(t => {
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
                                </div>
                            </Section>
                        )}

                        {/* OPEN OFFERS */}
                        <Section title="🔥 Offres ouvertes">
                             {tasks.filter(t => t.status === 'open').length === 0 ? (
                                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center">
                                    <p className="text-slate-500 italic">Tout va bien dans la copro, rien à signaler ! 🏖️</p>
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {tasks.filter(t => t.status === 'open').map(t => (
                                        <TaskCard 
                                            key={t.id} task={t} me={user} usersMap={usersMap}
                                            onBid={(bid) => handleBid(t.id, bid)} 
                                            onAward={() => handleAward(t.id)} 
                                            onComplete={() => {}} 
                                            onRate={() => {}} onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                            canDelete={user.role === 'admin'}
                                        />
                                    ))}
                                </div>
                             )}
                        </Section>

                        {/* WORKS IN PROGRESS */}
                        <Section title="🏗️ Travaux en cours">
                            {tasks.filter(t => t.status === 'awarded' || t.status === 'verification').length === 0 ? (
                                <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-8 text-center">
                                    <p className="text-slate-500 italic">Les artisans se reposent... ou tout est déjà réparé ! 🛠️</p>
                                </div>
                             ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {tasks.filter(t => t.status === 'awarded' || t.status === 'verification').map(t => (
                                        <TaskCard 
                                            key={t.id} task={t} me={user} usersMap={usersMap}
                                            onBid={() => {}} onAward={() => {}} 
                                            onComplete={() => handleComplete(t.id)} 
                                            onRate={() => {}} onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                            canDelete={user.role === 'admin'}
                                            onRequestVerification={() => handleRequestVerification(t.id)}
                                            onRejectWork={() => handleRejectWork(t.id)}
                                        />
                                    ))}
                                </div>
                             )}
                        </Section>

                         {/* COMPLETED HISTORY - GHOST MODE */}
                        <Section title="✅ Historique terminé">
                            {tasks.filter(t => t.status === 'completed').length === 0 ? (
                                <p className="text-slate-500 italic pl-2">Aucun historique pour le moment.</p>
                            ) : (
                                <div className="flex flex-col border-t border-slate-800">
                                    {tasks.filter(t => t.status === 'completed').sort((a,b) => new Date(b.completionAt!).getTime() - new Date(a.completionAt!).getTime()).map(t => (
                                        <TaskCard 
                                            key={t.id} task={t} me={user} usersMap={usersMap}
                                            onBid={() => {}} onAward={() => {}} onComplete={() => {}} 
                                            onRate={(r) => handleRate(t.id, r)} 
                                            onDeleteRating={handleDeleteRating}
                                            onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                            canDelete={user.role === 'admin'}
                                            variant="ghost"
                                        />
                                    ))}
                                </div>
                            )}
                        </Section>
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 mt-auto">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
              <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <span className="text-2xl">🏢</span>
                  <span className="font-black text-xl tracking-tight text-white">CoproSmart</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
                CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes. Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit sur ses charges.
              </p>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Simple. Local. Gagnant-gagnant.</p>
              <div className="text-xs text-slate-700 pt-4 border-t border-slate-900 w-24 mx-auto mt-8">
                  v0.1.0
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden pt-10 overflow-y-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px]"></div>
             <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-rose-900/10 blur-[100px]"></div>
        </div>

        <div className="w-full max-w-lg z-10 mb-10 text-center mx-auto space-y-4">
            <h1 className="text-7xl font-black tracking-tighter text-white leading-none drop-shadow-2xl">CoproSmart</h1>
            <h2 className="text-2xl font-bold tracking-tight text-white/90">On réduit vos charges de copropriété.</h2>
        </div>
        
        <div className="w-full max-w-md z-10 mx-auto shadow-2xl shadow-indigo-900/20 rounded-2xl">
             <LoginCard onLogin={setUser} />
        </div>
        
        <div className="mt-12 text-center text-sm text-slate-400 z-10 max-w-4xl mx-auto leading-relaxed font-medium opacity-80">
            CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes : une ampoule à changer, une porte à régler, des encombrants à évacuer… Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit supplémentaire sur ses propres charges. Simple, local, gagnant-gagnant.
        </div>
      </div>
    );
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
