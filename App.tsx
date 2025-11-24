import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, UserRole, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge, Section } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, MAX_TASK_PRICE, AVATARS } from './constants';
import { LoginCard } from './components/LoginCard';

// --- Constants for Random Messages ---
const OPEN_EMPTY_MESSAGES = [
    "Tout va bien dans la copro, rien à signaler ! 🏖️",
    "Calme plat. Profitez-en pour arroser les plantes ! 🌿",
    "Pas une seule ampoule grillée à l'horizon. Quel miracle ! 💡",
    "C'est louche... tout fonctionne parfaitement aujourd'hui. 🤔",
    "Le Conseil Syndical est au chômage technique (pour le moment). 😎",
    "Rien à faire ? C'est le moment de dire bonjour à vos voisins ! 👋",
    "Aucune mission pour nos super-héros du quotidien. 🦸‍♂️"
];

const PROGRESS_EMPTY_MESSAGES = [
    "Les artisans se reposent... ou tout est déjà réparé ! 🛠️",
    "Silence radio sur le chantier. 🤫",
    "Ça bosse dur (ou ça prend le café). ☕",
    "Les outils sont rangés, les travaux sont finis ? 🧰",
    "Aucun bruit de perceuse... profitez du silence ! 🎵",
    "Tout est calme. Trop calme. 🕵️‍♂️"
];

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

function SharedFooter() {
    return null; // Not used anymore, we use specific footer for login
}

function InfoModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto shadow-2xl">
                <CardHeader className="border-b border-slate-800 flex flex-row justify-between items-center sticky top-0 bg-slate-900 z-10">
                    <CardTitle>{title}</CardTitle>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl font-bold">✕</button>
                </CardHeader>
                <CardContent className="p-6 text-sm text-slate-300 space-y-4 leading-relaxed">
                    {children}
                </CardContent>
                <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 text-right">
                    <Button onClick={onClose}>Fermer</Button>
                </div>
            </Card>
        </div>
    );
}

