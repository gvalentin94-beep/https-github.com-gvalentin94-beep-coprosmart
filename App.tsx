
import React, { useState, useEffect, useCallback } from 'react';
import type { Me, Task, User, LedgerEntry, TaskCategory, TaskScope, Rating, Bid } from './types';
import { useAuth, fakeApi } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge } from './components/ui';
import { LoginCard } from './components/LoginCard';
import { TaskCard } from './components/TaskCard';
import { COUNCIL_MIN_APPROVALS, CATEGORIES, PlusIcon, ROLES } from './constants';

// --- Governance Component ---
function Governance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>⚖️ Règles de fonctionnement</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-3 text-slate-700">
        <p><b>Validation</b>: Une tâche devient visible pour les enchères après <b>{COUNCIL_MIN_APPROVALS} approbations</b> du Conseil syndical.</p>
        <p><b>Suppression</b>: Un membre du CS ne peut pas supprimer une tâche en offres ouvertes. Seul l'admin peut tout supprimer.</p>
        <p><b>Enchères inversées</b>: Le montant de départ ne peut que diminuer.</p>
         <p><b>Attribution</b>: La tâche est attribuée automatiquement au moins-disant 48h après la première offre, ou manuellement par le créateur.</p>
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
            <CardContent className="prose prose-sm max-w-none text-slate-700 space-y-4">
                <h4 className="font-bold">Préambule : L'esprit CoproSmart</h4>
                <p>CoproSmart est une plateforme conçue pour encourager l'initiative et la participation de chaque copropriétaire à l'entretien de notre résidence. Elle repose sur la confiance, la transparence et la volonté de faire des économies ensemble. En utilisant ce service, vous acceptez de participer activement et de bonne foi à la vie de la copropriété.</p>

                <h4 className="font-bold pt-2 border-t">Article 1 : Proposer une tâche</h4>
                <p>Chaque copropriétaire peut proposer une tâche nécessaire à l'entretien (changer une ampoule, évacuer un encombrant, etc.). La proposition doit être claire, détaillée et inclure un prix de départ juste.</p>

                <h4 className="font-bold pt-2 border-t">Article 2 : Validation par le Conseil Syndical</h4>
                <p>Pour garantir sa pertinence, chaque tâche doit être approuvée par au moins <b>deux membres du Conseil Syndical</b> avant d'être ouverte aux offres.</p>

                <h4 className="font-bold pt-2 border-t">Article 3 : Le système d'enchères</h4>
                <p>Le principe est une enchère inversée : le premier qui se positionne doit proposer un prix inférieur au prix de départ. Les suivants doivent proposer un prix inférieur à l'offre la plus basse. <b>En faisant une offre, vous vous engagez à réaliser la tâche à la date que vous proposez</b> (dans les 30 jours suivants).</p>
                
                <h4 className="font-bold pt-2 border-t">Article 4 : Règle d'attribution automatique</h4>
                <p>Pour dynamiser le processus, un <b>compte à rebours de 48 heures</b> se déclenche dès la première offre. À l'issue de ce délai, la tâche est automatiquement attribuée au copropriétaire ayant fait l'offre la plus basse.</p>
                
                <h4 className="font-bold pt-2 border-t">Article 5 : Règle de participation stratégique</h4>
                <p>Pour garantir l'équité, chaque copropriétaire ne peut faire qu'<b>une seule offre</b> par tâche. <b>Exception</b> : pour récompenser la réactivité, le tout premier copropriétaire à faire une offre a le droit de faire une <b>seconde offre</b> pour s'ajuster.</p>
                
                <h4 className="font-bold pt-2 border-t">Article 6 : Règle de paiement et de rémunération</h4>
                <p>Le montant pour lequel vous remportez une tâche ne vous est pas versé directement. Il sera <b>déduit du montant de vos prochains appels de charges</b>. C'est une manière simple de réduire vos dépenses tout en contribuant à la vie de l'immeuble.</p>

                <h4 className="font-bold pt-2 border-t">Article 7 : Garantie et notation</h4>
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
            <li key={i} className="flex items-center justify-between gap-2 text-sm p-2 rounded-lg bg-slate-50">
              <span>
                <span className="font-mono text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">#{e.taskId.slice(0, 6)}</span>
                <span className="ml-2">{e.payer} → {e.payee}</span>
              </span>
              <span className="font-semibold text-slate-800">{e.amount} €</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// --- EmptyState & Section Components ---
interface EmptyStateProps {
  text: string;
}

function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/60 text-center py-10 px-4">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

interface SectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

