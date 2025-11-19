
import React, { useState, useEffect, useCallback } from 'react';
import type { Me, Task, User, LedgerEntry, TaskCategory, TaskScope, Rating, Bid, RegisteredUser } from './types';
import { useAuth, fakeApi } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge } from './components/ui';
import { LoginCard } from './components/LoginCard';
import { TaskCard } from './components/TaskCard';
import { COUNCIL_MIN_APPROVALS, CATEGORIES, PlusIcon, ROLES, LOCATIONS } from './constants';

// --- Toast Notification System for Simulated Emails ---
interface Toast {
  id: string;
  to: string;
  subject: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div key={t.id} className="bg-slate-800 border-l-4 border-indigo-500 text-white p-3 rounded shadow-xl flex flex-col animate-in slide-in-from-right">
          <div className="flex items-center gap-2 text-xs text-indigo-300 uppercase font-bold tracking-wider">
            ✉️ Email simulé
          </div>
          <div className="text-xs text-slate-400 mt-1">À: {t.to}</div>
          <div className="font-medium text-sm mt-0.5">{t.subject}</div>
        </div>
      ))}
    </div>
  );
}

// --- Governance Component ---
function Governance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>⚖️ Règles de fonctionnement</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-3 text-slate-300">
        <p><b>Inscription</b>: Tout nouveau compte doit être validé par un membre du Conseil Syndical avant de pouvoir accéder à l'application.</p>
        <p><b>Validation</b>: Une tâche devient visible pour les enchères après <b>{COUNCIL_MIN_APPROVALS} approbations</b> du Conseil syndical.</p>
        <p><b>Suppression</b>: Un membre du CS ne peut pas supprimer une tâche en offres ouvertes. Seul l'admin peut tout supprimer.</p>
        <p><b>Enchères inversées</b>: Le montant de départ ne peut que diminuer, par palier de 1€ (pas de centimes).</p>
         <p><b>Attribution</b>: La tâche est attribuée automatiquement au moins-disant <b>24h</b> après la première offre, ou manuellement par le créateur.</p>
      </CardContent>
    </Card>
  );
}

// --- Terms of Service Component ---
function TermsOfService() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>📜 Conditions Générales d'Utilisation de CoproSmart</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-slate-300 prose-headings:text-white space-y-4">
                <h4 className="font-bold">Préambule : L'esprit CoproSmart</h4>
                <p>CoproSmart est une plateforme conçue pour encourager l'initiative et la participation de chaque copropriétaire à l'entretien de notre résidence. Elle repose sur la confiance, la transparence et la volonté de faire des économies ensemble. En utilisant ce service, vous acceptez de participer activement et de bonne foi à la vie de la copropriété.</p>

                <h4 className="font-bold pt-2 border-t border-slate-700">Article 1 : Proposer une tâche</h4>
                <p>Chaque copropriétaire peut proposer une tâche nécessaire à l'entretien (changer une ampoule, évacuer un encombrant, etc.). La proposition doit être claire, détaillée et inclure un prix de départ juste.</p>

                <h4 className="font-bold pt-2 border-t border-slate-700">Article 2 : Validation par le Conseil Syndical</h4>
                <p>Pour garantir sa pertinence, chaque tâche doit être approuvée par au moins <b>deux membres du Conseil Syndical</b> avant d'être ouverte aux offres.</p>

                <h4 className="font-bold pt-2 border-t border-slate-700">Article 3 : Le système d'enchères</h4>
                <p>Le principe est une enchère inversée : le premier qui se positionne doit proposer un prix inférieur au prix de départ. Les suivants doivent proposer un prix inférieur à l'offre la plus basse. <b>En faisant une offre, vous vous engagez à réaliser la tâche à la date que vous proposez</b> (dans les 30 jours suivants).</p>
                
                <h4 className="font-bold pt-2 border-t border-slate-700">Article 4 : Règle d'attribution automatique</h4>
                <p>Pour dynamiser le processus, un <b>compte à rebours de 24 heures</b> se déclenche dès la première offre. À l'issue de ce délai, la tâche est automatiquement attribuée au copropriétaire ayant fait l'offre la plus basse.</p>
                
                <h4 className="font-bold pt-2 border-t border-slate-700">Article 5 : Règle de participation stratégique</h4>
                <p>Pour garantir l'équité, chaque copropriétaire ne peut faire qu'<b>une seule offre</b> par tâche. <b>Exception</b> : pour récompenser la réactivité, le tout premier copropriétaire à faire une offre a le droit de faire une <b>seconde offre</b> pour s'ajuster.</p>
                
                <h4 className="font-bold pt-2 border-t border-slate-700">Article 6 : Règle de paiement et de rémunération</h4>
                <p>Le montant pour lequel vous remportez une tâche ne vous est pas versé directement. Il sera <b>déduit du montant de vos prochains appels de charges</b>. C'est une manière simple de réduire vos dépenses tout en contribuant à la vie de l'immeuble.</p>

                <h4 className="font-bold pt-2 border-t border-slate-700">Article 7 : Garantie et notation</h4>
                <p>L'intervention est garantie pour la durée spécifiée. Après la réalisation, les autres copropriétaires sont invités à noter anonymement la qualité du travail.</p>
            </CardContent>
        </Card>
    );
}


