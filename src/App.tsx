import React, { useState, useEffect, useCallback } from 'react';
import type { Task, LedgerEntry, User, RegisteredUser, TaskCategory, TaskScope, Bid, Rating } from './types';
import { useAuth, api } from './services/api';
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Input, Textarea, Select, Badge } from './components/ui';
import { TaskCard } from './components/TaskCard';
import { LOCATIONS, CATEGORIES, SCOPES, WARRANTY_OPTIONS, COUNCIL_MIN_APPROVALS, ROLES, AVATARS } from './constants';
import { LoginCard } from './components/LoginCard';

interface Toast { id: string; title: string; message: string; type: 'info' | 'success' | 'error'; }

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto w-72 p-3 rounded shadow-lg border flex justify-between items-start gap-2 ${t.type === 'success' ? 'bg-emerald-900/90 border-emerald-700 text-emerald-100' : t.type === 'error' ? 'bg-rose-900/90 border-rose-700 text-rose-100' : 'bg-slate-800/90 border-slate-700 text-slate-100'}`}>
          <div><h4 className="font-bold text-xs">{t.title}</h4><p className="text-[10px] opacity-90">{t.message}</p></div>
          <button onClick={() => onClose(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

function InfoModal({ title, children, onClose }: { title: string; children?: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
                <CardHeader className="flex justify-between items-center py-3"><CardTitle>{title}</CardTitle><button onClick={onClose}>✕</button></CardHeader>
                <CardContent className="text-sm text-slate-300 space-y-4">{children}</CardContent>
            </Card>
        </div>
    );
}

function SharedFooter() {
    const [showCGU, setShowCGU] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    return (
        <footer className="mt-10 border-t border-slate-800/50 py-6 text-center">
            <div className="flex justify-center gap-4 text-[10px] text-slate-600">
                <button onClick={() => setShowCGU(true)} className="hover:text-slate-400">CGU</button>
                <button onClick={() => setShowMentions(true)} className="hover:text-slate-400">Mentions Légales</button>
            </div>
            <div className="mt-2 text-[10px] text-slate-700 font-bold tracking-tight">simple. local. gagnant-gagnant.</div>
            {showCGU && <InfoModal title="CGU" onClose={() => setShowCGU(false)}><p>Plateforme de mise en relation...</p></InfoModal>}
            {showMentions && <InfoModal title="Mentions" onClose={() => setShowMentions(false)}><p>Editeur: CoproSmart</p></InfoModal>}
        </footer>
    );
}

function Ledger({ entries, usersMap, onDelete, isAdmin }: { entries: LedgerEntry[], usersMap: Record<string, string>, onDelete: (id: string) => void, isAdmin: boolean }) {
  if (entries.length === 0) return <div className="text-center text-slate-500 italic py-10">Aucune transaction.</div>;
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-white tracking-tighter">Comptabilité</h3>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 text-slate-400 uppercase font-bold">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">De</th>
                <th className="p-3">À</th>
                <th className="p-3 text-right">Montant</th>
                {isAdmin && <th className="p-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-slate-700/50">
                  <td className="p-3">{new Date(e.at).toLocaleDateString()}</td>
                  <td className="p-3">
                    {e.type === 'charge_credit' ? <Badge color="emerald">Crédit charges</Badge> : <Badge color="indigo">Paiement</Badge>}
                    <div className="text-[10px] text-slate-500 mt-1">{e.taskTitle}</div>
                  </td>
                  <td className="p-3">{usersMap[e.payer] || e.payer}</td>
                  <td className="p-3">{usersMap[e.payee] || e.payee}</td>
                  <td className="p-3 text-right font-bold font-mono">{e.amount} €</td>
                  {isAdmin && <td className="p-3 text-right"><button onClick={() => e.id && onDelete(e.id)} className="text-rose-500 hover:text-white">✕</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function UserDirectory({ users, tasks, me, onBan, onRestore, onUpdateUser, onDeleteRating, onInviteUser, onDeleteUser }: { users: RegisteredUser[], tasks: Task[], me: User, onBan: (e:string)=>void, onRestore: (e:string)=>void, onUpdateUser: (e:string, u:any)=>void, onDeleteRating: (t:string, i:number)=>void, onInviteUser: (e:string)=>void, onDeleteUser: (e:string)=>void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  const filtered = users.filter(u => 
    (u.firstName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (u.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <h3 className="text-xl font-black text-white tracking-tighter">Annuaire</h3>
        <div className="text-xs text-slate-400">{users.length} membres</div>
      </div>

      {['admin', 'council'].includes(me.role) && (
        <Card className="p-4 bg-indigo-900/10 border-indigo-900/50">
          <h4 className="font-bold text-indigo-400 mb-2 text-sm">Inviter un voisin</h4>
          <div className="flex gap-2">
            <Input 
              placeholder="email@voisin.com" 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)} 
              className="!bg-slate-900 !border-slate-700 !text-white h-9 text-xs"
            />
            <Button size="sm" onClick={() => { onInviteUser(inviteEmail); setInviteEmail(""); }} className="bg-indigo-600 h-9">Envoyer</Button>
          </div>
        </Card>
      )}

      <Input 
        placeholder="Rechercher..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)}
        className="!bg-slate-800 border-slate-700 text-white"
      />

      <div className="grid gap-3">
        {filtered.map(u => (
          <Card key={u.id} className="flex items-center p-3 gap-3 bg-slate-800 border-slate-700">
            <div className="text-2xl bg-slate-700 rounded-full w-10 h-10 flex items-center justify-center">
              {u.avatar || AVATARS[Math.abs(u.email.length) % AVATARS.length]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate">{u.firstName} {u.lastName}</span>
                {u.role === 'admin' && <Badge className="bg-rose-600 text-[10px]">Admin</Badge>}
                {u.role === 'council' && <Badge className="bg-amber-500 text-slate-900 text-[10px]">Conseil</Badge>}
              </div>
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
            </div>
            {me.role === 'admin' && u.id !== me.id && (
              <div className="flex gap-2">
                {u.status === 'deleted' ? 
                  <Button size="sm" onClick={() => onRestore(u.email)} className="bg-emerald-600 h-7 text-[10px]">Restaurer</Button> :
                  <Button size="sm" onClick={() => onBan(u.email)} variant="destructive" className="h-7 text-[10px]">Bannir</Button>
                }
                <Button size="sm" onClick={() => onDeleteUser(u.email)} variant="ghost" className="text-rose-500 h-7 text-[10px]">Suppr.</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateTaskPage({ onBack, onCreate }: { onBack: () => void, onCreate: (task: any) => void }) {
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState<TaskCategory>("ampoule");
    const [scope, setScope] = useState<TaskScope>("copro");
    const [details, setDetails] = useState("");
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [startingPrice, setStartingPrice] = useState("");
    const [warrantyDays, setWarrantyDays] = useState("0");
    const [photo, setPhoto] = useState<string | undefined>(undefined);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!title.trim() || !startingPrice) return alert("Titre et prix obligatoires");
        onCreate({ title, category, scope, details, location, startingPrice: Number(startingPrice), warrantyDays: Number(warrantyDays), photo });
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
             <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" onClick={onBack} className="pl-0 text-slate-400 hover:text-white text-xs">← Retour</Button>
                <h2 className="text-xl font-black text-white tracking-tight">Nouvelle tâche</h2>
                <Button size="sm" onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white">Publier</Button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>Titre</Label>
                        <Input placeholder="Ex: Ampoule hall" value={title} onChange={e => setTitle(e.target.value)} className="!bg-white !text-slate-900 font-bold" />
                    </div>
                    
                    <div className="space-y-1">
                        <Label>Catégorie</Label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setCategory(cat.id as TaskCategory)} className={`px-2 py-1 rounded text-xs font-bold transition-all border ${category === cat.id ? 'bg-white text-slate-900 border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Concerne</Label>
                        <div className="flex flex-wrap gap-2">
                            {SCOPES.map(s => (
                                <button key={s.id} onClick={() => setScope(s.id as TaskScope)} className={`px-2 py-1 rounded text-xs font-bold transition-all border ${scope === s.id ? 'bg-white text-slate-900 border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Description</Label>
                        <Textarea placeholder="Détails..." value={details} onChange={e => setDetails(e.target.value)} className="!bg-white !text-slate-900 h-24 text-xs" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Emplacement</Label>
                            <Select value={location} onChange={e => setLocation(e.target.value)} className="!bg-white !text-slate-900 h-9 py-1 text-xs">
                                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Prix (€)</Label>
                            <Input type="number" placeholder="15" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} className="!bg-white !text-slate-900 h-9 font-mono font-bold" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Garantie</Label>
                        <div className="flex flex-wrap gap-2">
                            {WARRANTY_OPTIONS.map(w => (
                                <button key={w.val} onClick={() => setWarrantyDays(w.val)} className={`px-2 py-1 rounded text-xs font-bold transition-all border ${warrantyDays === w.val ? 'bg-white text-slate-900 border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label>Photo</Label>
                        <div className="border border-dashed border-slate-700 rounded p-2 flex items-center justify-center text-slate-500 hover:bg-slate-800 cursor-pointer h-20 relative">
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0" />
                            {photo ? <img src={photo} alt="Preview" className="h-full rounded" /> : <span className="text-xs">📷 Ajouter</span>}
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}

function UserValidationQueue({ pendingUsers, onApprove, onReject }: { pendingUsers: RegisteredUser[], onApprove: (email: string) => void, onReject: (email: string) => void }) {
    const [processing, setProcessing] = useState<string | null>(null);
    const handleAction = async (email: string, action: 'approve' | 'reject') => {
        setProcessing(email);
        try { action === 'approve' ? await onApprove(email) : await onReject(email); } catch (e) { alert("Erreur"); } finally { setProcessing(null); }
    };
    if (!pendingUsers.length) return null;
    return (
        <Card className="mb-6 border-amber-900/50 bg-amber-950/10">
            <CardHeader className="py-2"><CardTitle className="text-sm text-amber-500">Inscriptions en attente ({pendingUsers.length})</CardTitle></CardHeader>
            <CardContent className="py-2 space-y-2">
                {pendingUsers.map(u => (
                    <div key={u.email} className="flex justify-between items-center bg-slate-900/50 p-2 rounded border border-slate-800">
                        <span className="text-xs text-slate-300">{u.firstName} {u.lastName} ({u.email})</span>
                        <div className="flex gap-2">
                            <Button size="sm" className="h-6 text-[10px] bg-emerald-600" onClick={() => handleAction(u.email, 'approve')}>Accepter</Button>
                            <Button size="sm" variant="destructive" className="h-6 text-[10px]" onClick={() => handleAction(u.email, 'reject')}>Refuser</Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingUsers, setPendingUsers] = useState<RegisteredUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<RegisteredUser[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [currentView, setCurrentView] = useState<'home' | 'create-task' | 'directory' | 'ledger'>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const loadData = useCallback(async () => {
    try {
        const [t, l, p, d, all] = await Promise.all([api.readTasks(), api.readLedger(), api.getPendingUsers(), api.getDirectory(), api.getAllUsers()]);
        const map: Record<string, string> = {};
        all.forEach(u => map[u.email] = (u.firstName && u.lastName) ? `${u.firstName} ${u.lastName}` : u.email);
        setUsersMap(map); setTasks(t); setLedger(l); setPendingUsers(p); setDirectoryUsers(d);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { loadData(); const i = setInterval(loadData, 5000); return () => clearInterval(i); }, [loadData]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleCreateTask = async (d: any) => { try { const id = await api.createTask({...d, status:'pending'}, user.id); if(['council','admin'].includes(user.role)) await api.addApproval(id, user.id); setCurrentView('home'); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  const handleApprove = async (id: string) => { try { await api.addApproval(id, user.id); const t = tasks.find(x=>x.id===id); if (user.role==='admin' || (t && t.approvals.length+1 >= COUNCIL_MIN_APPROVALS)) await api.updateTaskStatus(id, 'open', {biddingStartedAt: null}); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  const handleReject = async (id: string) => { try { await api.addRejection(id, user.id); await api.updateTaskStatus(id, 'rejected'); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  const onBidWrapper = async (id: string, b: any) => { try { await api.addBid(id, b, user.id); const t=tasks.find(x=>x.id===id); if(!t?.biddingStartedAt) await api.updateTaskStatus(id, 'open', {biddingStartedAt: new Date().toISOString()}); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  const handleAward = async (id: string) => { try { const t=tasks.find(x=>x.id===id); if(!t?.bids.length) return; const w = t.bids.reduce((m,b)=>b.amount<m.amount?b:m, t.bids[0]); await api.updateTaskStatus(id, 'awarded', {awardedTo: w.userId, awardedAmount: w.amount}); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  const handleComplete = async (id: string) => { try { const t=tasks.find(x=>x.id===id); if(!t) return; await api.updateTaskStatus(id, 'completed', {validatedBy: user.id}); await api.createLedgerEntry({taskId: id, type: t.scope==='copro'?'charge_credit':'apartment_payment', payerId: t.scope==='copro'?null:t.createdById, payeeId: t.awardedToId, amount: t.awardedAmount}); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  const handleRate = async (id: string, r: any) => { try { await api.addRating(id, r, user.id); loadData(); } catch(e:any){ addToast("Erreur", e.message, "error"); }};
  
  const handleBanUser = async(e:string)=>{try{await api.updateUserStatus(e,'deleted');loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleRestoreUser = async(e:string)=>{try{await api.updateUserStatus(e,'active');loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleDeleteUser = async(e:string)=>{try{await api.deleteUserProfile(e);loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleUpdateUser = async(e:string,u:any)=>{try{await api.updateUser(e,u);loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleInviteUser = async(e:string)=>{try{await api.inviteUser(e,`${user.firstName} ${user.lastName}`);addToast("Envoyé","Invitation partie","success");}catch(x:any){addToast("Err",x.message,"error")}}
  const handleDeleteRating = async(t:string,i:number)=>{try{await api.deleteRating(t,i,user.id);loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleDeleteTask = async(id:string)=>{try{if(user.role!=='admin')throw new Error('Admin only');await api.deleteTask(id);loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleRequestVerification = async(id:string)=>{try{await api.updateTaskStatus(id,'verification');loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleRejectWork = async(id:string)=>{try{await api.updateTaskStatus(id,'awarded');loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleApproveUser = async(e:string)=>{try{await api.approveUser(e);loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleRejectUser = async(e:string)=>{try{await api.rejectUser(e);loadData();}catch(x:any){addToast("Err",x.message,"error")}}
  const handleDeleteLedger = async (id: string) => { try { await api.deleteLedgerEntry(id); loadData(); } catch (e: any) { addToast("Erreur", e.message, "error"); } };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const openTasks = tasks.filter(t => t.status === 'open');
  const progressTasks = tasks.filter(t => ['awarded','verification'].includes(t.status));
  const historyTasks = tasks.filter(t => ['completed','rejected'].includes(t.status));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-10">
      <ToastContainer toasts={toasts} onClose={id => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 h-14 flex items-center px-4 justify-between">
         <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <h1 className="text-lg font-black text-white tracking-tighter">CoproSmart.</h1>
         </div>
         {currentView !== 'create-task' && (
             <div className="flex items-center gap-2">
                 <div className="hidden md:flex gap-2 mr-4">
                    <Button size="sm" variant={currentView === 'home' ? 'secondary' : 'ghost'} onClick={() => setCurrentView('home')}>Accueil</Button>
                    <Button size="sm" variant={currentView === 'directory' ? 'secondary' : 'ghost'} onClick={() => setCurrentView('directory')}>Annuaire</Button>
                    {['admin','council'].includes(user.role) && <Button size="sm" variant={currentView === 'ledger' ? 'secondary' : 'ghost'} onClick={() => setCurrentView('ledger')}>Compta</Button>}
                 </div>
                 <div className="text-right leading-tight mr-2">
                     <div className="text-xs font-bold text-white">{user.firstName}</div>
                     <div className="text-[10px] text-slate-500">{ROLES.find(r => r.id === user.role)?.label}</div>
                 </div>
                 <Button size="sm" variant="ghost" onClick={() => {api.logout(); onLogout();}}>✕</Button>
                 <Button size="sm" className="bg-indigo-600 text-white h-8 text-xs" onClick={() => setCurrentView('create-task')}>+ Tâche</Button>
             </div>
         )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {currentView === 'create-task' ? <CreateTaskPage onBack={() => setCurrentView('home')} onCreate={handleCreateTask} /> :
         currentView === 'directory' ? (
             <UserDirectory users={directoryUsers} tasks={tasks} me={user} onBan={handleBanUser} onRestore={handleRestoreUser} onUpdateUser={handleUpdateUser} onDeleteRating={handleDeleteRating} onInviteUser={handleInviteUser} onDeleteUser={handleDeleteUser} />
         ) :
         currentView === 'ledger' ? <Ledger entries={ledger} usersMap={usersMap} onDelete={handleDeleteLedger} isAdmin={user.role === 'admin'} /> :
         (
             <div className="space-y-8">
                 {pendingTasks.length > 0 && (
                     <section>
                         <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">En attente ({pendingTasks.length})</h3>
                         <div className="grid gap-2">{pendingTasks.map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={()=>{}} onAward={()=>{}} onComplete={()=>{}} onRate={()=>{}} onPayApartment={()=>{}} onDelete={()=>handleDeleteTask(t.id)} canDelete={user.role==='admin'} onApprove={['admin','council'].includes(user.role)?()=>handleApprove(t.id):undefined} onReject={['admin','council'].includes(user.role)?()=>handleReject(t.id):undefined} />)}</div>
                     </section>
                 )}
                 
                 {['admin','council'].includes(user.role) && pendingUsers.length > 0 && <UserValidationQueue pendingUsers={pendingUsers} onApprove={handleApproveUser} onReject={handleRejectUser} />}

                 <section>
                     <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Offres ouvertes</h3>
                     {openTasks.length === 0 ? <p className="text-xs text-slate-500 italic">Rien à signaler.</p> : 
                     <div className="grid gap-2">{openTasks.map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={(b)=>onBidWrapper(t.id,b)} onAward={()=>handleAward(t.id)} onComplete={()=>{}} onRate={()=>{}} onPayApartment={()=>{}} onDelete={()=>handleDeleteTask(t.id)} canDelete={user.role==='admin'} />)}</div>}
                 </section>

                 <section>
                     <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2">Travaux en cours</h3>
                     {progressTasks.length === 0 ? <p className="text-xs text-slate-500 italic">Aucun chantier.</p> :
                     <div className="grid gap-2">{progressTasks.map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={()=>{}} onAward={()=>{}} onComplete={()=>handleComplete(t.id)} onRate={()=>{}} onPayApartment={()=>{}} onDelete={()=>handleDeleteTask(t.id)} canDelete={user.role==='admin'} onRequestVerification={()=>handleRequestVerification(t.id)} onRejectWork={()=>handleRejectWork(t.id)} />)}</div>}
                 </section>

                 {historyTasks.length > 0 && (
                     <section>
                         <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-2">Terminés</h3>
                         <div className="grid gap-2 opacity-75 hover:opacity-100 transition-opacity">{historyTasks.map(t => <TaskCard key={t.id} task={t} me={user} usersMap={usersMap} onBid={()=>{}} onAward={()=>{}} onComplete={()=>{}} onRate={(r)=>handleRate(t.id,r)} onDeleteRating={handleDeleteRating} onPayApartment={()=>{}} onDelete={()=>handleDeleteTask(t.id)} canDelete={user.role==='admin'} />)}</div>
                     </section>
                 )}
             </div>
         )}
      </main>
      <SharedFooter />
    </div>
  );
}

function App() {
  const { user, setUser, loading } = useAuth();
  const [showRecovery, setShowRecovery] = useState(false);
  useEffect(() => { const { data } = api.onPasswordRecovery(() => setShowRecovery(true)); return () => data.subscription.unsubscribe(); }, []);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-xs">Chargement...</div>;
  if (showRecovery) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Card className="w-80 bg-slate-900 border-slate-700"><CardHeader><CardTitle>Nouveau mot de passe</CardTitle></CardHeader><CardContent><Input type="password" id="new-pwd" placeholder="******" className="mb-2"/><Button onClick={async()=>{try{await api.updateUser('rec',{password:(document.getElementById('new-pwd')as HTMLInputElement).value});setShowRecovery(false);window.location.href="/";}catch(e:any){alert(e.message)}}}>Valider</Button></CardContent></Card></div>;
  if (!user) return <LoginCard onLogin={setUser} />;
  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}

export default App;