
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
            <p className="text-xs opacity-90 mt-1 break-words">{t.message}</p>
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
                                    <