function TaskPreviewModal({ task, onConfirm, onCancel }: { task: Partial<Task>; onConfirm: () => void; onCancel: () => void }) {
    const catInfo = CATEGORIES.find(c => c.id === task.category);
    const scopeInfo = SCOPES.find(s => s.id === task.scope);

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
                    {pendingUsers.map(u => (
                        <div key={u.email} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-amber-900/30 gap-3">
                            <div>
                                <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                                <div className="text-xs text-slate-400">{u.email} • <span className="text-amber-200">{ROLES.find(r => r.id === u.role)?.label}</span></div>
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

function UserDirectory({ users, tasks, me, onBan, onRestore, onUpdateUser, onDeleteRating, onAddUser, onDeleteUser }: { 
    users: RegisteredUser[], 
    tasks: Task[], 
    me: User, 
    onBan: (email: string) => void, 
    onRestore: (email: string) => void,
    onUpdateUser: (email: string, data: any) => void,
    onDeleteRating: (taskId: string, ratingIdx: number) => void,
    onAddUser: (user: { firstName: string, lastName: string, email: string, role: UserRole }) => void,
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
    
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', role: 'owner' as UserRole });

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

    const handleAddUserSubmit = () => {
        onAddUser(newUser);
        setIsAdding(false);
        setNewUser({ firstName: '', lastName: '', email: '', role: 'owner' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-white tracking-tight">👥 Annuaire</h2>
                <div className="flex items-center gap-3">
                     <Badge className="bg-slate-800 text-slate-400 border-slate-700">{users.length} membres</Badge>
                     {(me.role === 'admin' || me.role === 'council') && (
                         <Button size="sm" onClick={() => setIsAdding(true)}>+ Ajouter un résident</Button>
                     )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(u => {
                    const isMe = u.email === me.email;
                    
                    // --- PERMISSIONS LOGIC ---
                    let canEdit = false;
                    let canBan = false;
                    
                    if (me.role === 'admin') {
                        canEdit = true; // Admin can edit everyone
                        if (!isMe) canBan = true; // Admin can ban everyone except self
                    } else if (me.role === 'council') {
                        // CS can edit: Self AND Owners. Cannot edit other CS or Admin.
                        if (isMe || u.role === 'owner') canEdit = true;
                        // CS can ban: Owners only.
                        if (u.role === 'owner') canBan = true;
                    } else if (me.role === 'owner') {
                        // Owner can edit: Self only
                        if (isMe) canEdit = true;
                    }

                    const isDeleted = u.status === 'deleted';
                    const history = tasks.filter(t => t.status === 'completed' && t.awardedTo === u.email);
                    const totalTasks = history.length;
                    
                    // Calculate Average Rating
                    const allRatings = history.flatMap(t => t.ratings);
                    const avgRating = allRatings.length > 0 
                        ? (allRatings.reduce((acc, r) => acc + r.stars, 0) / allRatings.length).toFixed(1)
                        : null;
                    
                    return (
                        <Card key={u.email} className={`border-slate-700 bg-slate-800/50 hover:border-slate-600 transition-all ${isDeleted ? 'opacity-50 grayscale' : ''} relative overflow-hidden`}>
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl border border-indigo-500/30 shadow-inner">
                                            {u.avatar || AVATARS[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg text-white leading-tight min-h-[1.5rem]">{u.firstName} {u.lastName}</div>
                                            <div className="text-xs text-slate-400">{u.email}</div>
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
                                            {ROLES.find(r => r.id === u.role)?.label}
                                        </Badge>
                                     )}
                                     
                                    {isDeleted && <Badge variant="destructive">Banni</Badge>}
                                </div>
                                
                                {/* SUMMARY STATS */}
                                <div className="flex justify-between items-center bg-slate-900/30 p-2 rounded-lg border border-slate-700/50">
                                    <div className="text-center flex-1 border-r border-slate-700/50">
                                        <div className="text-lg font-bold text-amber-400">{avgRating ? avgRating : '-'} <span className="text-xs text-slate-500 font-normal">/5</span></div>
                                        <div className="text-[9px] text-slate-500 uppercase">Moyenne</div>
                                    </div>
                                    <div className="text-center flex-1">
                                        <div className="text-lg font-bold text-white">{totalTasks}</div>
                                        <div className="text-[9px] text-slate-500 uppercase">Travaux</div>
                                    </div>
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
                                    {AVATARS.map(av => (
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
                                    onChange={e => setEditFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nom</Label>
                                <Input 
                                    value={editLastName} 
                                    onChange={e => setEditLastName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email de contact</Label>
                                <Input 
                                    value={editEmail} 
                                    onChange={e => setEditEmail(e.target.value)} 
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
                                        onChange={e => setNewPassword(e.target.value)} 
                                    />
                                </div>
                            )}

                            {/* Role: ONLY ADMIN can change role */}
                            {me.role === 'admin' && (
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

            {/* Add User Modal */}
             {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                        <CardHeader><CardTitle>Ajouter un résident</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-1.5">
                                <Label>Prénom</Label>
                                <Input value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Nom</Label>
                                <Input value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Rôle</Label>
                                <Select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                    {ROLES.filter(r => r.id !== 'admin').map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                </Select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="ghost" onClick={() => setIsAdding(false)}>Annuler</Button>
                                <Button onClick={handleAddUserSubmit}>Ajouter</Button>
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
            alert("Merci de remplir tous les champs obligatoires (Titre, Catégorie, Concerne, Emplacement, Prix).");
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
                                className="h-12 text-lg !bg-white !text-slate-900" 
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
                                            className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center text-center gap-1 transition-all ${category === c.id ? `${c.colorClass} border-2 ring-2 ring-offset-2 ring-offset-slate-900` : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
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
                                            className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center text-center gap-1 transition-all ${scope === s.id ? `${s.colorClass} border-2 ring-2 ring-offset-2 ring-offset-slate-900` : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                        >
                                            <div className="scale-110">{React.cloneElement(s.icon, { className: "h-5 w-5" })}</div>
                                            <span className="text-[10px] font-bold">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-base text-white">Emplacement <span className="text-rose-500">*</span></Label>
                                <Select value={location} onChange={(e) => setLocation(e.target.value)} className="h-12 !bg-white !text-slate-900">
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
                                        className="pl-10 h-12 text-lg font-mono font-bold !bg-white !text-slate-900"
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
                        <div className="grid grid-cols-4 gap-3">
                            {WARRANTY_OPTIONS.map((opt) => (
                                <div
                                    key={opt.val}
                                    onClick={() => setWarranty(opt.val)}
                                    className={`cursor-pointer rounded-xl border p-2 flex flex-col items-center text-center gap-1 transition-all ${
                                        warranty === opt.val ? `${opt.colorClass} border-2 ring-2 ring-offset-2 ring-offset-slate-900` : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    <div className="scale-110">{React.cloneElement(opt.icon, { className: "h-5 w-5" })}</div>
                                    <span className="text-[10px] font-bold">{opt.label}</span>
                                </div>
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
                                className="h-32 resize-none !bg-white !text-slate-900" 
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
  
  // States for Legal Modals
  const [showCGU, setShowCGU] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  // Password Recovery State
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");

  const addToast = (title: string, message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Generate Random Messages
  const randomOpenMessage = useMemo(() => OPEN_EMPTY_MESSAGES[Math.floor(Math.random() * OPEN_EMPTY_MESSAGES.length)], [view]);
  const randomProgressMessage = useMemo(() => PROGRESS_EMPTY_MESSAGES[Math.floor(Math.random() * PROGRESS_EMPTY_MESSAGES.length)], [view]);

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
      const t = await api.readTasks();
      setTasks(t);
      const l = await api.readLedger();
      setLedger(l);
      if (user.role === 'admin' || user.role === 'council') {
          setPendingUsers(await api.getPendingUsers());
      }
      
      // Get ALL users for mapping names
      const allUsers = await api.getAllUsers();
      const mapping: Record<string, string> = {};
      allUsers.forEach(u => { mapping[u.email] = `${u.firstName} ${u.lastName.toUpperCase()}`; });
      setUsersMap(mapping);

      // Get Directory users for the list
      const dir = await api.getDirectory();
      setDirectoryUsers(dir);
    } catch (e) { console.error(e); }
  }, [user.role]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Listen for Password Recovery event
  useEffect(() => {
      const { data: { subscription } } = api.onPasswordRecovery(() => {
          setShowPasswordRecovery(true);
      });
      return () => subscription.unsubscribe();
  }, []);

  const handlePasswordRecoverySubmit = async () => {
      try {
          await api.updateUser(user.email, { password: recoveryPassword });
          addToast("Succès", "Mot de passe mis à jour avec succès.", "success");
          setShowPasswordRecovery(false);
          setRecoveryPassword("");
      } catch (e: any) {
          addToast("Erreur", e.message || "Erreur lors de la mise à jour", "error");
      }
  };

  // Auto Award (Runs locally on one client - race condition acceptable for now or moved to edge function later)
  useEffect(() => {
      const interval = setInterval(() => {
          tasks.forEach(async t => {
              if (t.status === 'open' && t.biddingStartedAt && t.bids.length > 0) {
                  const endTime = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000;
                  if (new Date().getTime() > endTime) {
                      const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                      // Call API to update status
                      await api.updateTaskStatus(t.id, 'awarded', { awardedTo: lowestBid.userId, awardedAmount: lowestBid.amount });
                      notify([lowestBid.by], "Félicitations ! Tâche attribuée", `Vous avez remporté la tâche "${t.title}" pour ${lowestBid.amount}€.`);
                      notify(getEmailsByRole(['council', 'admin']), "Attribution automatique", `La tâche "${t.title}" a été attribuée à ${lowestBid.by}.`);
                      loadData();
                  }
              }
          });
      }, 10000); 
      return () => clearInterval(interval);
  }, [tasks, loadData]);

  // Handlers
  const handleCreateTask = async (taskData: Partial<Task>) => {
    
    const taskId = await api.createTask({
        ...taskData,
        status: 'pending' // Always pending initially
    }, user.id);
    
    // If user is council or admin, add self-approval immediately
    if (user.role === 'council' || user.role === 'admin') {
         await api.addApproval(taskId, user.id);
    }

    addToast("Succès", "Tâche créée et soumise.", "success");
    setView('home');
    loadData();
  };

  const handleApprove = async (taskId: string) => {
      await api.addApproval(taskId, user.id);
      
      // Check if we should open the task
      // Optimistically check local state or refetch. 
      // Let's refetch single task or just loadData.
      // To be faster, we can check current task state + 1.
      const t = tasks.find(x => x.id === taskId);
      if (t) {
         const approvals = t.approvals.length + 1;
         if (approvals >= COUNCIL_MIN_APPROVALS || user.role === 'admin') {
             // Open it
             await api.updateTaskStatus(taskId, 'open', { biddingStartedAt: t.biddingStartedAt }); // Keep existing or null
             notify(getEmailsByRole(['owner', 'council', 'admin']), "Nouvelle offre disponible", `La tâche "${t.title}" est ouverte aux offres !`);
         }
      }
      loadData();
  };

  const handleReject = async (taskId: string) => {
      await api.addRejection(taskId, user.id);
      await api.updateTaskStatus(taskId, 'rejected');
      loadData();
  };

  const handleBid = async (taskId: string, bidData: Omit<Bid, 'by' | 'at'>) => {
      await api.addBid(taskId, bidData, user.id);
      // Update biddingStartedAt if first bid
      const t = tasks.find(x => x.id === taskId);
      if (t && !t.biddingStartedAt) {
          await api.updateTaskStatus(taskId, 'open', { biddingStartedAt: new Date().toISOString() });
      }
      notify(getEmailsByRole(['owner', 'council', 'admin']), "Nouvelle enchère", `Nouvelle offre de ${bidData.amount}€ sur "${t?.title}".`);
      addToast("Offre enregistrée", "Votre positionnement a été pris en compte.", "success");
      loadData();
  };

  const handleAward = async (taskId: string) => {
      const t = tasks.find(x => x.id === taskId);
      if (t && t.bids.length > 0) {
          const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
          await api.updateTaskStatus(taskId, 'awarded', { awardedTo: lowestBid.userId, awardedAmount: lowestBid.amount });
          notify([lowestBid.by], "Tâche attribuée", `Félicitations, vous avez remporté la tâche "${t.title}".`);
          loadData();
      }
  };

  const handleRequestVerification = async (taskId: string) => {
      await api.updateTaskStatus(taskId, 'verification');
      const t = tasks.find(x => x.id === taskId);
      if (t) notify(getEmailsByRole(['council', 'admin']), "Vérification demandée", `Le copropriétaire a terminé "${t.title}". Merci de vérifier.`);
      loadData();
  };

  const handleRejectWork = async (taskId: string) => {
      await api.updateTaskStatus(taskId, 'awarded');
      const t = tasks.find(x => x.id === taskId);
      if (t) notify([t.awardedTo!], "Travail refusé", `Le CS a refusé votre travail sur "${t.title}". Merci de corriger.`);
      loadData();
  };

  const handleComplete = async (taskId: string) => {
      const t = tasks.find(x => x.id === taskId);
      if (!t) return;

      await api.updateTaskStatus(taskId, 'completed', { validatedBy: user.id });
      
      // Create Ledger Entry
      const entry = {
          taskId,
          type: t.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
          payerId: t.scope === 'copro' ? null : t.createdById, // assuming createdById available in Task from DB mapping
          payeeId: t.awardedToId, 
          amount: t.awardedAmount
      };
      await api.createLedgerEntry(entry);

      notify([t.awardedTo!], "Paiement validé", `Votre travail sur "${t.title}" a été validé. ${t.awardedAmount}€ crédités.`);
      loadData();
  };

  const handleRate = async (taskId: string, rating: Omit<Rating, 'at' | 'byHash'>) => {
      await api.addRating(taskId, rating, user.id);
      addToast("Merci", "Votre avis a été enregistré.", "success");
      loadData();
  };

  const handleDeleteRating = async (taskId: string, ratingIndex: number) => {
      await api.deleteRating(taskId, ratingIndex, user.id);
      loadData();
      addToast("Supprimé", "Le commentaire a été supprimé et archivé.", "info");
  }

  const handleDelete = async (taskId: string) => {
      if (user.role !== 'admin') return;
      if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
          await api.deleteTask(taskId);
          addToast("Supprimé", "Tâche supprimée.", "info");
          loadData();
      }
  };
  
  const handleDeleteLedgerEntry = async (id: string) => {
      if (user.role !== 'admin') return;
      if (confirm("Supprimer cette écriture comptable ?")) {
          await api.deleteLedgerEntry(id);
          loadData();
      }
  }

  const handleApproveUser = async (email: string) => { await api.approveUser(email); notify([email], "Compte validé", "Bienvenue sur CoproSmart !"); loadData(); };
  const handleRejectUser = async (email: string) => { await api.rejectUser(email); loadData(); };
  const handleBanUser = async (email: string) => { if (confirm(`Bannir ${email} ?`)) { await api.updateUserStatus(email, 'deleted'); loadData(); } }
  const handleRestoreUser = async (email: string) => { await api.updateUserStatus(email, 'active'); loadData(); }
  const handleUpdateUser = async (email: string, data: any) => { await api.updateUser(email, data); loadData(); }
  const handleAddUser = async (userData: any) => { await api.createDirectoryEntry(userData); loadData(); addToast("Succès", "Utilisateur ajouté.", "success"); }
  const handleDeleteUser = async (email: string) => { 
      if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${email} ?\nCette action effacera son profil. Pour libérer l'email, l'admin doit aussi le supprimer dans Supabase Auth.`)) {
          await api.deleteUserProfile(email); 
          loadData(); 
          addToast("Supprimé", "Le profil utilisateur a été supprimé.", "info");
      } 
  }

  // --- View Logic ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 flex flex-col">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/70 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-18 md:h-20 flex items-center justify-between">
             <button onClick={() => setView('home')} className="flex flex-col items-start focus:outline-none group mr-6">
                <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white leading-none">
                    CoproSmart.
                </h1>
                <span className="text-[10px] font-black tracking-tighter text-white mt-0.5 leading-none">
                    On réduit nos charges de copropriété.
                </span>
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
                {(user && (user.role === 'admin' || user.role === 'council')) && (
                    <button onClick={() => setView('ledger')} className={`text-sm font-bold transition-colors ${view === 'ledger' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Écritures</button>
                )}
            </nav>

            <div className="flex flex-col items-end hidden lg:flex border-l border-slate-800 pl-4 ml-2">
                <div className="text-sm font-bold text-white">{user?.firstName} {user?.lastName.toUpperCase()}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
                <Badge className={user.role === 'owner' ? 'bg-slate-800 text-slate-400 border-slate-700 mt-1' : user.role === 'council' ? 'bg-amber-900/40 text-amber-200 border-amber-800 mt-1' : 'bg-rose-900/40 text-rose-200 border-rose-800 mt-1'}>
                    {ROLES.find(r => r.id === user.role)?.label}
                </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} title="Déconnexion" className="ml-4 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-full w-10 h-10 p-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
            </Button>
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
            {(user && (user.role === 'admin' || user.role === 'council')) && (
                 <button onClick={() => setView('ledger')} className={`flex flex-col items-center ${view === 'ledger' ? 'text-indigo-400' : 'text-slate-500'}`}>
                    <span className="text-2xl">📒</span><span className="text-[9px] font-bold mt-1">Compta</span>
                </button>
            )}
       </div>


      <main className="flex-grow max-w-6xl mx-auto w-full p-4 pb-24 md:pb-12 space-y-8">
        
        {/* USER VALIDATION (Global) */}
        {(user && (user.role === 'council' || user.role === 'admin')) && pendingUsers.length > 0 && (
            <UserValidationQueue pendingUsers={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />
        )}

        {view === 'create-task' && user && (
            <CreateTaskPage me={user} onSubmit={handleCreateTask} onCancel={() => setView('home')} />
        )}

        {view === 'directory' && user && (
            <UserDirectory users={directoryUsers} tasks={tasks} me={user} onBan={handleBanUser} onRestore={handleRestoreUser} onUpdateUser={handleUpdateUser} onDeleteRating={handleDeleteRating} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
        )}

        {view === 'ledger' && user && (
            <Ledger entries={ledger} usersMap={usersMap} onDelete={handleDeleteLedgerEntry} isAdmin={user.role === 'admin'} />
        )}

        {view === 'home' && user && (
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
                                    <p className="text-slate-500 italic">{randomOpenMessage}</p>
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
                                    <p className="text-slate-500 italic">{randomProgressMessage}</p>
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

                         {/* COMPLETED HISTORY */}
                        <Section title="✅ Travaux terminés">
                            {tasks.filter(t => t.status === 'completed' || t.status === 'rejected').length === 0 ? (
                                <p className="text-slate-500 italic pl-2">Aucun historique pour le moment.</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {tasks.filter(t => t.status === 'completed' || t.status === 'rejected').sort((a,b) => new Date(b.completionAt || b.createdAt).getTime() - new Date(a.completionAt || a.createdAt).getTime()).map(t => (
                                        <TaskCard 
                                            key={t.id} task={t} me={user} usersMap={usersMap}
                                            onBid={() => {}} onAward={() => {}} onComplete={() => {}} 
                                            onRate={(r) => handleRate(t.id, r)} 
                                            onDeleteRating={handleDeleteRating}
                                            onPayApartment={() => {}} onDelete={() => handleDelete(t.id)}
                                            canDelete={user.role === 'admin'}
                                        />
                                    ))}
                                </div>
                            )}
                        </Section>
                    </div>
                </div>
            </div>
        )}

         {/* PASSWORD RECOVERY MODAL */}
         {showPasswordRecovery && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                    <CardHeader><CardTitle>Nouveau mot de passe</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Nouveau mot de passe</Label>
                            <Input type="password" value={recoveryPassword} onChange={e => setRecoveryPassword(e.target.value)} />
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button onClick={handlePasswordRecoverySubmit}>Mettre à jour</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )}

        {/* CGU Modal */}
        {showCGU && (
          <InfoModal title="Conditions Générales d'Utilisation" onClose={() => setShowCGU(false)}>
              <p>Bienvenue sur CoproSmart.</p>
              <p>En utilisant cette application, vous acceptez les règles suivantes :</p>
              <ul className="list-disc pl-5 space-y-2">
                  <li><b>Initiative locale :</b> CoproSmart est un outil d'entraide pour faciliter la gestion des petites interventions entre copropriétaires.</li>
                  <li><b>Absence de contrat de travail :</b> Les interventions réalisées ne constituent pas une activité salariée ni une prestation commerciale professionnelle, mais une participation collaborative à la vie de l'immeuble.</li>
                  <li><b>Compensation :</b> La rémunération se fait exclusivement par le biais d'un crédit (déduction) sur les charges de copropriété, validé par le Conseil Syndical et le Syndic.</li>
                  <li><b>Responsabilité :</b> Chaque intervenant agit sous sa propre responsabilité. Il s'engage à ne réaliser que des tâches à sa portée et à respecter les règles de sécurité.</li>
                  <li><b>Confidentialité :</b> Les données (noms, offres) sont visibles uniquement par les membres de la copropriété inscrits.</li>
              </ul>
          </InfoModal>
        )}

        {/* Legal Modal */}
        {showLegal && (
          <InfoModal title="Mentions Légales" onClose={() => setShowLegal(false)}>
              <p><b>Éditeur du service :</b></p>
              <p>CoproSmart - Initiative privée de copropriété.</p>
              <p>Résidence Watteau</p>
              <br/>
              <p><b>Hébergement :</b></p>
              <p>Ce site est hébergé par Vercel Inc.</p>
              <p>340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <br/>
              <p><b>Données personnelles :</b></p>
              <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez le Conseil Syndical.</p>
          </InfoModal>
        )}
      </div>
    );
  }

export default function App() {
  const { user, setUser, loading } = useAuth();
  const [showCGU, setShowCGU] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  if (loading) {
     return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Chargement...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden pt-10 overflow-y-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px]"></div>
             <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-rose-900/10 blur-[100px]"></div>
        </div>

        <div className="w-full max-w-3xl z-10 mb-10 text-center mx-auto space-y-2">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white leading-none w-full text-center">
                CoproSmart.
            </h1>
            <p className="text-lg md:text-xl font-black tracking-tighter text-white mt-2 text-center">
                On réduit nos charges de copropriété.
            </p>
        </div>
        
        <div className="w-full max-w-md z-10 mx-auto shadow-2xl shadow-indigo-900/20 rounded-2xl">
             <LoginCard onLogin={setUser} />
        </div>
        
        {/* Login Page Footer */}
        <div className="max-w-4xl mx-auto px-4 text-center space-y-2 mt-12 pb-12">
             <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
                CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes : une ampoule à changer, une porte à régler, des encombrants à évacuer… Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit supplémentaire sur ses propres charges.
                <span className="block mt-2 font-black tracking-tighter lowercase text-slate-400">simple. local. gagnant-gagnant.</span>
            </p>
            <div className="flex justify-center gap-6 text-xs text-slate-600 pt-2">
                  <button onClick={() => setShowCGU(true)} className="hover:text-slate-400 underline">Conditions Générales d'Utilisation</button>
                  <button onClick={() => setShowLegal(true)} className="hover:text-slate-400 underline">Mentions Légales</button>
            </div>
        </div>

         {/* CGU Modal */}
        {showCGU && (
          <InfoModal title="Conditions Générales d'Utilisation" onClose={() => setShowCGU(false)}>
              <p>Bienvenue sur CoproSmart.</p>
              <p>En utilisant cette application, vous acceptez les règles suivantes :</p>
              <ul className="list-disc pl-5 space-y-2">
                  <li><b>Initiative locale :</b> CoproSmart est un outil d'entraide pour faciliter la gestion des petites interventions entre copropriétaires.</li>
                  <li><b>Absence de contrat de travail :</b> Les interventions réalisées ne constituent pas une activité salariée ni une prestation commerciale professionnelle, mais une participation collaborative à la vie de l'immeuble.</li>
                  <li><b>Compensation :</b> La rémunération se fait exclusivement par le biais d'un crédit (déduction) sur les charges de copropriété, validé par le Conseil Syndical et le Syndic.</li>
                  <li><b>Responsabilité :</b> Chaque intervenant agit sous sa propre responsabilité. Il s'engage à ne réaliser que des tâches à sa portée et à respecter les règles de sécurité.</li>
                  <li><b>Confidentialité :</b> Les données (noms, offres) sont visibles uniquement par les membres de la copropriété inscrits.</li>
              </ul>
          </InfoModal>
        )}

        {/* Legal Modal */}
        {showLegal && (
          <InfoModal title="Mentions Légales" onClose={() => setShowLegal(false)}>
              <p><b>Éditeur du service :</b></p>
              <p>CoproSmart - Initiative privée de copropriété.</p>
              <p>Résidence Watteau</p>
              <br/>
              <p><b>Hébergement :</b></p>
              <p>Ce site est hébergé par Vercel Inc.</p>
              <p>340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
              <br/>
              <p><b>Données personnelles :</b></p>
              <p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez le Conseil Syndical.</p>
          </InfoModal>
        )}
      </div>
    );
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}