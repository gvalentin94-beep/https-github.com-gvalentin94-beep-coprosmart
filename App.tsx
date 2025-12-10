
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, UserRole, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE, AVATARS, RESIDENCES } from './constants';
import { LoginCard } from './components/LoginCard';

// --- Safe Version Access ---
const APP_VERSION = (() => {
    try {
        return (import.meta as any)?.env?.PACKAGE_VERSION || '0.2.33';
    } catch {
        return '0.2.33';
    }
})();

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

// --- Helper Components ---

function EmptyState({ icon, message }: { icon: string, message: string }) {
    return (
        <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center bg-slate-900/20">
            <div className="text-2xl mb-2 opacity-50 grayscale">{icon}</div>
            <p className="text-slate-500 text-sm font-medium">{message}</p>
        </div>
    );
}

function TaskPreviewModal({ task, onConfirm, onCancel }: { task: Partial<Task>; onConfirm: () => void; onCancel: () => void }) {
    const catInfo = CATEGORIES.find((c: any) => c.id === task.category);
    const scopeInfo = SCOPES.find((s: any) => s.id === task.scope);

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
                        
                         {/* REORDERED: Category & Scope right below Title */}
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Catégorie</span> <div className="font-medium text-white">{catInfo?.label}</div></div>
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Concerne</span> <div className="font-medium text-white flex items-center gap-2">{scopeInfo?.label}</div></div>
                        
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Prix départ</span> <div className="font-mono text-xl text-indigo-400 font-bold">{task.startingPrice} €</div></div>
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Emplacement</span> <div className="font-medium text-white">{task.location}</div></div>
                        <div><span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Garantie</span> <div className="font-medium text-white">{task.warrantyDays} jours</div></div>
                    </div>
                    
                    {task.photo && (
                        <div>
                            <span className="text-slate-500 uppercase text-xs font-bold tracking-wider block mb-2">Photo</span>
                            <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                                <img src={task.photo} alt="Aperçu" className="h-auto max-h-64 w-auto max-w-full object-contain mx-auto" />
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

function CreateTaskModal({ 
    isOpen, 
    onClose, 
    title, setTitle,
    category, setCategory,
    scope, setScope,
    location, setLocation,
    details, setDetails,
    price, setPrice,
    warranty, setWarranty,
    onPhotoUpload,
    onSubmit
}: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-lg bg-slate-900 border-indigo-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="bg-indigo-900/20 border-b border-indigo-500/20 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-indigo-100">✨ Nouvelle demande</CardTitle>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                        <Label>Titre court</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ampoule hall entrée" maxLength={40} autoFocus />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
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

                    <div className="space-y-1.5">
                        <Label>Emplacement</Label>
                        <Select value={location} onChange={(e) => setLocation(e.target.value)}>
                            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Détails</Label>
                        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Décrivez le problème..." />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <Label>Prix départ (€)</Label>
                            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} max={MAX_TASK_PRICE} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Garantie souhaitée</Label>
                            <Select value={warranty} onChange={(e) => setWarranty(e.target.value)}>
                                {WARRANTY_OPTIONS.map(w => <option key={w.val} value={w.val}>{w.label}</option>)}
                            </Select>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label>Photo (optionnel)</Label>
                        <Input type="file" accept="image/*" onChange={onPhotoUpload} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-500" />
                    </div>

                    <Button className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold" onClick={onSubmit}>
                        Vérifier et Publier
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function RejectReasonModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (reason: string) => void }) {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-slate-900 border-rose-900/50 shadow-2xl">
                <CardHeader className="bg-rose-900/10 border-b border-rose-900/20">
                     <CardTitle className="text-rose-100">Refus de validation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <p className="text-sm text-slate-300">Veuillez indiquer pourquoi vous refusez la validation du travail. Ce motif sera visible par l'intervenant.</p>
                    <Textarea 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        placeholder="Ex: La porte grince encore, il manque une couche de peinture..."
                        className="min-h-[100px]"
                        autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={onClose}>Annuler</Button>
                        <Button 
                            disabled={!reason.trim()} 
                            className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
                            onClick={() => {
                                onSubmit(reason);
                                setReason(""); // Clear after submit
                            }}
                        >
                            Confirmer le refus
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function UserValidationQueue({ pendingUsers, onApprove, onReject }: { pendingUsers: RegisteredUser[], onApprove: (email: string) => void, onReject: (email: string) => void }) {
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAction = async (email: string, action: 'approve' | 'reject') => {
        setProcessing(email);
        try {
            if (action === 'approve') await onApprove(email);
            else await onReject(email);
        } catch (e: any) {
            alert(e.message || "Erreur");
        } finally {
            setProcessing(null);
        }
    };

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
                    {pendingUsers.map((u: RegisteredUser) => (
                        <div key={u.email} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-amber-900/30 gap-3">
                            <div>
                                <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-slate-400">{u.email} • <span className="text-amber-200">{ROLES.find((r: any) => r.id === u.role)?.label}</span></div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button size="sm" disabled={processing === u.email} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 border-none text-white" onClick={() => handleAction(u.email, 'approve')}>
                                    {processing === u.email ? '...' : 'Accepter'}
                                </Button>
                                <Button size="sm" disabled={processing === u.email} variant="destructive" className="flex-1 sm:flex-none" onClick={() => handleAction(u.email, 'reject')}>
                                     {processing === u.email ? '...' : 'Refuser'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function Ledger({ entries, usersMap, onDelete, isAdmin }: { entries: LedgerEntry[], usersMap: Record<string, string>, onDelete: (id: string) => void, isAdmin: boolean }) {
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
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
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
                            <button onClick={() => e.id && onDelete(e.id)} className="text-slate-600 hover:text-rose-500 transition-colors p-2" title="Supprimer">🗑️</button>
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

function UserDirectory({ users, tasks, me, onBan, onRestore, onUpdateUser, onDeleteRating, onInviteUser, onDeleteUser }: { 
    users: RegisteredUser[], 
    tasks: Task[], 
    me: User, 
    onBan: (email: string) => void, 
    onRestore: (email: string) => void,
    onUpdateUser: (email: string, data: any) => void,
    onDeleteRating: (taskId: string, ratingIdx: number) => void,
    onInviteUser: (email: string) => void,
    onDeleteUser: (email: string) => void
}) {
    const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
    const [expandedUser, setExpandedUser] = useState<string | null>(null); // New state for accordion

    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editRole, setEditRole] = useState<UserRole>("owner");
    const [newPassword, setNewPassword] = useState("");
    const [editAvatar, setEditAvatar] = useState("");
    
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    const handleEditClick = (u: RegisteredUser) => {
        setEditingUser(u);
        setEditFirstName(u.firstName || "");
        setEditLastName(u.lastName || "");
        setEditEmail(u.email || "");
        setEditRole(u.role);
        setEditAvatar(u.avatar || "");
        setNewPassword("");
    };

    const handleSaveUser = () => {
        if (editingUser) {
            const updates: any = {
                email: editEmail,
                firstName: editFirstName,
                lastName: editLastName,
                avatar: editAvatar
            };
            
            // Role Update: ONLY Admin can update role
            if (me.role === 'admin') {
                updates.role = editRole;
            }

            // Only current user can update password (security)
            if (newPassword.trim() && editingUser.id === me.id) {
                updates.password = newPassword.trim();
            }
            
            onUpdateUser(editingUser.email, updates);
            setEditingUser(null);
        }
    };

    const handleInviteUserSubmit = () => {
        if (inviteEmail) {
            onInviteUser(inviteEmail);
            setIsInviting(false);
            setInviteEmail("");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white tracking-tight">👥 Annuaire</h2>
                <div className="flex items-center gap-3">
                     <Badge className="bg-slate-800 text-slate-400 border-slate-700">{users.length} membres</Badge>
                     {(me.role === 'admin' || me.role === 'council') && (
                         <Button size="sm" onClick={() => setIsInviting(true)}>✉️ Inviter un résident</Button>
                     )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u: RegisteredUser) => {
                    const isMe = u.email === me.email;
                    
                    // --- PERMISSIONS LOGIC ---
                    let canEdit = false;
                    let canBan = false;
                    
                    if (me.role === 'admin') {
                        canEdit = true; // Admin can edit everyone
                        if (!isMe) canBan = true; // Admin can ban everyone except self
                    } else if (me.role === 'council') {
                        // CS can edit: Self ONLY (changed from Self AND Owners)
                        if (isMe) canEdit = true;
                        // CS can ban: Owners only.
                        if (u.role === 'owner') canBan = true;
                    } else if (me.role === 'owner') {
                        // Owner can edit: Self only
                        if (isMe) canEdit = true;
                    }

                    const isDeleted = u.status === 'deleted';
                    const history = tasks.filter(t => t.status === 'completed' && t.awardedTo === u.email);
                    // Calculate Average Rating
                    const allRatings = history.flatMap(t => t.ratings);
                    const avgRating = allRatings.length > 0 
                        ? (allRatings.reduce((acc, r) => acc + r.stars, 0) / allRatings.length).toFixed(1)
                        : null;
                    
                    return (
                        <Card key={u.email} className={`border-slate-700 bg-slate-800/50 hover:border-slate-600 transition-all ${isDeleted ? 'opacity-50 grayscale' : ''} relative overflow-hidden`}>
                            <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl border border-indigo-500/30 shadow-inner overflow-hidden">
                                            {u.avatar || AVATARS[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-white leading-tight min-h-[1.5rem]">{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-slate-400">{u.email}</div>
                                            {avgRating && <div className="text-xs font-bold text-amber-400 mt-0.5">⭐ {avgRating}/5</div>}
                                        </div>
                                    </div>
                                    {canEdit && !isDeleted && (
                                        <Button size="sm" variant="ghost" onClick={() => handleEditClick(u)} className="h-8 w-8 p-0 rounded-full hover:bg-slate-700">✏️</Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                     {u.role === 'council' ? (
                                         <div className="flex gap-2">
                                             <Badge className="bg-amber-500 text-slate-900 border-amber-400 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]">Conseil Syndical</Badge>
                                             <Badge className="bg-slate-700">Copropriétaire</Badge>
                                         </div>
                                     ) : (
                                         <Badge className={u.role === 'owner' ? 'bg-slate-700' : 'bg-rose-900/40 text-rose-200 border-rose-800'}>
                                            {ROLES.find((r: any) => r.id === u.role)?.label}
                                        </Badge>
                                     )}
                                     
                                    {isDeleted && <Badge variant="destructive">Banni</Badge>}
                                </div>
                                

                                {/* Ban & Delete Actions */}
                                {canBan && (
                                    <div className="pt-3 border-t border-slate-700/50 flex gap-2">
                                        {!isDeleted ? (
                                             <>
                                                <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs opacity-80 hover:opacity-100" onClick={() => onBan(u.email)}>🚫 Bannir</Button>
                                                {me.role === 'admin' && (
                                                    <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-rose-900 text-rose-500 hover:bg-rose-900/20 hover:text-rose-400" onClick={() => onDeleteUser(u.email)}>🗑️ Supprimer</Button>
                                                )}
                                             </>
                                        ) : (
                                             <>
                                                {me.role === 'admin' && (
                                                    <>
                                                        <Button size="sm" className="flex-1 h-8 text-xs bg-emerald-600 border-none text-white" onClick={() => onRestore(u.email)}>♻️ Rétablir</Button>
                                                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-rose-900 text-rose-500 hover:bg-rose-900/20 hover:text-rose-400" onClick={() => onDeleteUser(u.email)}>🗑️ Supprimer</Button>
                                                    </>
                                                )}
                                             </>
                                        )}
                                    </div>
                                )}
                                
                                {/* Work History (Accordion) */}
                                {history.length > 0 && (
                                    <div className="pt-3 border-t border-slate-700/50">
                                        <button 
                                            onClick={() => setExpandedUser(expandedUser === u.email ? null : u.email)}
                                            className="w-full text-xs text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-2 py-1"
                                        >
                                            {expandedUser === u.email ? 'Masquer les détails' : 'Voir l\'historique détaillé'}
                                            <span>{expandedUser === u.email ? '▲' : '▼'}</span>
                                        </button>
                                        
                                        {expandedUser === u.email && (
                                            <ul className="space-y-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                {history.map(t => (
                                                    <li key={t.id} className="text-xs bg-slate-900/50 p-2 rounded border border-slate-800">
                                                        <div className="flex justify-between text-slate-300 mb-1">
                                                            <span className="truncate pr-2 font-medium">{t.title}</span>
                                                            <span className="font-mono text-emerald-400 font-bold">+{t.awardedAmount}€</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-600">{new Date(t.completionAt!).toLocaleDateString()}</span>
                                                            {/* Ratings */}
                                                            {t.ratings && t.ratings.length > 0 && (
                                                                <div className="flex gap-0.5 items-center bg-slate-950/50 px-1.5 py-0.5 rounded">
                                                                    <span className="text-amber-400 font-bold mr-1">{t.ratings[0].stars}</span>
                                                                    {Array(t.ratings[0].stars).fill(0).map((_,i)=><span key={i} className="text-[8px]">⭐</span>)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
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
                                <Label>Avatar</Label>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {AVATARS.map((av: any) => (
                                        <button 
                                            key={av}
                                            onClick={() => setEditAvatar(av)}
                                            className={`text-2xl p-2 rounded-full border transition-all ${editAvatar === av ? 'bg-indigo-500/30 border-indigo-400 scale-110' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                                        >
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Prénom</Label>
                                <Input 
                                    value={editFirstName} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFirstName(e.target.value)}
                                    // Owners can enable edit for self
                                    disabled={false} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nom</Label>
                                <Input 
                                    value={editLastName} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditLastName(e.target.value)}
                                    // Owners can enable edit for self
                                    disabled={false}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email de contact</Label>
                                <Input 
                                    value={editEmail} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditEmail(e.target.value)} 
                                />
                            </div>
                            
                            {/* Password Change: Only visible if editing own profile */}
                            {editingUser.id === me.id && (
                                <div className="space-y-1.5 bg-slate-800/50 p-3 rounded border border-slate-700">
                                    <Label>Nouveau mot de passe (optionnel)</Label>
                                    <Input 
                                        type="password"
                                        placeholder="Laisser vide pour ne pas changer"
                                        value={newPassword} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} 
                                    />
                                </div>
                            )}

                            {/* Role: ONLY ADMIN can change role */}
                            {me.role === 'admin' && (
                                <div className="space-y-1.5">
                                    <Label>Rôle</Label>
                                    <Select 
                                        value={editRole} 
                                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                                    >
                                        {ROLES.map((r: any) => <option key={r.id} value={r.id}>{r.label}</option>)}
                                    </Select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 bg-indigo-600" onClick={handleSaveUser}>Enregistrer</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>Annuler</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Invite Modal */}
            {isInviting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                        <CardHeader><CardTitle>Inviter un résident</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-400">Un email sera envoyé avec les instructions pour rejoindre la copropriété.</p>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input 
                                    type="email" 
                                    value={inviteEmail} 
                                    onChange={(e) => setInviteEmail(e.target.value)} 
                                    placeholder="voisin@exemple.com"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 bg-indigo-600" onClick={handleInviteUserSubmit}>Envoyer l'invitation</Button>
                                <Button variant="outline" className="flex-1" onClick={() => setIsInviting(false)}>Annuler</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
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
  
  // Multi-residency State
  // Default to Watteau to ensure legacy data visibility on load
  const [selectedResidence, setSelectedResidence] = useState<string | null>("Résidence Watteau");
  
  // UI State
  const [tab, setTab] = useState<'dashboard' | 'directory' | 'ledger'>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [taskToReject, setTaskToReject] = useState<Task | null>(null);
  
  // Create Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>("ampoule");
  const [newTaskScope, setNewTaskScope] = useState<TaskScope>("copro");
  const [newTaskLocation, setNewTaskLocation] = useState(LOCATIONS[0]);
  const [newTaskDetails, setNewTaskDetails] = useState("");
  const [newTaskPrice, setNewTaskPrice] = useState("20");
  const [newTaskWarranty, setNewTaskWarranty] = useState("0");
  const [newTaskPhoto, setNewTaskPhoto] = useState<string | null>(null);

  const [previewTask, setPreviewTask] = useState<Partial<Task> | null>(null);

  // Derived State
  const usersMap = useMemo(() => {
    return users.reduce((acc, u) => ({ ...acc, [u.email]: `${u.firstName} ${u.lastName}` }), {} as Record<string, string>);
  }, [users]);

  const notify = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
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
        console.error(e);
    } finally {
        setLoading(false);
    }
  }, [user, selectedResidence]);

  // Handle Residence Selection Logic
  useEffect(() => {
    if (user) {
        // Only force set if user has a specific residence locked in profile
        // and it's different from current (e.g. user logs in as TEST, switch from Watteau)
        if (user.role !== 'admin' && user.residence && user.residence !== selectedResidence) {
            setSelectedResidence(user.residence);
        } else if (selectedResidence) {
            refreshData();
        }
    }
  }, [user, refreshData, selectedResidence]);

  // --- Actions ---

  const handleCreateTask = async () => {
    if (!user || !selectedResidence) return;
    try {
        const newTaskId = await api.createTask({
            title: newTaskTitle,
            category: newTaskCategory,
            scope: newTaskScope,
            location: newTaskLocation,
            details: newTaskDetails,
            startingPrice: Number(newTaskPrice),
            warrantyDays: Number(newTaskWarranty),
            status: 'pending',
            photo: newTaskPhoto || undefined
        }, user.id, selectedResidence);
        
        notify("Demande créée", "En attente de validation par le Conseil Syndical.", "success");
        
        // AUTO-APPROVE if Council Member
        if (user.role === 'council' || user.role === 'admin') {
            try {
                await api.addApproval(newTaskId, user.id);
                // Immediately refresh to show it's approved
                // If it was the 2nd approval, status might flip to open in backend? 
                // Currently only handleApproveTask checks threshold, 
                // but since it's just creation, likely just 1 approval.
                notify("Auto-validation", "Votre vote a été comptabilisé automatiquement.", "info");
            } catch (voteErr) {
                console.warn("Auto-vote failed", voteErr);
            }
        }

        setPreviewTask(null);
        setShowCreateModal(false);
        // Reset form
        setNewTaskTitle(""); setNewTaskDetails(""); setNewTaskPrice("20"); setNewTaskPhoto(null);
        
        // Force refresh to show the new approval state
        await refreshData();
        setTab('dashboard');
    } catch (e) {
        notify("Erreur", "Impossible de créer la demande.", "error");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setNewTaskPhoto(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleApproveTask = async (task: Task) => {
      if (!user || !selectedResidence) return;
      try {
          // Admin bypass
          if (user.role === 'admin') {
              await api.updateTaskStatus(task.id, 'open');
              notify("Validé", "La demande est ouverte aux offres (Admin).", "success");
              refreshData();
              return;
          }

          // Council Vote Logic
          await api.addApproval(task.id, user.id);
          // Check if we reached threshold (optimistic check, ideally backend handles this)
          // We reload data to check count
          const updatedTasks = await api.readTasks(selectedResidence);
          const updatedTask = updatedTasks.find(t => t.id === task.id);
          
          if (updatedTask && updatedTask.approvals.length >= COUNCIL_MIN_APPROVALS) {
               await api.updateTaskStatus(task.id, 'open');
               notify("Validé", "La demande est maintenant ouverte aux offres !", "success");
          } else {
               notify("Voté", "Votre validation a été enregistrée.", "success");
          }
          refreshData();
      } catch (e) {
          notify("Erreur", "Impossible de valider.", "error");
      }
  };

  const handleRejectTask = async (task: Task) => {
      if (!user) return;
      try {
           await api.addRejection(task.id, user.id);
           await api.updateTaskStatus(task.id, 'rejected');
           notify("Rejeté", "La demande a été refusée.", "info");
           refreshData();
      } catch (e) {
           notify("Erreur", "Impossible de rejeter.", "error");
      }
  };

  const handleBid = async (task: Task, bid: Omit<Bid, 'by' | 'at'>) => {
    if (!user) return;
    try {
        const isFirstBid = (!task.bids || task.bids.length === 0);
        await api.addBid(task.id, bid, user.id);

        if (isFirstBid) {
            // Start the 24h countdown on first bid
            await api.updateTaskStatus(task.id, 'open', { biddingStartedAt: new Date().toISOString() });
        }

        notify("Offre envoyée", `Votre offre de ${bid.amount}€ a été enregistrée.`, "success");
        refreshData();
    } catch (e) {
        notify("Erreur", "Impossible d'envoyer l'offre.", "error");
    }
  };

  const handleAward = async (task: Task) => {
      if (!user) return;
      if (!task.bids || task.bids.length === 0) return;
      
      const winningBid = task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]);
      
      try {
          await api.updateTaskStatus(task.id, 'awarded', { 
              awardedTo: winningBid.userId, 
              awardedAmount: winningBid.amount 
          });
          
          // Notify Winner
          try {
             await api.inviteUser(winningBid.by, "CoproSmart (Notification)"); 
          } catch (err) {
             console.warn("Notification failed (non-fatal)", err);
          }
          
          notify("Attribué !", `Mission confiée à ${usersMap[winningBid.by] || winningBid.by} pour ${winningBid.amount}€.`, "success");
          refreshData();
      } catch (e) {
          console.error(e);
          notify("Erreur", "Attribution échouée.", "error");
      }
  };
  
  const handleRequestVerification = async (task: Task) => {
      try {
          await api.updateTaskStatus(task.id, 'verification');
          notify("Envoyé", "Le Conseil Syndical va vérifier les travaux.", "success");
          refreshData();
      } catch (e) { notify("Erreur", "Action impossible", "error"); }
  };

  const handleRejectWork = (task: Task) => {
      setTaskToReject(task);
      setRejectModalOpen(true);
  };

  const submitRejectWork = async (reason: string) => {
      if (!taskToReject) return;
      try {
          // Append reason to details
          const timestamp = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          const newDetails = (taskToReject.details || "") + `\n\n[⛔ REFUS DE VALIDATION le ${timestamp}]\nMotif : ${reason}\n\n`;
          
          await api.updateTaskDetails(taskToReject.id, newDetails);
          await api.updateTaskStatus(taskToReject.id, 'awarded'); // Revert to awarded status
          
          // Notify worker
          if (taskToReject.awardedTo) {
             try {
                 const subject = `❌ Refus de validation - ${taskToReject.title}`;
                 const html = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #e11d48;">Contrôle Qualité : Refusé</h2>
                        <p>Bonjour,</p>
                        <p>La validation des travaux pour <strong>${taskToReject.title}</strong> a été refusée pour le motif suivant :</p>
                        <blockquote style="background:#fff0f0; padding:15px; border-left:4px solid #e11d48; color:#555; font-style: italic;">
                            ${reason}
                        </blockquote>
                        <p>Le statut de la tâche est repassé en "Attribuée". Merci de corriger le problème indiqué, puis de demander une nouvelle validation une fois les travaux terminés.</p>
                        <p>L'équipe CoproSmart</p>
                    </div>
                 `;
                 await api.sendNotification(taskToReject.awardedTo, subject, html);
             } catch (e) {
                 console.warn("Could not send rejection email", e);
                 notify("Info", "Email de notification non envoyé (Erreur serveur).", "error");
             }
          }

          notify("Refusé", "Le motif a été ajouté et le statut mis à jour.", "info");
          setRejectModalOpen(false);
          setTaskToReject(null);
          refreshData();
      } catch (e) {
          notify("Erreur", "Impossible d'enregistrer le refus.", "error");
      }
  };

  const handleComplete = async (task: Task) => {
      if (!user || !selectedResidence) return;
      try {
          // --- ROBUST ID LOOKUP ---
          // 1. Payee (Worker)
          let payeeId = task.awardedToId;
          // Try to find via bids (common fallback)
          if (!payeeId && task.awardedTo) {
             const winningBid = task.bids?.find(b => b.by === task.awardedTo);
             payeeId = winningBid?.userId;
          }
          // Try to find via user directory (Last Resort)
          if (!payeeId && task.awardedTo) {
              const u = users.find(u => u.email === task.awardedTo);
              payeeId = u?.id;
          }

          if (!payeeId) {
             throw new Error(`Impossible d'identifier l'intervenant (${task.awardedTo}). Le compte a peut-être été supprimé.`);
          }

          // 2. Payer (Creator) - Needed only for apartment scope
          let payerId = task.createdById;
           if (!payerId && task.scope === 'apartment' && task.createdBy) {
              const u = users.find(u => u.email === task.createdBy);
              payerId = u?.id;
          }
          
          if (task.scope === 'apartment' && !payerId) {
               throw new Error(`Impossible d'identifier le demandeur (${task.createdBy}).`);
          }

          if (!task.awardedAmount) {
              throw new Error("Montant de la prestation introuvable.");
          }

          // FIX: Pass user.id (UUID) instead of user.email for validatedBy column
          await api.updateTaskStatus(task.id, 'completed', { validatedBy: user.id });
          
          // GENERATE LEDGER ENTRIES
          if (task.scope === 'copro') {
              // 1. Credit the worker (Charge Credit)
              await api.createLedgerEntry({
                  taskId: task.id,
                  type: 'charge_credit',
                  payerId: null, // System/Copro
                  payeeId: payeeId,
                  amount: task.awardedAmount
              }, selectedResidence);
          } else {
              // 1. Private: Payer is Creator, Payee is Worker
               await api.createLedgerEntry({
                  taskId: task.id,
                  type: 'apartment_payment',
                  payerId: payerId,
                  payeeId: payeeId,
                  amount: task.awardedAmount
              }, selectedResidence);
          }
          
          // Send Success Email to Worker
          try {
             const subject = `✅ Travaux validés - ${task.title}`;
             const html = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #10b981;">Félicitations !</h2>
                    <p>Les travaux pour <strong>${task.title}</strong> ont été validés.</p>
                    <p>Un montant de <strong>${task.awardedAmount}€</strong> a été crédité sur votre compte CoproSmart.</p>
                    <p>Merci pour votre contribution !</p>
                </div>
             `;
             await api.sendNotification(task.awardedTo!, subject, html);
          } catch(e) { console.warn("Email validation fail", e); }

          notify("Terminé !", "Travaux validés et écritures comptables générées.", "success");
          refreshData();
      } catch (e: any) {
          console.error(e);
          notify("Erreur Validation", e.message || "Echec de la validation.", "error");
      }
  };

  const handleRate = async (task: Task, rating: Omit<Rating, 'at' | 'byHash'>) => {
      if (!user) return;
      try {
          await api.addRating(task.id, rating, user.id);
          notify("Merci", "Votre avis a été enregistré.", "success");
          refreshData();
      } catch (e) { notify("Erreur", "Impossible de noter.", "error"); }
  };

  const handleDeleteRating = async (taskId: string, idx: number) => {
      if (!user) return;
      if (confirm("Supprimer cet avis ?")) {
          await api.deleteRating(taskId, idx, user.id);
          refreshData();
      }
  };

  const handleDeleteTask = async (task: Task) => {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
          try {
              await api.deleteTask(task.id);
              notify("Supprimé", "La demande a été effacée.", "info");
              refreshData();
          } catch (e) { notify("Erreur", "Suppression impossible.", "error"); }
      }
  };

  const handleApproveUser = async (email: string) => {
      try {
          await api.approveUser(email);
          notify("Utilisateur validé", `${email} a rejoint la copropriété.`, "success");
          refreshData();
      } catch (e: any) { notify("Erreur", e.message, "error"); }
  };

  const handleRejectUser = async (email: string) => {
      if(confirm(`Rejeter l'inscription de ${email} ?`)) {
        try {
            await api.rejectUser(email);
            notify("Utilisateur rejeté", `${email} a été refusé.`, "info");
            refreshData();
        } catch (e: any) { notify("Erreur", e.message, "error"); }
      }
  };
  
  const handleBanUser = async (email: string) => {
      if (confirm(`Bannir ${email} ? Il ne pourra plus se connecter.`)) {
          try {
              await api.updateUserStatus(email, 'rejected'); // or 'deleted' but rejected keeps record
              notify("Banni", "L'accès a été révoqué.", "info");
              refreshData();
          } catch (e: any) { notify("Erreur", e.message, "error"); }
      }
  };

  const handleRestoreUser = async (email: string) => {
      try {
          await api.updateUserStatus(email, 'active');
          notify("Rétabli", "L'accès a été restauré.", "success");
          refreshData();
      } catch (e: any) { notify("Erreur", e.message, "error"); }
  };
  
  const handlePermanentlyDeleteUser = async (email: string) => {
      if(confirm(`SUPPRIMER DÉFINITIVEMENT ${email} ? Cette action est irréversible.`)) {
          try {
              await api.deleteUserProfile(email);
              notify("Supprimé", "Compte supprimé définitivement.", "info");
              refreshData();
          } catch (e: any) { notify("Erreur", e.message, "error"); }
      }
  };
  
  const handleInviteUser = async (email: string) => {
        try {
            await api.inviteUser(email, `${user!.firstName} ${user!.lastName}`);
            notify("Invitation envoyée", `Un email a été envoyé à ${email}`, "success");
        } catch (e: any) {
            console.error(e);
            let msg = e.message || "Erreur inconnue";
            if (msg.toLowerCase().includes("api key")) {
                msg = "Clé API invalide. Vérifiez la configuration Vercel (RESEND_API_KEY).";
            }
            notify("Erreur d'envoi", msg, "error");
        }
  };

  const handleUpdateUser = async (email: string, updates: any) => {
      try {
          await api.updateUser(email, updates);
          notify("Profil mis à jour", "Les modifications ont été enregistrées.", "success");
          refreshData();
          // If we updated ourselves, refresh auth context potentially? 
          // For now, page refresh might be needed for deep changes, but name/avatar updates reflects in 'users' list.
      } catch (e: any) { notify("Erreur", e.message, "error"); }
  };
  
  const handleDeleteLedgerEntry = async (id: string) => {
      if (confirm("Supprimer cette écriture comptable ?")) {
          try {
              await api.deleteLedgerEntry(id);
              refreshData();
          } catch (e) { notify("Erreur", "Impossible de supprimer.", "error"); }
      }
  };

  if (authLoading) return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-indigo-500">Chargement...</div>;

  if (!user) {
      return (
          <>
            <LoginCard onLogin={setUser} />
            <div className="fixed bottom-2 right-2 text-[10px] text-slate-700 font-mono">v{APP_VERSION}</div>
          </>
      );
  }

  // --- CATEGORY FILTERING ---
  const tasksPending = tasks.filter(t => t.status === 'pending');
  const tasksAwaitingBids = tasks.filter(t => t.status === 'open' && (!t.bids || t.bids.length === 0));
  const tasksBiddingInProgress = tasks.filter(t => t.status === 'open' && t.bids && t.bids.length > 0);
  const tasksAssigned = tasks.filter(t => ['awarded', 'verification'].includes(t.status));
  const tasksCompleted = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 md:pb-0 font-sans selection:bg-indigo-500/30">
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* LEFT GROUP: Logo + Actions + Nav */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter text-white">CoproSmart<span className="text-indigo-500">.</span></h1>
            
            {user.role === 'admin' && selectedResidence && (
                 <Select 
                    value={selectedResidence} 
                    onChange={(e) => { setSelectedResidence(e.target.value); }}
                    className="hidden md:block !w-auto !py-1 !pl-2 !pr-8 text-xs !bg-indigo-900/30 !border-indigo-500/30 text-indigo-300 rounded hover:bg-indigo-900/50 transition-colors"
                >
                    {RESIDENCES.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            )}
            
            {loading && <span className="animate-spin text-indigo-500">⟳</span>}

             {/* NEW REQUEST BUTTON - NOW ON LEFT */}
             <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20" onClick={() => setShowCreateModal(true)}>
                + Nouvelle demande
             </Button>

            {/* DESKTOP NAV - INLINE */}
            <div className="hidden md:flex items-center gap-6 ml-2 border-l border-slate-700 pl-6 h-8">
                 <button onClick={() => setTab('dashboard')} className={`text-sm font-bold transition-colors ${tab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Accueil</button>
                 <button onClick={() => setTab('directory')} className={`text-sm font-bold transition-colors ${tab === 'directory' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Annuaire</button>
                 <button onClick={() => setTab('ledger')} className={`text-sm font-bold transition-colors ${tab === 'ledger' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Journal</button>
            </div>
          </div>
          
          {/* RIGHT GROUP: Profile */}
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block leading-tight">
                 <div className="text-sm font-bold text-white">{user.firstName} {user.lastName}</div>
                 <div className="flex justify-end gap-1 mt-0.5">
                     {user.role === 'council' ? (
                         <>
                             <Badge className="bg-amber-500 text-slate-900 border-none text-[9px] py-0">Conseil Syndical</Badge>
                             <Badge className="bg-slate-700 text-slate-300 border-none text-[9px] py-0">Copropriétaire</Badge>
                         </>
                     ) : (
                         <Badge className="bg-slate-700 text-slate-300 border-none text-[10px] py-0">{ROLES.find((r: any) => r.id === user.role)?.label}</Badge>
                     )}
                 </div>
             </div>
             <Button size="sm" variant="ghost" onClick={() => { api.logout(); setUser(null); }} className="text-slate-400 hover:text-white">
                Déconnexion
             </Button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 z-50 flex justify-around p-2 pb-safe">
        <button onClick={() => setTab('dashboard')} className={`flex flex-col items-center p-2 text-xs ${tab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
            <span className="text-lg">🏠</span> Accueil
        </button>
        <button onClick={() => setTab('directory')} className={`flex flex-col items-center p-2 text-xs ${tab === 'directory' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
            <span className="text-lg">👥</span> Annuaire
        </button>
        <button onClick={() => setTab('ledger')} className={`flex flex-col items-center p-2 text-xs ${tab === 'ledger' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
            <span className="text-lg">📒</span> Journal
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500">
        
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
            <div className="space-y-8">
                <div className="flex flex-col gap-4">
                     <h2 className="text-xl font-bold text-white">👋 Bonjour {user.firstName}</h2>
                </div>

                {(user.role === 'council' || user.role === 'admin') && (
                     <UserValidationQueue pendingUsers={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />
                )}

                {/* --- TOP: BIDDING IN PROGRESS (Only shows if active) --- */}
                {tasksBiddingInProgress.length > 0 && (
                    <Section title={`🔥 Enchères en cours (${tasksBiddingInProgress.length})`}>
                        {tasksBiddingInProgress.map(t => (
                            <TaskCard 
                                key={t.id} task={t} me={user} usersMap={usersMap}
                                onBid={(b) => handleBid(t, b)}
                                onAward={() => handleAward(t)}
                                onComplete={() => {}} onRate={() => {}}
                                onDelete={() => handleDeleteTask(t)}
                                canDelete={user.role === 'admin'}
                            />
                        ))}
                    </Section>
                )}

                {/* --- GRID: ALL WORKFLOW COLUMNS (Always Visible) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    
                    {/* --- 1. PENDING VALIDATION (CS) --- */}
                    <Section title={`1️⃣ En attente de validation (${tasksPending.length})`}>
                        {tasksPending.length > 0 ? (
                            tasksPending.map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={user} usersMap={usersMap}
                                    onBid={() => {}} onAward={() => {}} onComplete={() => {}} onRate={() => {}}
                                    onDelete={() => handleDeleteTask(t)}
                                    canDelete={user.role === 'admin' || t.createdBy === user.email}
                                    onApprove={() => handleApproveTask(t)}
                                    onReject={() => handleRejectTask(t)}
                                />
                            ))
                        ) : (
                            <EmptyState icon="⏳" message="Toutes les demandes ont été traitées." />
                        )}
                    </Section>

                    {/* --- 2. AWAITING BIDS (Valid, 0 offers) --- */}
                    <Section title={`2️⃣ Recherche d'intervenant (${tasksAwaitingBids.length})`}>
                        {tasksAwaitingBids.length > 0 ? (
                            tasksAwaitingBids.map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={user} usersMap={usersMap}
                                    onBid={(b) => handleBid(t, b)} onAward={() => {}} onComplete={() => {}} onRate={() => {}}
                                    onDelete={() => handleDeleteTask(t)}
                                    canDelete={user.role === 'admin' || (t.createdBy === user.email)}
                                />
                            ))
                        ) : (
                            <EmptyState icon="📢" message="Aucune demande en recherche d'offre." />
                        )}
                    </Section>

                    {/* --- 3. ASSIGNED / IN PROGRESS --- */}
                    <Section title={`3️⃣ Travaux en cours (${tasksAssigned.length})`}>
                         {tasksAssigned.length > 0 ? (
                             tasksAssigned.map(t => (
                                <TaskCard 
                                    key={t.id} task={t} me={user} usersMap={usersMap}
                                    onBid={() => {}} onAward={() => {}}
                                    onComplete={() => handleComplete(t)}
                                    onRate={() => {}}
                                    onDelete={() => handleDeleteTask(t)}
                                    canDelete={user.role === 'admin'}
                                    onRequestVerification={() => handleRequestVerification(t)}
                                    onRejectWork={() => handleRejectWork(t)}
                                />
                             ))
                         ) : (
                            <EmptyState icon="🔨" message="Aucun chantier en cours." />
                         )}
                    </Section>
                    
                    {/* --- 4. COMPLETED --- */}
                    <Section title={`4️⃣ Terminé (${tasksCompleted.length})`}>
                        {tasksCompleted.length > 0 ? (
                            tasksCompleted.map(t => (
                                    <TaskCard 
                                    key={t.id} task={t} me={user} usersMap={usersMap}
                                    onBid={() => {}} onAward={() => {}} onComplete={() => {}}
                                    onRate={(r) => handleRate(t, r)}
                                    onDeleteRating={handleDeleteRating}
                                    onDelete={() => handleDeleteTask(t)}
                                    canDelete={user.role === 'admin'} 
                                    />
                            ))
                        ) : (
                            <EmptyState icon="✅" message="Aucun historique terminé." />
                        )}
                    </Section>
                </div>
            </div>
        )}

        {/* DIRECTORY TAB */}
        {tab === 'directory' && (
            <UserDirectory 
                users={users} 
                tasks={tasks} 
                me={user} 
                onBan={handleBanUser} 
                onRestore={handleRestoreUser}
                onUpdateUser={handleUpdateUser}
                onDeleteRating={handleDeleteRating}
                onInviteUser={handleInviteUser}
                onDeleteUser={handlePermanentlyDeleteUser}
            />
        )}

        {/* LEDGER TAB */}
        {tab === 'ledger' && (
            <Ledger 
                entries={ledger} 
                usersMap={usersMap} 
                onDelete={handleDeleteLedgerEntry} 
                isAdmin={user.role === 'admin'} 
            />
        )}

      </main>

      {/* FOOTER */}
      <footer className="mt-20 py-8 text-center text-slate-600 text-xs border-t border-slate-900 bg-slate-950">
        <div className="flex justify-center gap-6 mb-4">
             <a href="#" className="hover:text-slate-400 transition-colors">Conditions Générales d'Utilisation</a>
             <a href="#" className="hover:text-slate-400 transition-colors">Mentions Légales</a>
        </div>
        <div className="flex items-center justify-center gap-2">
            <span>CoproSmart v{APP_VERSION} — Simple. Local. Gagnant-Gagnant.</span>
            {(import.meta as any).env?.VITE_SUPABASE_URL && <span className="ml-2 text-[10px] text-emerald-800 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/50">☁️ Sauvegardé</span>}
        </div>
      </footer>

      {/* PREVIEW MODAL */}
      {previewTask && (
          <TaskPreviewModal 
              task={previewTask} 
              onConfirm={handleCreateTask} 
              onCancel={() => setPreviewTask(null)} 
          />
      )}
      
      {/* REJECT MODAL */}
      <RejectReasonModal 
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={submitRejectWork}
      />

      {/* CREATE TASK MODAL */}
      <CreateTaskModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={newTaskTitle} setTitle={setNewTaskTitle}
        category={newTaskCategory} setCategory={setNewTaskCategory}
        scope={newTaskScope} setScope={setNewTaskScope}
        location={newTaskLocation} setLocation={setNewTaskLocation}
        details={newTaskDetails} setDetails={setNewTaskDetails}
        price={newTaskPrice} setPrice={setNewTaskPrice}
        warranty={newTaskWarranty} setWarranty={setNewTaskWarranty}
        onPhotoUpload={handlePhotoUpload}
        onSubmit={() => {
            setPreviewTask({
                title: newTaskTitle,
                category: newTaskCategory,
                scope: newTaskScope,
                location: newTaskLocation,
                details: newTaskDetails,
                startingPrice: Number(newTaskPrice),
                warrantyDays: Number(newTaskWarranty),
                photo: newTaskPhoto || undefined
            });
            setShowCreateModal(false);
        }}
      />
    </div>
  );
}
