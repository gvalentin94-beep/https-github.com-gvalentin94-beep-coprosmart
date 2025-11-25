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

function InfoModal({ title, children, onClose }: { title: string; children?: React.ReactNode; onClose: () => void }) {
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
                                    <Select value={editRole} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditRole(e.target.value as UserRole)}>
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

            {/* Invite User Modal (Replaces Add User) */}
             {isInviting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                        <CardHeader><CardTitle>Inviter un résident</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-400 mb-2">Envoyez une invitation par email pour rejoindre CoproSmart.</p>
                            <div className="space-y-1.5">
                                <Label>Email du voisin</Label>
                                <Input type="email" placeholder="voisin@exemple.com" value={inviteEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="ghost" onClick={() => setIsInviting(false)}>Annuler</Button>
                                <Button onClick={handleInviteUserSubmit} disabled={!inviteEmail}>Envoyer l'invitation</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function CreateTaskPage({ onBack, onCreate }: { onBack: () => void, onCreate: (task: any) => void }) {
    // STATE
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<TaskCategory>("ampoule");
    const [scope, setScope] = useState<TaskScope>("copro");
    const [details, setDetails] = useState("");
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [startingPrice, setStartingPrice] = useState("");
    const [warrantyDays, setWarrantyDays] = useState("0");
    const [photo, setPhoto] = useState<string | undefined>(undefined);
    
    // PREVIEW MODAL
    const [showPreview, setShowPreview] = useState(false);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (!title.trim()) return alert("Le titre est obligatoire");
        if (!startingPrice || Number(startingPrice) <= 0) return alert("Le prix est obligatoire");
        if (Number(startingPrice) > MAX_TASK_PRICE) return alert(`Le prix maximum est de ${MAX_TASK_PRICE}€`);
        setShowPreview(true);
    };

    const handleSubmit = () => {
        onCreate({
            title, category, scope, details, location, startingPrice: Number(startingPrice), warrantyDays: Number(warrantyDays), photo
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
             <Button variant="ghost" onClick={onBack} className="mb-4 pl-0 hover:bg-transparent hover:text-white">← Retour au tableau de bord</Button>
             
             <h2 className="text-3xl font-black text-white mb-6 tracking-tighter">Nouvelle tâche</h2>
             
             <div className="space-y-8">
                {/* 1. QUOI */}
                <Section title="1. De quoi s'agit-il ?">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Titre de la demande <span className="text-rose-400">*</span></Label>
                            <Input 
                                placeholder="Ex: Ampoule grillée dans le hall" 
                                value={title} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
                                className="!bg-white !text-slate-900 font-medium text-lg"
                            />
                        </div>

                        {/* Category Selection - Rich Buttons */}
                         <div className="space-y-1.5">
                            <Label className="text-slate-300">Catégorie</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {CATEGORIES.map(cat => {
                                    const isSelected = category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id as TaskCategory)}
                                            className={`
                                                relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all
                                                ${isSelected 
                                                    ? `bg-white border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900` 
                                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-400 hover:border-slate-500'
                                                }
                                            `}
                                        >
                                            <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : ''}`}>{cat.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Scope Selection - Rich Buttons */}
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Concerne</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {SCOPES.map(s => {
                                    const isSelected = scope === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => setScope(s.id as TaskScope)}
                                            className={`
                                                flex items-center gap-3 p-4 rounded-xl border transition-all text-left
                                                ${isSelected 
                                                    ? 'bg-white border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' 
                                                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-400'
                                                }
                                            `}
                                        >
                                            <span className={`font-bold text-sm ${isSelected ? 'text-slate-900' : ''}`}>{s.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 2. OÙ ET COMBIEN */}
                <Section title="2. Détails & Prix">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div className="space-y-1.5">
                            <Label className="text-slate-300">Emplacement <span className="text-rose-400">*</span></Label>
                            <Select 
                                value={location} 
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLocation(e.target.value)}
                                className="!bg-white !text-slate-900 h-[46px]"
                            >
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Prix de départ (€) <span className="text-rose-400">*</span></Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    placeholder="15" 
                                    value={startingPrice} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartingPrice(e.target.value)}
                                    className="!bg-white !text-slate-900 font-mono font-bold pl-8 h-[46px]"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                            </div>
                            <p className="text-xs text-slate-500 text-right">Max: {MAX_TASK_PRICE}€</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Description détaillée</Label>
                        <Textarea 
                            placeholder="Décrivez précisément le travail à effectuer..." 
                            value={details} 
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDetails(e.target.value)} 
                            className="!bg-white !text-slate-900 min-h-[100px]"
                        />
                    </div>

                    <div className="space-y-3">
                         <Label className="text-slate-300">Garantie souhaitée</Label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                             {WARRANTY_OPTIONS.map(w => {
                                 const isSelected = warrantyDays === w.val;
                                 return (
                                     <button
                                        key={w.val}
                                        onClick={() => setWarrantyDays(w.val)}
                                        className={`
                                            flex flex-col items-center justify-center p-3 rounded-lg border transition-all
                                            ${isSelected 
                                                ? 'bg-white border-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400'
                                            }
                                        `}
                                     >
                                         <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : ''}`}>{w.label}</span>
                                     </button>
                                 );
                             })}
                         </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Photo (Optionnel)</Label>
                        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-slate-500 hover:bg-slate-800/50 transition cursor-pointer relative">
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            {photo ? (
                                <img src={photo} alt="Preview" className="max-h-48 rounded shadow-lg" />
                            ) : (
                                <>
                                    <span className="text-4xl mb-2">📷</span>
                                    <span>Cliquez pour ajouter une photo</span>
                                </>
                            )}
                        </div>
                    </div>
                </Section>

                <div className="pt-8 border-t border-slate-800 flex justify-end">
                    <Button size="lg" onClick={handlePreview} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 shadow-lg shadow-indigo-500/20">
                        Vérifier la demande →
                    </Button>
                </div>
             </div>

             {showPreview && <TaskPreviewModal task={{ title, category, scope, details, location, startingPrice: Number(startingPrice), warrantyDays: Number(warrantyDays), photo }} onCancel={() => setShowPreview(false)} onConfirm={handleSubmit} />}
        </div>
    );
}