// --- Ledger Component ---
function Ledger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fakeApi.readLedger().then(setEntries);
  }, []);

  if (!entries.length) return <EmptyState text="Aucune écriture pour l'instant." />;

  return (
    <Card>
      <CardHeader><CardTitle>📒 Journal des écritures</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {entries.map((e, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-slate-700/50 border border-slate-600">
              <span>
                <span className="font-mono text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">#{e.taskId.slice(0, 6)}</span>
                <span className="ml-2 text-slate-200">{e.payer} → {e.payee}</span>
              </span>
              <span className="font-semibold text-white">{e.amount} €</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// --- Directory Component ---
interface UserDirectoryProps {
    me: Me;
    tasks: Task[];
    onDataChange: () => void; // To trigger refresh if admin changes something
}

function UserDirectory({ me, tasks, onDataChange }: UserDirectoryProps) {
    const [users, setUsers] = useState<RegisteredUser[]>([]);

    const fetchUsers = useCallback(async () => {
        const data = await fakeApi.getDirectory();
        setUsers(data);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, onDataChange]); // Refresh when parent data changes too

    const handleDeleteUser = async (email: string) => {
        if (window.confirm(`Voulez-vous vraiment bannir l'utilisateur ${email} ?`)) {
            await fakeApi.updateUserStatus(email, 'deleted');
            fetchUsers();
        }
    };

    const handleRestoreUser = async (email: string) => {
        if (window.confirm(`Rétablir l'utilisateur ${email} ?`)) {
            await fakeApi.updateUserStatus(email, 'active');
            fetchUsers();
        }
    };

    const handleDeleteRating = async (taskId: string, ratingIndex: number) => {
        if (window.confirm("Supprimer ce commentaire ?")) {
            await fakeApi.deleteRating(taskId, ratingIndex);
            onDataChange(); // This will eventually trigger fetchUsers via props/effect if needed, but main point is to refresh reviews
        }
    };

    const getReviewsForUser = (email: string) => {
        // Find all ratings on tasks awarded to this user
        return tasks
            .filter(t => t.awardedTo === email && t.ratings && t.ratings.length > 0)
            .flatMap(t => t.ratings.map((r, idx) => ({ ...r, taskId: t.id, originalIdx: idx })));
    };

    const getAverageRating = (reviews: Rating[]) => {
        if (reviews.length === 0) return 0;
        return (reviews.reduce((acc, r) => acc + r.stars, 0) / reviews.length).toFixed(1);
    };

    const isAdminOrCouncil = me.role === 'admin' || me.role === 'council';
    const isAdmin = me.role === 'admin';

    return (
        <div className="space-y-4">
            <Section title="👥 Annuaire de la Résidence" count={users.filter(u => u.status === 'active' || (isAdmin && u.status === 'deleted')).length}>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                    {users.map(u => {
                        // Hide deleted users for normal users
                        if (u.status === 'deleted' && !isAdmin) return null;
                        
                        const reviews = getReviewsForUser(u.email);
                        const avg = getAverageRating(reviews);
                        const isDeleted = u.status === 'deleted';
                        const firstName = u.firstName || 'Utilisateur';
                        const lastName = u.lastName ? u.lastName.toUpperCase() : '';

                        return (
                            <Card key={u.id} className={`${isDeleted ? 'opacity-60 border-rose-900 bg-rose-950/20' : 'border-slate-700'}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {firstName} {lastName}
                                                {isDeleted && <Badge variant="destructive">Banni</Badge>}
                                            </CardTitle>
                                            <p className="text-xs text-slate-400 mt-1">{u.email}</p>
                                        </div>
                                        <Badge variant="outline">{ROLES.find(r => r.id === u.role)?.label}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Ratings Summary */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-yellow-400 font-bold text-lg">★ {avg}</span>
                                        <span className="text-slate-500">({reviews.length} avis)</span>
                                    </div>

                                    {/* Recent Comments */}
                                    {reviews.length > 0 && (
                                        <div className="bg-slate-900/50 rounded-lg p-2 space-y-2 max-h-40 overflow-y-auto text-xs">
                                            {reviews.map((r, i) => (
                                                <div key={i} className="border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex text-yellow-500">{"★".repeat(r.stars)}<span className="text-slate-700">{"★".repeat(5-r.stars)}</span></div>
                                                        {isAdminOrCouncil && (
                                                            <button onClick={() => handleDeleteRating(r.taskId, r.originalIdx)} className="text-rose-500 hover:text-rose-400 text-[10px] uppercase font-bold">
                                                                Supprimer
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-300 mt-1 italic">"{r.comment}"</p>
                                                    <p className="text-slate-600 text-[10px] mt-1">{new Date(r.at).toLocaleDateString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Admin Actions */}
                                    {isAdminOrCouncil && (
                                        <div className="pt-2 flex justify-end gap-2 border-t border-slate-700/50">
                                            {!isDeleted ? (
                                                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(u.email)}>
                                                    🚫 Bannir
                                                </Button>
                                            ) : (
                                                isAdmin && (
                                                    <Button variant="secondary" size="sm" onClick={() => handleRestoreUser(u.email)}>
                                                        ♻️ Rétablir le compte
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </Section>
        </div>
    );
}

// --- EmptyState & Section Components ---
interface EmptyStateProps {
  text: string;
}

function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/50 text-center py-10 px-4">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

interface SectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
}

function Section({ title, count, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        {count !== undefined && <Badge variant="secondary" className="text-base px-3">{count}</Badge>}
      </div>
      {children}
    </section>
  );
}

// --- CreateTaskForm Component ---
interface CreateTaskFormProps {
  onCreate: (data: Omit<Task, 'id' | 'status' | 'approvals' | 'rejections' | 'createdBy' | 'createdAt' | 'bids' | 'ratings'>) => void;
}
function CreateTaskForm({ onCreate }: CreateTaskFormProps) {
    const [open, setOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    
    // Form States
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<TaskCategory>("ampoule");
    const [scope, setScope] = useState<TaskScope>("copro");
    const [details, setDetails] = useState("");
    const [location, setLocation] = useState("");
    const [startingPrice, setStartingPrice] = useState("20");
    const [warrantyDays, setWarrantyDays] = useState("30");

    const reset = () => {
        setTitle("");
        setCategory("ampoule");
        setScope("copro");
        setDetails("");
        setLocation("");
        setStartingPrice("20");
        setWarrantyDays("30");
        setPreviewMode(false);
    };

    const handlePreview = () => {
        if (!title.trim() || !location.trim() || !startingPrice || Number(startingPrice) <= 0) {
            alert("Titre, emplacement et prix de départ positif sont des champs obligatoires.");
            return;
        }
        setPreviewMode(true);
    };

    const handleSubmit = () => {
        onCreate({
            title, category, scope, details, location, 
            startingPrice: Math.floor(Number(startingPrice)),
            warrantyDays: Number(warrantyDays),
        });
        reset();
        setOpen(false);
    };

    const getWarrantyLabel = (days: string) => {
        if (days === '0') return 'Sans garantie';
        if (days === '30') return '1 mois';
        if (days === '90') return '3 mois';
        if (days === '180') return '6 mois';
        if (days === '365') return '12 mois';
        return `${days} jours`;
    }

    if (!open) {
        return (
            <div className="mb-4">
                <Button onClick={() => setOpen(true)}>
                    <PlusIcon className="h-4 w-4" /> Proposer une tâche
                </Button>
            </div>
        );
    }

    // Preview Modal (Overlay)
    if (previewMode) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                <Card className="w-full max-w-lg bg-slate-800 border-slate-700">
                    <CardHeader>
                        <CardTitle>🔍 Vérifiez votre proposition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm text-slate-300">
                            <p><strong className="text-white">Titre :</strong> {title}</p>
                            <p><strong className="text-white">Emplacement :</strong> {location}</p>
                            <p><strong className="text-white">Prix de départ :</strong> {startingPrice} €</p>
                            <p><strong className="text-white">Catégorie :</strong> {CATEGORIES.find(c => c.id === category)?.label}</p>
                            <p><strong className="text-white">Détails :</strong> {details || "Aucun détail"}</p>
                            <p><strong className="text-white">Garantie :</strong> {getWarrantyLabel(warrantyDays)}</p>
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                            <Button variant="outline" onClick={() => setPreviewMode(false)}>✏️ Modifier</Button>
                            <Button onClick={handleSubmit}>✅ Confirmer et soumettre</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Standard Form
    return (
        <div className="mb-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="mb-2">Fermer</Button>
            <Card>
                <CardHeader><CardTitle>Nouvelle tâche pour la copropriété</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    
                    {/* Titre */}
                    <div className="space-y-1.5">
                        <Label>Titre de la tâche (obligatoire)</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Changer ampoule entrée B" />
                    </div>

                    {/* Emplacement & Prix (Moved Up) */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Emplacement (obligatoire)</Label>
                            <Select value={location} onChange={(e) => setLocation(e.target.value)}>
                                <option value="" disabled>Choisir un emplacement...</option>
                                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Prix de départ (€)</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    min="0" 
                                    step="1" 
                                    value={startingPrice} 
                                    onChange={(e) => setStartingPrice(e.target.value)} 
                                    className="pr-8" // Padding for the € symbol
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
                            </div>
                        </div>
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-1.5">
                        <Label>Catégorie</Label>
                        <Select value={category} onChange={e => setCategory(e.target.value as TaskCategory)}>
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </Select>
                    </div>

                    {/* Détails */}
                    <div className="space-y-1.5">
                        <Label>Détails</Label>
                        <Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ampoule E27, échelle nécessaire..." />
                    </div>
                    
                    {/* Garantie */}
                    <div className="pt-4 border-t border-slate-700 space-y-3">
                        <Label className="block text-center text-slate-300 text-sm mb-2">Garantie souhaitée (mois)</Label>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                { label: 'Sans', val: '0' },
                                { label: '1 mois', val: '30' },
                                { label: '3 mois', val: '90' },
                                { label: '6 mois', val: '180' },
                                { label: '12 mois', val: '365' },
                            ].map((opt) => (
                                <label key={opt.val} className={`
                                    cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all border
                                    ${warrantyDays === opt.val 
                                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' 
                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'}
                                `}>
                                     <input 
                                        type="radio" 
                                        name="warranty" 
                                        value={opt.val} 
                                        checked={warrantyDays === opt.val} 
                                        onChange={(e) => setWarrantyDays(e.target.value)} 
                                        className="hidden"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button onClick={handlePreview}>Prévisualiser la tâche</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// --- UserValidationQueue Component ---
interface UserValidationQueueProps {
    notify: (to: string, subject: string) => void;
}
function UserValidationQueue({ notify }: UserValidationQueueProps) {
    const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);

    const fetchPending = useCallback(async () => {
        const users = await fakeApi.getPendingUsers();
        setPendingUsers(users);
    }, []);

    useEffect(() => {
        fetchPending();
        // Poll for new users
        const interval = setInterval(fetchPending, 5000);
        return () => clearInterval(interval);
    }, [fetchPending]);

    const handleApprove = async (email: string) => {
        await fakeApi.approveUser(email);
        notify(email, "Votre compte CoproSmart a été validé !");
        fetchPending();
    };

    const handleReject = async (email: string) => {
        if(window.confirm(`Rejeter l'inscription de ${email} ?`)) {
             await fakeApi.rejectUser(email);
             fetchPending();
        }
    };

    if (pendingUsers.length === 0) return null;

    return (
        <div className="mb-8 animate-in slide-in-from-top duration-500">
             <Section title="Utilisateurs en attente" count={pendingUsers.length}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {pendingUsers.map(u => (
                        <Card key={u.id} className="border-amber-500/50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    👤 {u.firstName} {u.lastName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-300 mb-1">{u.email}</p>
                                <p className="text-sm text-slate-400 mb-4">Rôle demandé : <Badge variant="outline">{ROLES.find(r => r.id === u.role)?.label}</Badge></p>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleApprove(u.email)} className="w-full bg-emerald-600 hover:bg-emerald-500">Valider</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleReject(u.email)} className="w-full">Refuser</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
             </Section>
        </div>
    );
}

// --- ValidationQueue Component ---
interface ValidationQueueProps {
  me: Me;
  tasks: Task[];
  onApprove: (task: Task) => void;
  onReject: (task: Task) => void;
  onDelete: (task: Task) => void;
}
function ValidationQueue({ me, tasks, onApprove, onReject, onDelete }: ValidationQueueProps) {
    const pending = tasks.filter(t => t.status === 'pending');
    if (me.role !== 'council' && me.role !== 'admin') return null;
    if (!pending.length) return <EmptyState text="Aucune demande à valider." />;

    return (
        <div className="space-y-6">
            {pending.map(t => (
                <TaskCard 
                    key={t.id} 
                    task={t} 
                    me={me} 
                    onBid={() => {}} 
                    onAward={() => {}} 
                    onComplete={() => {}} 
                    onRate={() => {}} 
                    onPayApartment={() => {}}
                    onDelete={() => onDelete(t)}
                    canDelete={true}
                    onApprove={() => onApprove(t)}
                    onReject={() => onReject(t)}
                />
            ))}
        </div>
    );
}


// --- Dashboard Component ---
interface DashboardProps {
  me: Me;
  notify: (to: string, subject: string) => void;
}
function Dashboard({ me, notify }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    const fetchedTasks = await fakeApi.readTasks();
    setTasks(fetchedTasks);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const save = async (next: Task[]) => {
    setTasks(next);
    await fakeApi.writeTasks(next);
  };
  
   // Auto-award tasks whose bidding time has expired (24h)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            let changed = false;
            const updatedTasks = tasks.map(t => {
                if (t.status === 'open' && t.biddingStartedAt && t.bids.length > 0) {
                    // Changed from 48 to 24 hours
                    const endTime = new Date(t.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000;
                    if (now.getTime() > endTime) {
                        const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                        changed = true;
                        console.log(`Task ${t.id} awarded automatically to ${lowestBid.by}`);
                        
                        // Notify Winner and Council
                        notify(lowestBid.by, `Félicitations ! Vous avez remporté la tâche "${t.title}"`);
                        notify("Conseil Syndical", `Tâche "${t.title}" attribuée à ${lowestBid.by}`);

                        return { ...t, status: 'awarded' as const, awardedTo: lowestBid.by, awardedAmount: lowestBid.amount };
                    }
                }
                return t;
            });
            if (changed) {
                save(updatedTasks);
            }
        }, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [tasks, save, notify]);


  const canDeleteTask = (task: Task) => me.role === 'admin' || (me.role === 'council' && task.status !== 'open');

  const create = async (data: Omit<Task, 'id' | 'status' | 'approvals' | 'rejections' | 'createdBy' | 'createdAt' | 'bids' | 'ratings'>) => {
    const t: Task = { ...data, id: crypto.randomUUID(), status: 'pending', approvals: [], rejections: [], createdBy: me.email, createdAt: new Date().toISOString(), bids: [], ratings: [] };
    if (me.role === 'council' || me.role === 'admin') {
      t.approvals.push({ by: me.email, at: new Date().toISOString() });
    }
    await save([t, ...tasks]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const next = tasks.map(t => (t.id === id ? { ...t, ...updates } : t));
    await save(next);
  };
  
  const addLedger = async (entry: Omit<LedgerEntry, 'at'>) => {
    const current = await fakeApi.readLedger();
    await fakeApi.writeLedger([{...entry, at: new Date().toISOString()}, ...current]);
  };

  const approve = async (task: Task) => {
    if (me.role !== 'council' && me.role !== 'admin') return;
    const approvals = [...(task.approvals || []), { by: me.email, at: new Date().toISOString() }];
    const isNowOpen = approvals.length >= COUNCIL_MIN_APPROVALS;
    const status = isNowOpen ? 'open' : 'pending';
    
    if (isNowOpen) {
        notify("Copropriétaires & CS", `Nouvelle offre disponible : "${task.title}"`);
    }

    await updateTask(task.id, { approvals, status });
  };
  
  // Other handlers
  const reject = async (task: Task) => updateTask(task.id, { status: 'rejected' });
  const deleteTask = async (task: Task) => {
      if(!canDeleteTask(task)) return alert("Action non autorisée.");
      if(window.confirm("Supprimer?")) await save(tasks.filter(t => t.id !== task.id));
  };
  const bid = async (id: string, newBid: Omit<Bid, 'by' | 'at'>) => {
      const task = tasks.find(t => t.id === id);
      if(!task) return;

      const myBidsCount = task.bids.filter(b => b.by === me.email).length;
      const isFirstBidder = task.bids.length > 0 && task.bids[0].by === me.email;
      const canBid = (isFirstBidder && myBidsCount < 2) || (!isFirstBidder && myBidsCount < 1);

      if (!canBid) {
          alert("Vous avez atteint votre limite d'offres pour cette tâche.");
          return;
      }

      const bids = [...task.bids, { ...newBid, by: me.email, at: new Date().toISOString() }];
      const updates: Partial<Task> = { bids };

      if (task.bids.length === 0) {
        updates.biddingStartedAt = new Date().toISOString();
        // Notify on first bid
        notify("Copropriétaires & CS", `Quelqu'un s'est positionné sur "${task.title}"`);
      } else {
        // Notify on new bid
        notify("Copropriétaires & CS", `Nouvelle enchère placée sur "${task.title}"`);
      }

      await updateTask(id, updates);
  };
  const awardLowest = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !task.bids.length) return;
    const low = task.bids.reduce((m, b) => (b.amount < m.amount ? b : m));
    
    notify(low.by, `Félicitations ! Vous avez remporté la tâche "${task.title}"`);
    notify("Conseil Syndical", `Tâche "${task.title}" attribuée manuellement à ${low.by}`);

    await updateTask(id, { status: 'awarded', awardedTo: low.by, awardedAmount: low.amount });
  };
  const completeTask = async (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      notify("Conseil Syndical", `Intervention "${task.title}" terminée. Merci de noter.`);
      
      await updateTask(id, { status: 'completed', completionAt: new Date().toISOString() });
      if (task.scope === 'copro') {
        await addLedger({ taskId: task.id, type: 'charge_credit', payer: 'Copropriété', payee: task.awardedTo!, amount: task.awardedAmount! });
      }
  };
  const rateTask = async (id: string, rating: Omit<Rating, 'at'|'byHash'>) => {
    const byHash = btoa(encodeURIComponent(me.email).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode(parseInt(p1, 16)))).slice(0, 10);
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const ratings = [...(task.ratings || []), { ...rating, byHash, at: new Date().toISOString() }];
    await updateTask(id, { ratings });
  };
   const payApartment = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    alert(`Paiement en ligne simulé: ${t.awardedAmount ?? t.startingPrice} €`);
    await addLedger({ taskId: t.id, type: 'apartment_payment', payer: t.createdBy, payee: t.awardedTo!, amount: t.awardedAmount ?? t.startingPrice});
  };

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    open: tasks.filter(t => t.status === 'open'),
    awarded: tasks.filter(t => t.status === 'awarded'),
    completed: tasks.filter(t => t.status === 'completed'),
    myPending: tasks.filter(t => t.createdBy === me.email && t.status === 'pending')
  };

  const TaskList = ({ taskItems }: { taskItems: Task[] }) => (
    <div className="grid md:grid-cols-2 gap-4">
        {taskItems.map(t => (
            <TaskCard key={t.id} task={t} me={me} onBid={(b) => bid(t.id, b)} onAward={() => awardLowest(t.id)} onComplete={() => completeTask(t.id)} onRate={(r) => rateTask(t.id, r)} onPayApartment={() => payApartment(t.id)} onDelete={() => deleteTask(t)} canDelete={canDeleteTask(t)} />
        ))}
    </div>
  );

  const roleLabel = ROLES.find(r => r.id === me.role)?.label.toUpperCase();

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-700 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Tableau de bord</h1>
          <div className="mt-2">
             <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Connecté en tant que <span className="text-indigo-400">{roleLabel}</span></p>
             <p className="text-2xl text-white font-medium">{me.firstName} {me.lastName}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className="text-sm text-slate-400">{me.email}</span>
            <Button variant="outline" size="sm" onClick={async () => { await fakeApi.logout(); window.location.reload(); }}>🚪 Déconnexion</Button>
        </div>
      </header>
      
      <CreateTaskForm onCreate={create} />

      {/* NEW: User Validation Queue for CS/Admin */}
      {(me.role === 'council' || me.role === 'admin') && (
          <UserValidationQueue notify={notify} />
      )}

      {(me.role === 'council' || me.role === 'admin') && tasksByStatus.pending.length > 0 && (
        <Section title="Tâches à valider" count={tasksByStatus.pending.length}>
          <ValidationQueue me={me} tasks={tasks} onApprove={approve} onReject={reject} onDelete={deleteTask} />
        </Section>
      )}

      {me.role === 'owner' && tasksByStatus.myPending.length > 0 && (
        <Section title="Mes demandes en attente" count={tasksByStatus.myPending.length}>
          <TaskList taskItems={tasksByStatus.myPending} />
        </Section>
      )}

      <Section title="Offres ouvertes" count={tasksByStatus.open.length}>
        {tasksByStatus.open.length ? <TaskList taskItems={tasksByStatus.open} /> : <EmptyState text="Aucune tâche ouverte." />}
      </Section>

      <Section title="Tâches attribuées" count={tasksByStatus.awarded.length}>
        {tasksByStatus.awarded.length ? <TaskList taskItems={tasksByStatus.awarded} /> : <EmptyState text="Aucune tâche attribuée." />}
      </Section>
      
      <Section title="Tâches terminées" count={tasksByStatus.completed.length}>
        {tasksByStatus.completed.length ? <TaskList taskItems={tasksByStatus.completed} /> : <EmptyState text="Aucune tâche terminée." />}
      </Section>
    </div>
  );
}

// --- App Component ---
export default function App() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // Lifted state to share with Directory

  // Lift task fetching to App level so we can pass it to Directory for reviews
  const fetchTasks = useCallback(async () => {
    const fetchedTasks = await fakeApi.readTasks();
    setTasks(fetchedTasks);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const notify = (to: string, subject: string) => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, to, subject }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 py-8 md:py-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">CoproSmart</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">Gérez les petits travaux de votre copropriété, simplement.</p>
        </div>
        <LoginCard onLogin={(u: User) => setUser(u)} />
      </div>
    );
  }

  const me = { email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <ToastContainer toasts={toasts} />
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
                <nav className="sticky top-8 flex flex-col gap-2">
                    <h2 className="font-bold text-lg mb-2 px-2 text-indigo-400">🏢 CoproSmart</h2>
                    <Button variant={tab === "dashboard" ? "secondary" : "ghost"} onClick={() => setTab("dashboard")} className="justify-start">📋 Tâches</Button>
                    <Button variant={tab === "ledger" ? "secondary" : "ghost"} onClick={() => setTab("ledger")} className="justify-start">📒 Écritures</Button>
                    <Button variant={tab === "cgu" ? "secondary" : "ghost"} onClick={() => setTab("cgu")} className="justify-start">📜 CGU</Button>
                    <Button variant={tab === "about" ? "secondary" : "ghost"} onClick={() => setTab("about")} className="justify-start">⚖️ Règles</Button>
                    <Button variant={tab === "directory" ? "secondary" : "ghost"} onClick={() => setTab("directory")} className="justify-start">👥 Annuaire</Button>
                </nav>
            </aside>
            <main className="md:col-span-3">
                {tab === "dashboard" && <Dashboard me={me} notify={notify} />}
                {tab === "ledger" && <Ledger />}
                {tab === "cgu" && <TermsOfService />}
                {tab === "about" && <Governance />}
                {tab === "directory" && <UserDirectory me={me} tasks={tasks} onDataChange={fetchTasks} />}
            </main>
        </div>
      </div>
      <footer className="text-center text-xs text-slate-600 py-6">CoproSmart v0.1.0 - Gestion de copropriété simplifiée</footer>
    </div>
  );
}
