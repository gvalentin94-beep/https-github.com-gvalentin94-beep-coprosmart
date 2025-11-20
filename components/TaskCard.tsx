
import React, { useState, useEffect } from 'react';
import type { Task, User, Rating, Bid } from '../types';
import { Button, Card, Input, Label, Badge, Textarea } from './ui';
import { CATEGORIES, TASK_STATUS_CONFIG, COUNCIL_MIN_APPROVALS } from '../constants';

// --- Sub-components defined in the same file to keep file count low ---

const statusClasses: { [key: string]: { border: string; text: string; bg: string } } = {
    amber: { border: 'border-amber-500/50', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    indigo: { border: 'border-indigo-500/50', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    sky: { border: 'border-sky-500/50', text: 'text-sky-400', bg: 'bg-sky-500/10' },
    emerald: { border: 'border-emerald-500/50', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    rose: { border: 'border-rose-500/50', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    fuchsia: { border: 'border-fuchsia-500/50', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
};

interface BidBoxProps {
    task: Task;
    onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
}

function BidBox({ task, onBid }: BidBoxProps) {
    const hasBids = task.bids?.length > 0;
    const currentPrice = hasBids ? Math.min(...task.bids.map(b => b.amount)) : task.startingPrice;
    
    const [amount, setAmount] = useState(String(Math.floor(currentPrice - 1)));
    const [note, setNote] = useState("");
    
    // Default date logic: Tomorrow
    const getTomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };
    
    const [plannedExecutionDate, setPlannedExecutionDate] = useState(getTomorrow());

    useEffect(() => {
        // Default to current price - 1, ensuring it's an integer
        const nextVal = currentPrice > 1 ? Math.floor(currentPrice - 1) : 1;
        setAmount(String(nextVal));
    }, [currentPrice, task.id]);

    const handleBid = () => {
        const val = Number(amount);
        if (!Number.isInteger(val)) {
            alert("Le montant doit être un nombre entier (pas de centimes).");
            return;
        }
        if (!val || val <= 0) {
            alert("Le montant doit être strictement positif.");
            return;
        }
        if (val >= currentPrice) {
            alert(`Pour vous positionner, votre offre doit être strictement inférieure à ${currentPrice} €.`);
            return;
        }
        if (!plannedExecutionDate) {
            alert("Veuillez indiquer une date de réalisation.");
            return;
        }
        onBid({ amount: val, note, plannedExecutionDate });
        setNote("");
        setPlannedExecutionDate(getTomorrow());
    };

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    return (
        <div className="border border-slate-700 rounded-xl p-4 space-y-4 bg-slate-900/50 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Faire une offre</div>
                <div className="text-xs text-slate-400">
                    Départ: <b className="text-slate-300">{task.startingPrice} €</b>
                    {hasBids && <> • Actuelle: <b className="text-indigo-400">{currentPrice} €</b></>}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                    <Label className="mb-1">Montant (€)</Label>
                    <Input
                        type="number"
                        min="1"
                        max={currentPrice - 1}
                        step="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="font-bold text-indigo-600"
                    />
                </div>
                <div className="sm:col-span-5">
                    <Label className="mb-1">Date d'intervention</Label>
                    <Input
                        type="date"
                        value={plannedExecutionDate}
                        onChange={(e) => setPlannedExecutionDate(e.target.value)}
                        min={today}
                        max={maxDateStr}
                        className="bg-white text-slate-900"
                    />
                </div>
                <div className="sm:col-span-4">
                     <Label className="mb-1">Message (Optionnel)</Label>
                     <Input
                        placeholder="..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                </div>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20" onClick={handleBid} disabled={!amount || Number(amount) <= 0 || Number(amount) >= currentPrice || !plannedExecutionDate}>
                🚀 Se positionner
            </Button>
        </div>
    );
}


interface RatingBoxProps {
    onSubmit: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
}

function RatingBox({ onSubmit }: RatingBoxProps) {
    const [open, setOpen] = useState(false);
    const [stars, setStars] = useState(5);
    const [comment, setComment] = useState("");

    if (!open) {
        return (
            <Button size="sm" variant="outline" className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-slate-500" onClick={() => setOpen(true)}>
                ⭐ Noter l'intervention
            </Button>
        );
    }

    return (
        <div className="border border-slate-700 rounded-xl p-4 space-y-3 bg-slate-900/50">
            <div className="space-y-1">
                <Label>Note (1 à 5)</Label>
                <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => setStars(s)} className={`text-2xl transition-transform hover:scale-110 ${s <= stars ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</button>
                    ))}
                </div>
            </div>
            <div className="space-y-1">
                <Label>Commentaire</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Intervention rapide et soignée..." className="bg-slate-950 border-slate-800" />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                <Button size="sm" onClick={() => { onSubmit({ stars, comment }); setOpen(false); }}>Envoyer avis</Button>
            </div>
        </div>
    );
}

function Countdown({ startedAt }: { startedAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            const endTime = new Date(startedAt).getTime() + 24 * 60 * 60 * 1000;
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                setTimeLeft("Terminé");
                clearInterval(interval);
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    if (!timeLeft || timeLeft === "Terminé") return null;

    return (
        <div className="bg-indigo-900/30 border border-indigo-800/50 text-indigo-200 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 justify-center shadow-sm">
            <span className="animate-pulse">⏳</span> 
            <span>Attribution automatique dans :</span>
            <b className="font-mono text-white tracking-widest">{timeLeft}</b>
        </div>
    );
}


// --- Main TaskCard Component ---

interface TaskCardProps {
  task: Task;
  me: User;
  usersMap?: Record<string, string>; 
  onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
  onAward: () => void;
  onComplete: () => void;
  onRate: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
  onDeleteRating?: (taskId: string, ratingIndex: number) => void;
  onPayApartment: () => void;
  onDelete: () => void;
  canDelete: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestVerification?: () => void;
  onRejectWork?: () => void;
  key?: React.Key;
}

export function TaskCard({ task, me, usersMap, onBid, onAward, onComplete, onRate, onDeleteRating, onPayApartment, onDelete, canDelete, onApprove, onReject, onRequestVerification, onRejectWork }: TaskCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const categoryInfo = CATEGORIES.find(c => c.id === task.category);
    const lowestBid = task.bids?.length > 0 ? task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]) : null;

    const warrantyUntil = task.completionAt && task.warrantyDays
        ? new Date(new Date(task.completionAt).getTime() + task.warrantyDays * 24 * 3600 * 1000)
        : null;

    const style = statusClasses[statusConfig.color] || { border: 'border-slate-600', text: 'text-slate-400', bg: 'bg-slate-800' };
    
    // Accordion Visuals
    const borderClass = `border-l-[6px] ${style.border}`;

    const myBidsCount = task.bids.filter(b => b.by === me.email).length;
    const isFirstBidder = task.bids.length > 0 && task.bids[0].by === me.email;
    const canBid = (isFirstBidder && myBidsCount < 2) || (!isFirstBidder && myBidsCount < 1);
    const hasApproved = task.approvals?.some(a => a.by === me.email);

    const isTimerRunning = task.biddingStartedAt 
        ? (new Date().getTime() < new Date(task.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000)
        : false;
    
    const isAdmin = me.role === 'admin';
    const canVerify = isAdmin || me.role === 'council';
    
    const canManualAward = task.status === "open" && task.bids?.length > 0 && lowestBid && ((task.createdBy === me?.email && !isTimerRunning) || isAdmin);
    const awardedToName = task.awardedTo && usersMap ? (usersMap[task.awardedTo] || task.awardedTo) : task.awardedTo;
    const hasRated = task.ratings?.some(r => r.byHash === me.id);
    const isAssignee = task.awardedTo === me.email;

    const BidArea = () => {
        if (task.status !== 'open' || me?.role !== 'owner') return null;
        if (canBid) return <BidBox task={task} onBid={onBid} />;
        return (
            <div className="bg-slate-900/50 border border-slate-800 text-slate-400 p-4 rounded-xl text-sm text-center italic">
                {isFirstBidder ? "Vous avez utilisé vos 2 offres." : "Vous avez déjà fait une offre."}
            </div>
        );
    }

    // Price logic
    let displayPrice = task.startingPrice;
    if (lowestBid) displayPrice = lowestBid.amount;
    if (task.awardedAmount) displayPrice = task.awardedAmount;

    return (
        <Card className={`transition-all duration-300 ${borderClass} ${isOpen ? 'ring-1 ring-indigo-500/30 shadow-xl bg-slate-800' : 'hover:bg-slate-800/80 cursor-pointer bg-slate-800/40 border-t border-b border-r border-slate-800'}`} padding="none">
            
            {/* HEADER (Folded View) */}
            <div className="flex items-center justify-between p-4" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${style.text} ${style.bg}`}>
                        {React.cloneElement(statusConfig.icon, { className: 'h-5 w-5' })}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-white truncate">{task.title}</h3>
                            {categoryInfo && <span className="text-xs opacity-50 grayscale">{React.cloneElement(categoryInfo.icon, { className: "h-3 w-3 inline" })}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                             <span className="hidden sm:inline font-medium">{usersMap?.[task.createdBy] || task.createdBy}</span>
                             <span className="hidden sm:inline">•</span>
                             <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                             <span>• {task.location}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 pl-2">
                    <div className="text-right">
                        <div className="font-mono font-bold text-lg text-white tracking-tight">{displayPrice}€</div>
                        {task.status === 'open' && <div className="text-[10px] text-slate-500 uppercase font-bold">Offre actuelle</div>}
                    </div>
                    <div className={`transform transition-transform duration-300 text-slate-600 ${isOpen ? 'rotate-180' : ''}`}>▼</div>
                </div>
            </div>

            {/* CONTENT (Unfolded) */}
            {isOpen && (
                <div className="p-5 border-t border-slate-700/50 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    
                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2 text-xs">
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700">📍 {task.location}</Badge>
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700">🛡️ Garantie {task.warrantyDays}j</Badge>
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700">{task.scope === 'copro' ? '🏢 Communs' : '🏠 Privatif'}</Badge>
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700">📂 {categoryInfo?.label}</Badge>
                    </div>

                    {/* Photo & Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {task.photo && (
                            <div className="md:col-span-1 aspect-video rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-sm">
                                <img src={task.photo} alt="Photo" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        )}
                        <div className={`${task.photo ? 'md:col-span-2' : 'md:col-span-3'}`}>
                             {task.details ? (
                                 <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-800">{task.details}</p>
                             ) : (
                                 <p className="text-sm text-slate-500 italic">Aucune description détaillée.</p>
                             )}
                        </div>
                    </div>

                    {/* Countdown */}
                    {task.biddingStartedAt && task.status === 'open' && <Countdown startedAt={task.biddingStartedAt} />}

                    {/* Awarded Info */}
                    {task.awardedTo && (
                        <div className="bg-sky-900/20 border border-sky-800/50 text-sky-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🤝</span>
                                <div>
                                    <div className="font-bold text-sm">Attribuée à {awardedToName}</div>
                                    <div className="text-xs opacity-70">Montant final : {task.awardedAmount}€</div>
                                </div>
                            </div>
                            {task.awardedTo === me.email && (task.status === 'awarded' || task.status === 'verification') && (
                                <Badge className="bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 py-1 px-3">👉 À faire par vous</Badge>
                            )}
                        </div>
                    )}

                    {/* Bids List */}
                    {task.status === 'open' && task.bids?.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1">Offres en cours ({task.bids.length})</h4>
                            <ul className="space-y-2">
                                {task.bids.slice().sort((a,b) => a.amount - b.amount).map((b, i) => {
                                    const bidderName = usersMap ? (usersMap[b.by] || b.by) : b.by;
                                    return (
                                        <li key={i} className={`flex justify-between items-center text-sm p-3 rounded-lg border ${i === 0 ? 'bg-indigo-900/20 border-indigo-500/30 text-indigo-200' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                                            <div>
                                                <span className="font-bold mr-2">{b.amount} €</span> 
                                                <span className="text-xs opacity-70">par {bidderName}</span>
                                            </div>
                                            <div className="text-xs opacity-50">{new Date(b.plannedExecutionDate).toLocaleDateString()}</div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    <BidArea />

                    {/* ACTIONS: Award */}
                    {canManualAward && lowestBid && (
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6" onClick={onAward}>
                            {isAdmin && isTimerRunning ? `⚡ Admin: Attribuer maintenant (${lowestBid.amount} €)` : `✅ Clore les enchères (${lowestBid.amount} €)`}
                        </Button>
                    )}

                    {/* ACTIONS: Worker */}
                    {task.status === "awarded" && task.awardedTo === me.email && onRequestVerification && (
                         <Button className="w-full py-6 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold shadow-lg" onClick={onRequestVerification}>
                            🏁 J'ai fini (Demander validation)
                         </Button>
                    )}

                    {/* ACTIONS: Verify (CS/Admin) */}
                    {task.status === "verification" && (
                         <div className="bg-fuchsia-900/20 border border-fuchsia-800/50 p-4 rounded-xl space-y-4">
                            <div className="flex items-center gap-3 text-fuchsia-300 font-bold">
                                <span className="text-2xl">🕵️</span> Contrôle qualité requis
                            </div>
                            <p className="text-sm text-slate-400">Le copropriétaire déclare avoir terminé. Merci de vérifier le travail.</p>
                            
                            {canVerify && onRejectWork ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Button className="bg-emerald-600 hover:bg-emerald-500 border-none text-white py-6" onClick={onComplete}>✅ Valider & Payer</Button>
                                    <Button variant="destructive" className="py-6" onClick={onRejectWork}>❌ Refuser</Button>
                                </div>
                            ) : (
                                <div className="text-xs italic text-slate-500 text-center">En attente de validation par le CS.</div>
                            )}
                        </div>
                    )}
                    
                    {/* COMPLETED INFO */}
                    {task.status === "completed" && (
                        <div className="space-y-4">
                            <div className="bg-emerald-900/20 border border-emerald-800/50 text-emerald-200 p-4 rounded-xl text-sm space-y-2">
                                <div className="font-bold flex items-center gap-2">✅ Terminé & Validé</div>
                                {task.validatedBy && <div className="text-xs opacity-80">Contrôle qualité validé par : {usersMap?.[task.validatedBy] || task.validatedBy}</div>}
                                {warrantyUntil && <div className="text-xs opacity-80">Garantie active jusqu'au : {warrantyUntil.toLocaleDateString()}</div>}
                            </div>
                            
                            {/* Ratings */}
                            <div className="border-t border-slate-800 pt-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Avis & Commentaires</div>
                                {task.ratings && task.ratings.length > 0 ? (
                                    <div className="space-y-3">
                                        {task.ratings.map((rating, i) => (
                                            <div key={i} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 flex justify-between group">
                                                <div>
                                                    <div className="text-amber-400 text-xs tracking-widest mb-1">{Array(rating.stars).fill('⭐').join('')}</div>
                                                    <p className="text-slate-300 text-sm italic">"{rating.comment}"</p>
                                                </div>
                                                {canVerify && onDeleteRating && (
                                                    <button onClick={() => onDeleteRating(task.id, i)} className="text-slate-700 hover:text-rose-500 transition-colors" title="Supprimer">🗑️</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : ( <div className="text-sm text-slate-600 italic">Aucun avis laissé.</div> )}

                                {!hasRated && !isAssignee ? <div className="mt-4"><RatingBox onSubmit={onRate} /></div> : null}
                            </div>
                        </div>
                    )}
                    
                    {/* PENDING VALIDATION */}
                    {task.status === "pending" && (
                         <div className="bg-amber-900/20 border border-amber-800/50 text-amber-200 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 font-bold">
                                <span>⏳ Validation requise</span>
                                <Badge className="ml-auto bg-amber-900 text-amber-200 border-amber-700">{task.approvals?.length || 0} / {COUNCIL_MIN_APPROVALS}</Badge>
                            </div>
                            {onApprove && onReject ? (
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <Button className="bg-emerald-600 hover:bg-emerald-500 border-none text-white py-2" onClick={onApprove} disabled={hasApproved && !isAdmin}>
                                        {isAdmin ? '⚡ Forcer (Admin)' : '✅ Valider'}
                                    </Button>
                                    <Button variant="destructive" onClick={onReject}>❌ Rejeter</Button>
                                </div>
                            ) : ( <div className="text-xs opacity-60 italic">En attente du Conseil Syndical.</div> )}
                        </div>
                    )}

                    {/* DELETE */}
                    {canDelete && (
                        <div className="flex justify-center pt-2">
                            <Button size="sm" variant="ghost" className="text-slate-600 hover:text-rose-500 hover:bg-rose-950" onClick={onDelete}>🗑️ Supprimer cette tâche (Admin)</Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