function SharedFooter() {
    const [showCGU, setShowCGU] = useState(false);
    const [showMentions, setShowMentions] = useState(false);

    return (
        <footer className="mt-20 border-t border-slate-800/50 py-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-2xl">🏢</span>
                <span className="font-bold text-white tracking-tight">CoproSmart <span className="text-indigo-500">v0.2.16</span></span>
            </div>
            <div className="flex justify-center gap-6 text-xs text-slate-500">
                <button onClick={() => setShowCGU(true)} className="hover:text-slate-300 transition-colors">Conditions Générales d'Utilisation</button>
                <button onClick={() => setShowMentions(true)} className="hover:text-slate-300 transition-colors">Mentions Légales</button>
            </div>
            
            {showCGU && (
                <InfoModal title="Conditions Générales d'Utilisation" onClose={() => setShowCGU(false)}>
                    <h4 className="font-bold text-white mt-4">1. Objet</h4>
                    <p>CoproSmart est une plateforme de mise en relation entre copropriétaires pour la réalisation de petits travaux.</p>
                    <h4 className="font-bold text-white mt-4">2. Responsabilité</h4>
                    <p>La copropriété n'agit qu'en tant qu'intermédiaire technique. Chaque intervenant est responsable de ses travaux.</p>
                    <h4 className="font-bold text-white mt-4">3. Paiement</h4>
                    <p>Les rémunérations sont effectuées par déduction de charges (crédit) ou de la main à la main selon la nature des travaux.</p>
                </InfoModal>
            )}
            
            {showMentions && (
                 <InfoModal title="Mentions Légales" onClose={() => setShowMentions(false)}>
                    <p>Éditeur : CoproSmart Inc.</p>
                    <p>Hébergement : Vercel Inc.</p>
                    <p>Contact : admin@coprosmart.fr</p>
                </InfoModal>
            )}
        </footer>
    );
}