function Section({ title, count, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
        <Badge variant="secondary" className="text-base px-3">{count}</Badge>
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
    };

    const handleCreate = () => {
        if (!title.trim() || !startingPrice || Number(startingPrice) <= 0) {
            alert("Titre et prix de départ positif requis.");
            return;
        }
        onCreate({
            title, category, scope, details, location, 
            startingPrice: Number(startingPrice),
            warrantyDays: Number(warrantyDays),
        });
        reset();
        setOpen(false);
    };

    return (
        <div className="mb-4">
            <Button onClick={() => setOpen(v => !v)}>
                <PlusIcon className="h-4 w-4" /> {open ? "Fermer" : "Proposer une tâche"}
            </Button>
            {open && (
                <Card className="mt-4">
                    <CardHeader><CardTitle>Nouvelle tâche pour la copropriété</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label>Titre de la tâche</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Changer ampoule entrée B" /></div>
                            <div className="space-y-1.5"><Label>Catégorie</Label><Select value={category} onChange={e => setCategory(e.target.value as TaskCategory)}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Select></div>
                        </div>
                        <div className="space-y-1.5"><Label>Détails</Label><Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Ampoule E27, échelle nécessaire..." /></div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label>Emplacement</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Hall, entrée B, 1er étage" /></div>
                            <div className="space-y-1.5"><Label>Prix de départ (€)</Label><Input type="number" min="0" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} /></div>
                        </div>
                         <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5"><Label>Garantie (jours)</Label><Input type="number" min="0" value={warrantyDays} onChange={(e) => setWarrantyDays(e.target.value)} /></div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                            <Button onClick={handleCreate}>Créer la tâche</Button>
                        </div>
                    </CardContent>
                </Card>
            )}
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
    if (me.role !== 'council' && me.role !== 'admin') return <EmptyState text="Espace réservé au Conseil syndical." />;
    if (!pending.length) return <EmptyState text="Aucune demande à valider." />;

    return (
        <div className="space-y-4">
            {pending.map(t => (
                <Card key={t.id}>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-base">{t.title}
                          <Badge>{t.approvals?.length || 0}/{COUNCIL_MIN_APPROVALS} approb.</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-slate-600">{t.details}</p>
                        <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => onApprove(t)} disabled={(t.approvals || []).some(a => a.by === me.email)}>✅ Approuver</Button>
                            <Button size="sm" variant="outline" onClick={() => onReject(t)}>❌ Rejeter</Button>
                            <Button size="sm" variant="destructive" onClick={() => onDelete(t)}>🗑️ Supprimer</Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}


// --- Dashboard Component ---
interface DashboardProps {
  me: Me;
}
function Dashboard({ me }: DashboardProps) {
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
  
   // Auto-award tasks whose bidding time has expired
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            let changed = false;
            const updatedTasks = tasks.map(t => {
                if (t.status === 'open' && t.biddingStartedAt && t.bids.length > 0) {
                    const endTime = new Date(t.biddingStartedAt).getTime() + 48 * 60 * 60 * 1000;
                    if (now.getTime() > endTime) {
                        const lowestBid = t.bids.reduce((min, b) => b.amount < min.amount ? b : min, t.bids[0]);
                        changed = true;
                        console.log(`Task ${t.id} awarded automatically to ${lowestBid.by}`);
                        return { ...t, status: 'awarded', awardedTo: lowestBid.by, awardedAmount: lowestBid.amount };
                    }
                }
                return t;
            });
            if (changed) {
                save(updatedTasks);
            }
        }, 5000); // Check every 5 seconds
        return () => clearInterval(interval);
    }, [tasks, save]);


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
    const status = approvals.length >= COUNCIL_MIN_APPROVALS ? 'open' : 'pending';
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
      }

      await updateTask(id, updates);
  };
  const awardLowest = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || !task.bids.length) return;
    const low = task.bids.reduce((m, b) => (b.amount < m.amount ? b : m));
    await updateTask(id, { status: 'awarded', awardedTo: low.by, awardedAmount: low.amount });
  };
  const completeTask = async (id: string) => {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
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

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Connecté: <b>{me.email}</b> ({ROLES.find(r=>r.id === me.role)?.label})</p>
        </div>
        <Button variant="outline" size="sm" onClick={async () => { await fakeApi.logout(); window.location.reload(); }}>🚪 Déconnexion</Button>
      </header>
      
      <CreateTaskForm onCreate={create} />

      {(me.role === 'council' || me.role === 'admin') && tasksByStatus.pending.length > 0 && (
        <Section title="À valider" count={tasksByStatus.pending.length}>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 font-sans p-4 flex flex-col items-center justify-center">
        <div className="text-center space-y-4 py-8 md:py-10">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">CoproSmart</h1>
            <p className="text-slate-300 max-w-2xl mx-auto">Gérez les petits travaux de votre copropriété, simplement.</p>
        </div>
        <LoginCard onLogin={(u: User) => setUser(u)} />
      </div>
    );
  }

  const me = { email: user.email, role: user.role };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <aside className="md:col-span-1">
                <nav className="sticky top-8 flex flex-col gap-2">
                    <h2 className="font-bold text-lg mb-2 px-2">🏢 CoproSmart</h2>
                    <Button variant={tab === "dashboard" ? "secondary" : "ghost"} onClick={() => setTab("dashboard")} className="justify-start">📋 Tâches</Button>
                    <Button variant={tab === "ledger" ? "secondary" : "ghost"} onClick={() => setTab("ledger")} className="justify-start">📒 Écritures</Button>
                    <Button variant={tab === "cgu" ? "secondary" : "ghost"} onClick={() => setTab("cgu")} className="justify-start">📜 CGU</Button>
                    <Button variant={tab === "about" ? "secondary" : "ghost"} onClick={() => setTab("about")} className="justify-start">⚖️ Règles</Button>
                </nav>
            </aside>
            <main className="md:col-span-3">
                {tab === "dashboard" && <Dashboard me={me} />}
                {tab === "ledger" && <Ledger />}
                {tab === "cgu" && <TermsOfService />}
                {tab === "about" && <Governance />}
            </main>
        </div>
      </div>
      <footer className="text-center text-xs text-slate-400 py-6">Prototype CoproSmart</footer>
    </div>
  );
}