function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<RegisteredUser[]>([]);
  
  // View State
  const [currentView, setCurrentView] = useState<'home' | 'create-task' | 'directory' | 'ledger'>('home');

  // Load Data
  const loadData = useCallback(async () => {
    try {
        const [loadedTasks, loadedLedger, loadedPending, loadedDirectory, allUsers] = await Promise.all([
            api.readTasks(),
            api.readLedger(),
            api.getPendingUsers(),
            api.getDirectory(),
            api.getAllUsers()
        ]);
        
        // Build Users Map for Name Resolution
        const map: Record<string, string> = {};
        allUsers.forEach(u => {
            map[u.email] = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.email;
        });
        setUsersMap(map);

        setTasks(loadedTasks);
        setLedger(loadedLedger);
        setPendingUsers(loadedPending);
        setDirectoryUsers(loadedDirectory);
    } catch (e) {
        console.error("Failed to load data", e);
    }
  }, []);

  const [usersMap, setUsersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
    // Real-time refresh loop (simple polling for this prototype)
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // --- Actions Handlers ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  
  const notify = async (recipients: string[], subject: string, message: string) => {
    // 1. Visual notification
    addToast("Notification envoyée", subject, "info");

    // 2. Real Email Sending via Backend
    if (recipients.length > 0) {
        try {
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: recipients,
                    subject: subject,
                    html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #4f46e5;">CoproSmart Notification</h2>
                            <p>${message}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p style="font-size: 12px; color: #666;">Ceci est un message automatique de votre copropriété.</p>
                        </div>`
                })
            });
        } catch (e) {
            console.error("Failed to send email", e);
        }
    }
  };

  // HANDLERS
  
  const handleCreateTask = async (taskData: any) => {
    try {
        const taskId = await api.createTask({
            ...taskData,
            status: 'pending' // Admin tasks are NOT auto-open anymore, they go to pending
        }, user.id);
        
        // Auto-approve if Council/Admin (First approval)
        if (user.role === 'council' || user.role === 'admin') {
             await api.addApproval(taskId, user.id);
        }

        notify([user.email], "Tâche créée", `Votre demande "${taskData.title}" a été enregistrée et est en attente de validation.`);
        setCurrentView('home');
        loadData();
        addToast("Succès", "Tâche créée avec succès", "success");
    } catch (e: any) {
        addToast("Erreur", e.message, "error");
    }
  };

  const handleApprove = async (taskId: string) => {
      try {
          await api.addApproval(taskId, user.id);
          
          // Re-fetch to check approval count logic
          // But for now, let's just optimistically check locally or rely on reload
          // We need to check if we reached 2 approvals OR if admin forced it
          
          // Note: In a real app, the backend trigger handles status change. 
          // Here we simulate the check:
          const task = tasks.find(t => t.id === taskId);
          const currentApprovals = (task?.approvals.length || 0) + 1;
          
          if (user.role === 'admin') {
               // Admin Force Validate
               await api.updateTaskStatus(taskId, 'open', { biddingStartedAt: null }); // bidding start when first bid comes
               notify(directoryUsers.map(u => u.email), "Nouvelle opportunité !", `La tâche "${task?.title}" a été validée par l'administrateur et est ouverte aux offres.`);
          } else if (currentApprovals >= COUNCIL_MIN_APPROVALS) {
               await api.updateTaskStatus(taskId, 'open', { biddingStartedAt: null });
               notify(directoryUsers.map(u => u.email), "Nouvelle opportunité !", `La tâche "${task?.title}" a reçu ses validations et est ouverte aux offres.`);
          }

          loadData();
          addToast("Validé", "Votre approbation a été enregistrée", "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };
  
  const handleReject = async (taskId: string) => {
       try {
           await api.addRejection(taskId, user.id);
           await api.updateTaskStatus(taskId, 'rejected'); // Immediate rejection? Or voting? Let's say immediate for now.
           loadData();
           addToast("Rejeté", "La tâche a été rejetée", "info");
       } catch (e: any) {
           addToast("Erreur", e.message, "error");
       }
  };

  // Currying for TaskCard
  const onBidWrapper = async (taskId: string, bidData: Omit<Bid, 'by' | 'at'>) => {
      try {
          const task = tasks.find(t => t.id === taskId);
          if (!task) return;

          await api.addBid(taskId, bidData, user.id);
          
          // Start timer if first bid
          if (!task.biddingStartedAt) {
              await api.updateTaskStatus(taskId, 'open', { biddingStartedAt: new Date().toISOString() });
          }

          notify([task.createdBy], "Nouvelle offre", `Une offre de ${bidData.amount}€ a été faite sur votre tâche "${task.title}".`);
          loadData();
          addToast("Offre envoyée", "Votre positionnement a été enregistré", "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  const handleAward = async (taskId: string) => {
      try {
          const task = tasks.find(t => t.id === taskId);
          if (!task || !task.bids.length) return;
          
          // Find lowest bid
          const winnerBid = task.bids.reduce((min: any, b: any) => b.amount < min.amount ? b : min, task.bids[0]);
          
          await api.updateTaskStatus(taskId, 'awarded', {
              awardedTo: winnerBid.userId, // Use userId if available
              awardedAmount: winnerBid.amount
          });

          notify([winnerBid.by], "Félicitations !", `La tâche "${task.title}" vous a été attribuée pour ${winnerBid.amount}€.`);
          loadData();
          addToast("Attribuée", "La tâche a été attribuée au meilleur offrant", "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  const handleRequestVerification = async (taskId: string) => {
       try {
           await api.updateTaskStatus(taskId, 'verification');
           // Notify Council
           const councilEmails = directoryUsers.filter(u => u.role === 'council' || u.role === 'admin').map(u => u.email);
           notify(councilEmails, "Contrôle Qualité Requis", `Une tâche est terminée et nécessite votre validation.`);
           loadData();
           addToast("Envoyé", "Demande de vérification envoyée au Conseil Syndical", "success");
       } catch (e: any) {
           addToast("Erreur", e.message, "error");
       }
  };

  const handleRejectWork = async (taskId: string) => {
      try {
          await api.updateTaskStatus(taskId, 'awarded'); // Back to work
          loadData();
          addToast("Refusé", "Le travail a été refusé et renvoyé au copropriétaire", "info");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  const handleComplete = async (taskId: string) => {
       try {
           const task = tasks.find(t => t.id === taskId);
           if (!task) return;

           // 1. Mark as completed and save validator
           await api.updateTaskStatus(taskId, 'completed', { validatedBy: user.id });

           // 2. Generate Ledger Entry
           if (task.awardedTo && task.awardedAmount) {
               // Get awarded user ID
               // We have awardedTo (email) or awardedToId (UUID) in task object?
               // The API mapTask populates awardedTo (email) and awardedToId.
               
               const entry = {
                   taskId: task.id,
                   type: task.scope === 'copro' ? 'charge_credit' : 'apartment_payment',
                   payerId: task.scope === 'copro' ? null : task.createdById, // Null for Copro
                   payeeId: task.awardedToId,
                   amount: task.awardedAmount
               };
               await api.createLedgerEntry(entry);
           }

           notify([task.awardedTo!], "Paiement validé", `Le travail pour "${task.title}" a été validé. Le montant a été ajouté au journal.`);
           loadData();
           addToast("Terminé", "Tâche clôturée et paiement enregistré", "success");
       } catch (e: any) {
           addToast("Erreur", e.message, "error");
       }
  };
  
  const handleRate = async (taskId: string, ratingData: any) => {
      try {
          await api.addRating(taskId, ratingData, user.id);
          loadData();
          addToast("Merci", "Votre avis a été enregistré", "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };
  
  const handleDeleteRating = async (taskId: string, ratingIdx: number) => {
      if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
      try {
          await api.deleteRating(taskId, ratingIdx, user.id);
          loadData();
          addToast("Supprimé", "Le commentaire a été supprimé", "info");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  const handleDeleteTask = async (taskId: string) => {
      if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche définitivement ?")) return;
      try {
          if (user.role !== 'admin') throw new Error("Seul l'admin peut supprimer.");
          await api.deleteTask(taskId);
          loadData();
          addToast("Supprimé", "Tâche supprimée", "info");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };
  
  const handleDeleteLedger = async (id: string) => {
      if (!confirm("Supprimer cette ligne comptable ?")) return;
      try {
          await api.deleteLedgerEntry(id);
          loadData();
          addToast("Supprimé", "Ligne comptable effacée", "info");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  // User Management Handlers
  const handleApproveUser = async (email: string) => {
      try {
          await api.approveUser(email);
          notify([email], "Compte validé !", "Bienvenue sur CoproSmart. Votre compte a été validé par le Conseil Syndical.");
          loadData();
          addToast("Validé", "Utilisateur activé", "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };
  
  const handleRejectUser = async (email: string) => {
      if (!confirm("Refuser cette inscription ?")) return;
      try {
          await api.rejectUser(email);
          loadData();
          addToast("Refusé", "Utilisateur rejeté", "info");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };
  
  const handleBanUser = async (email: string) => {
       if (!confirm("Bannir cet utilisateur ? Il ne pourra plus se connecter.")) return;
       try {
           await api.updateUserStatus(email, 'deleted');
           loadData();
           addToast("Banni", "Utilisateur désactivé", "error");
       } catch (e: any) {
           addToast("Erreur", e.message, "error");
       }
  };
  
  const handleRestoreUser = async (email: string) => {
       try {
           await api.updateUserStatus(email, 'active');
           loadData();
           addToast("Rétabli", "Utilisateur réactivé", "success");
       } catch (e: any) {
           addToast("Erreur", e.message, "error");
       }
  };
  
  const handleDeleteUser = async (email: string) => {
      if (!confirm("ATTENTION : Cette action est irréversible. Le profil sera supprimé définitivement. Continuer ?")) return;
      try {
          await api.deleteUserProfile(email);
          loadData();
          addToast("Supprimé", "Utilisateur supprimé de la base", "success");
      } catch (e: any) {
           addToast("Erreur", e.message, "error");
      }
  };

  const handleUpdateUser = async (email: string, updates: any) => {
      try {
          await api.updateUser(email, updates);
          loadData();
          addToast("Mis à jour", "Profil modifié", "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  const handleInviteUser = async (email: string) => {
      try {
          const inviterName = `${user.firstName} ${user.lastName}`;
          await api.inviteUser(email, inviterName);
          addToast("Envoyé", `Invitation envoyée à ${email}`, "success");
      } catch (e: any) {
          addToast("Erreur", e.message, "error");
      }
  };

  // --- Derived State for Lists ---
  const myTasks = tasks.filter(t => t.awardedTo === user.email && (t.status === 'awarded' || t.status === 'verification'));
  const openTasks = tasks.filter(t => t.status === 'open');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  // All awarded/verification tasks for the "Work in Progress" section
  const progressTasks = tasks.filter(t => t.status === 'awarded' || t.status === 'verification');
  const historyTasks = tasks.filter(t => t.status === 'completed' || t.status === 'rejected');
  
  // Random empty messages (memoized to stay constant during session)
  const randomOpenMsg = useMemo(() => OPEN_EMPTY_MESSAGES[Math.floor(Math.random() * OPEN_EMPTY_MESSAGES.length)], []);
  const randomProgressMsg = useMemo(() => PROGRESS_EMPTY_MESSAGES[Math.floor(Math.random() * PROGRESS_EMPTY_MESSAGES.length)], []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20">
      <ToastContainer toasts={toasts} onClose={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* HEADER */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setCurrentView('home')}>
                <div className="leading-none">
                    <h1 className="text-xl font-black text-white tracking-tighter">CoproSmart.</h1>
                    <p className="text-[10px] text-slate-400 font-black tracking-tighter">On réduit nos charges de copropriété.</p>
                </div>
            </div>

            {/* Navigation Buttons */}
            {currentView !== 'create-task' && (
                <div className="flex items-center gap-4">
                     <nav className="hidden md:flex gap-1">
                        <Button variant={currentView === 'home' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('home')}>Accueil</Button>
                        <Button variant={currentView === 'directory' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('directory')}>Annuaire</Button>
                        {(user.role === 'admin' || user.role === 'council') && (
                            <Button variant={currentView === 'ledger' ? 'secondary' : 'ghost'} size="sm" onClick={() => setCurrentView('ledger')}>Écritures</Button>
                        )}
                    </nav>
                    
                    <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block"></div>
                    
                    <div className="flex flex-col items-end">
                         <div className="text-right leading-none">
                            <div className="text-sm font-bold text-white">{user.firstName} {user.lastName.toUpperCase()}</div>
                            <div className="text-[10px] text-slate-400">{user.email}</div>
                        </div>
                        <Badge 
                            variant="outline" 
                            className={`mt-1 h-4 text-[9px] border-0 
                                ${user.role === 'admin' ? 'bg-rose-900/50 text-rose-200' : 
                                  user.role === 'council' ? 'bg-amber-900/50 text-amber-200' : 
                                  'bg-slate-800 text-slate-400'}`}
                        >
                            {ROLES.find(r => r.id === user.role)?.label}
                        </Badge>
                    </div>
                    
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-slate-400 hover:text-white"
                        onClick={() => {
                            api.logout();
                            onLogout();
                        }}
                    >
                        ✕
                    </Button>

                    <Button 
                        size="sm" 
                        className="bg-indigo-600 hover:bg-indigo-500 text-white ml-2 shadow-lg shadow-indigo-500/20"
                        onClick={() => setCurrentView('create-task')}
                    >
                        + Nouvelle Tâche
                    </Button>
                </div>
            )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {currentView === 'create-task' ? (
            <CreateTaskPage onBack={() => setCurrentView('home')} onCreate={handleCreateTask} />
        ) : currentView === 'directory' ? (
            <UserDirectory 
                users={directoryUsers} 
                tasks={tasks} 
                me={user} 
                onBan={handleBanUser} 
                onRestore={handleRestoreUser} 
                onUpdateUser={handleUpdateUser}
                onDeleteRating={handleDeleteRating}
                onInviteUser={handleInviteUser}
                onDeleteUser={handleDeleteUser}
            />
        ) : currentView === 'ledger' ? (
            <Ledger entries={ledger} usersMap={usersMap} onDelete={handleDeleteLedger} isAdmin={user.role === 'admin'} />
        ) : (
            <div className="space-y-12">
                
                {/* 1. VALIDATION QUEUE (Admin & Council Only Action, Visible to All) */}
                {pendingTasks.length > 0 && (
                     <Section title={`⚠️ En attente de validation (${pendingTasks.length})`} className="border-l-4 border-amber-500 pl-4">
                        {pendingTasks.map(t => (
                            <TaskCard 
                                key={t.id} 
                                task={t} 
                                me={user} 
                                usersMap={usersMap}
                                onBid={() => {}} 
                                onAward={() => {}} 
                                onComplete={() => {}} 
                                onRate={() => {}}
                                onPayApartment={() => {}}
                                onDelete={() => handleDeleteTask(t.id)}
                                canDelete={user.role === 'admin'}
                                // Only pass actions if user is Council or Admin
                                onApprove={ (user.role === 'admin' || user.role === 'council') ? () => handleApprove(t.id) : undefined }
                                onReject={ (user.role === 'admin' || user.role === 'council') ? () => handleReject(t.id) : undefined }
                            />
                        ))}
                    </Section>
                )}

                {/* 2. USER VALIDATION QUEUE (Admin & Council Only) */}
                {(user.role === 'admin' || user.role === 'council') && pendingUsers.length > 0 && (
                    <UserValidationQueue 
                        pendingUsers={pendingUsers} 
                        onApprove={handleApproveUser} 
                        onReject={handleRejectUser} 
                    />
                )}

                {/* 3. OPEN OFFERS */}
                <Section title="📣 Offres ouvertes">
                    {openTasks.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                            <p className="text-2xl mb-2">🏖️</p>
                            <p className="text-slate-500 font-medium">{randomOpenMsg}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {openTasks.map(t => (
                                <TaskCard 
                                    key={t.id} 
                                    task={t} 
                                    me={user} 
                                    usersMap={usersMap}
                                    onBid={(b) => onBidWrapper(t.id, b)} 
                                    onAward={() => handleAward(t.id)} 
                                    onComplete={() => {}} 
                                    onRate={() => {}}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDeleteTask(t.id)}
                                    canDelete={user.role === 'admin'}
                                />
                            ))}
                        </div>
                    )}
                </Section>

                {/* 4. WORK IN PROGRESS */}
                <Section title="🏗️ Travaux en cours">
                     {progressTasks.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                            <p className="text-2xl mb-2">💤</p>
                            <p className="text-slate-500 font-medium">{randomProgressMsg}</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {progressTasks.map(t => (
                                <TaskCard 
                                    key={t.id} 
                                    task={t} 
                                    me={user} 
                                    usersMap={usersMap}
                                    onBid={() => {}} 
                                    onAward={() => {}} 
                                    onComplete={() => handleComplete(t.id)} 
                                    onRate={() => {}}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDeleteTask(t.id)}
                                    canDelete={user.role === 'admin'}
                                    onRequestVerification={() => handleRequestVerification(t.id)}
                                    onRejectWork={() => handleRejectWork(t.id)}
                                />
                            ))}
                        </div>
                    )}
                </Section>
                
                {/* 5. HISTORY */}
                {historyTasks.length > 0 && (
                    <Section title="✅ Travaux terminés">
                        <div className="grid gap-4 opacity-80 hover:opacity-100 transition-opacity">
                            {historyTasks.map(t => (
                                <TaskCard 
                                    key={t.id} 
                                    task={t} 
                                    me={user} 
                                    usersMap={usersMap}
                                    onBid={() => {}} 
                                    onAward={() => {}} 
                                    onComplete={() => {}} 
                                    onRate={(r) => handleRate(t.id, r)}
                                    onDeleteRating={handleDeleteRating}
                                    onPayApartment={() => {}}
                                    onDelete={() => handleDeleteTask(t.id)}
                                    canDelete={user.role === 'admin'}
                                />
                            ))}
                        </div>
                    </Section>
                )}
            </div>
        )}
      </main>

       {/* FOOTER */}
       <SharedFooter />

    </div>
  );
}

function App() {
  const { user, setUser, loading } = useAuth();
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);

  // Listen for Password Recovery Event from Email Link
  useEffect(() => {
      const { data: { subscription } } = api.onPasswordRecovery(() => {
          setShowPasswordRecovery(true);
      });
      return () => subscription.unsubscribe();
  }, []);

  if (loading) {
      return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Chargement...</div>;
  }

  // Password Recovery Modal (Always visible if triggered)
  if (showPasswordRecovery) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
              <Card className="w-full max-w-md bg-slate-900 border-slate-700">
                  <CardHeader><CardTitle>Nouveau mot de passe</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                      <p className="text-sm text-slate-400">Veuillez choisir un nouveau mot de passe pour votre compte.</p>
                      <Input type="password" placeholder="Nouveau mot de passe" id="new-password" />
                      <Button className="w-full" onClick={async () => {
                          const pwd = (document.getElementById('new-password') as HTMLInputElement).value;
                          if(pwd) {
                              try {
                                  // Update via Auth API
                                  // We need to handle this via api service ideally, but for recovery flow often direct update works if session established
                                  // api.updateUser logic handles password update if authenticated.
                                  // The link should have authenticated the user.
                                  await api.updateUser('recovery', { password: pwd }); // 'recovery' is placeholder, api uses session
                                  alert("Mot de passe modifié !");
                                  setShowPasswordRecovery(false);
                                  window.location.href = "/"; 
                              } catch(e: any) {
                                  alert("Erreur: " + e.message);
                              }
                          }
                      }}>Enregistrer</Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  if (!user) {
    return <LoginCard onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

export default App;
