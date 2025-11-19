
import React, { useState, useEffect } from 'react';
import type { Task, User, Rating, Bid } from '../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Badge, Textarea } from './ui';
import { CATEGORIES, TASK_STATUS_CONFIG, COUNCIL_MIN_APPROVALS } from '../constants';

// --- Sub-components defined in the same file to keep file count low ---

const statusClasses: { [key: string]: { border: string; text: string } } = {
    amber: { border: 'border-amber-500/50', text: 'text-amber-400' },
    indigo: { border: 'border-indigo-500/50', text: 'text-indigo-400' },
    sky: { border: 'border-sky-500/50', text: 'text-sky-400' },
    emerald: { border: 'border-emerald-500/50', text: 'text-emerald-400' },
    rose: { border: 'border-rose-500/50', text: 'text-rose-400' },
    fuchsia: { border: 'border-fuchsia-500/50', text: 'text-fuchsia-400' },
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
        // Reset date to tomorrow
        setPlannedExecutionDate(getTomorrow());
    };

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    return (
        <div className="border border-slate-700 rounded-xl p-3 space-y-3 bg-slate-800/50">
            <div>
                <div className="text-xs text-slate-300 font-medium mb-1">Faire une offre (enchère inversée)</div>
                 <p className="text-xs text-slate-400">
                    Départ: <b className="text-slate-200">{task.startingPrice} €</b>
                    {hasBids && <> • Actuelle: <b className="text-indigo-400">{currentPrice} €</b></>}
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                    className="col-span-1"
                    type="number"
                    min="1"
                    max={currentPrice - 1}
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <Input
                    className="col-span-2"
                    placeholder="Message (optionnel)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>
             <div className="space-y-1.5">
              <Label>Date de réalisation prévue</Label>
              <Input
                type="date"
                value={plannedExecutionDate}
                onChange={(e) => setPlannedExecutionDate(e.target.value)}
                min={today}
                max={maxDateStr}
                className="w-full sm:w-auto bg-white text-slate-900"
              />
            </div>
            <Button size="sm" onClick={handleBid} disabled={!amount || Number(amount) <= 0 || Number(amount) >= currentPrice || !plannedExecutionDate}>
                Se positionner
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
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                ⭐ Noter l'intervention
            </Button>
        );
    }

    return (
        <div className="border border-slate-700 rounded-xl p-3 space-y-3 bg-slate-800/50">
            <div className="space-y-1">
                <Label>Note (1 à 5)</Label>
                <Input type="number" min="1" max="5" value={stars} onChange={(e) => setStars(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
                <Label>Commentaire</Label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Intervention rapide et soignée..." />
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                <Button size="sm" onClick={() => { onSubmit({ stars, comment }); setOpen(false); }}>Envoyer</Button>
            </div>
        </div>
    );
}

function Countdown({ startedAt }: { startedAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const interval = setInterval(() => {
            // 24 Hours countdown
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
        <div className="bg-indigo-900/30 border border-indigo-800 text-indigo-200 p-2 rounded-lg text-sm font-medium text-center">
            ⏳ Attribution automatique dans : <b className="font-mono text-white">{timeLeft}</b>
        </div>
    );
}


// --- Main TaskCard Component ---

interface TaskCardProps {
  task: Task;
  me: User;
  usersMap?: Record<string, string>; // Map email -> Full Name
  onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
  onAward: () => void;
  onComplete: () => void;
  onRate: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
  onPayApartment: () => void;
  onDelete: () => void;
  canDelete: boolean;
  // Optional props for Validation Mode
  onApprove?: () => void;
  onReject?: () => void;
  // Verification workflow
  onRequestVerification?: () => void;
  onRejectWork?: () => void;
}

export function TaskCard({ task, me, usersMap, onBid, onAward, onComplete, onRate, onPayApartment, onDelete, canDelete, onApprove, onReject, onRequestVerification, onRejectWork }: TaskCardProps) {
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const categoryInfo = CATEGORIES.find(c => c.id === task.category);
    const lowestBid = task.bids?.length > 0 ? task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]) : null;

    const warrantyUntil = task.completionAt && task.warrantyDays
        ? new Date(new Date(task.completionAt).getTime() + task.warrantyDays * 24 * 3600 * 1000)
        : null;

    const colorClasses = statusClasses[statusConfig.color] || { border: 'border-slate-600', text: 'text-slate-400' };
    const borderColor = `border-l-4 ${colorClasses.border}`;
    
    const myBidsCount = task.bids.filter(b => b.by === me.email).length;
    const isFirstBidder = task.bids.length > 0 && task.bids[0].by === me.email;
    const canBid =
        (isFirstBidder && myBidsCount < 2) ||
        (!isFirstBidder && myBidsCount < 1);

    const hasApproved = task.approvals?.some(a => a.by === me.email);

    // Check if timer is still running for manual award restriction
    const isTimerRunning = task.biddingStartedAt 
        ? (new Date().getTime() < new Date(task.biddingStartedAt).getTime() + 24 * 60 * 60 * 1000)
        : false;
    
    const isAdmin = me.role === 'admin';
    const canVerify = isAdmin || me.role === 'council';
    
    // Allow award if: 
    // 1. Status is open AND bids exist
    // 2. AND ( (I am creator AND timer finished) OR (I am Admin) )
    const canManualAward = task.status === "open" && 
                           task.bids?.length > 0 && 
                           lowestBid && 
                           (
                             (task.createdBy === me?.email && !isTimerRunning) || 
                             isAdmin
                           );
    
    // Resolve winner name
    const awardedToName = task.awardedTo && usersMap ? (usersMap[task.awardedTo] || task.awardedTo) : task.awardedTo;

    // Check if current user has already rated this task
    const hasRated = task.ratings?.some(r => r.byHash === me.id);

    const BidArea = () => {
        if (task.status !== 'open' || me?.role !== 'owner') {
            return null;
        }

        // Specific rule: The creator cannot bid unless the task has at least 2 approvals from CS OR if someone else has bid
        if (me.email === task.createdBy) {
             const hasOtherBidders = task.bids.some(b => b.by !== me.email);
             const hasEnoughApprovals = (task.approvals?.length || 0) >= COUNCIL_MIN_APPROVALS;

             if (!hasOtherBidders && !hasEnoughApprovals) {
                 return (
                     <div className="bg-slate-900/50 border border-slate-700 text-amber-500/80 p-3 rounded-lg text-xs text-center italic">
                         En tant que créateur, vous ne pourrez enchérir que si la tâche est validée par 2 membres du CS ou si un autre copropriétaire se positionne.
                     </div>
                 );
             }
        }

        if (canBid) {
            return <BidBox task={task} onBid={onBid} />;
        }
        
        return (
            <div className="bg-slate-900/50 border border-slate-700 text-slate-400 p-3 rounded-lg text-sm text-center">
                {isFirstBidder ? "Vous avez utilisé vos 2 offres." : "Vous avez déjà fait une offre."}
            </div>
        );
    }

    return (
        <Card className={borderColor}>
            <CardHeader>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                           <span className={colorClasses.text}>{React.cloneElement(statusConfig.icon, { className: 'h-5 w-5' })}</span>
                            <CardTitle className="text-base md:text-lg">{task.title}</CardTitle>
                        </div>
                        <p className="text-xs text-slate-400">
                            Proposée par <span className="font-medium text-slate-300">{usersMap?.[task.createdBy] || task.createdBy}</span> le {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                     <div className="flex items-center gap-2">
                        {categoryInfo && React.cloneElement(categoryInfo.icon, {className: "h-5 w-5 text-slate-500"})}
                        <Badge variant="secondary" className="font-mono text-sm bg-slate-900 border-slate-600 text-slate-300">{task.startingPrice}€</Badge>
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                
                {task.photo && (
                    <div className="w-full h-48 rounded-lg overflow-hidden border border-slate-700 mb-4 bg-slate-900/50">
                        <img src={task.photo} alt="Photo de la tâche" className="w-full h-full object-cover" />
                    </div>
                )}

                <p className="text-sm text-slate-300">{task.details}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-b border-slate-700 py-3">
                    <div className="flex items-center gap-2"><span className="text-slate-600">📍</span><span>{task.location || 'Non précisé'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-600">🛡️</span><span>Garantie: {task.warrantyDays} jours</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-600">{task.scope === 'copro' ? '🏢' : '🏠'}</span><span>{task.scope === 'copro' ? 'Charges communes' : 'Privatif'}</span></div>
                </div>
                
                {task.biddingStartedAt && task.status === 'open' && <Countdown startedAt={task.biddingStartedAt} />}

                {task.awardedTo && (
                    <div className="bg-sky-900/30 border border-sky-800 text-sky-200 p-3 rounded-lg text-sm flex justify-between items-center">
                        <div>🤝 Attribuée à <b>{awardedToName}</b> pour <b>{task.awardedAmount}€</b></div>
                        {task.awardedTo === me.email && (task.status === 'awarded' || task.status === 'verification') && (
                            <Badge className="bg-emerald-600 text-white animate-pulse">👉 À faire par vous</Badge>
                        )}
                    </div>
                )}

                <BidArea />

                {task.status === 'open' && task.bids?.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400">Offres en cours</h4>
                        <ul className="space-y-1">
                            {task.bids.slice().sort((a,b) => a.amount - b.amount).map((b, i) => {
                                const bidderName = usersMap ? (usersMap[b.by] || b.by) : b.by;
                                return (
                                    <li key={i} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm p-2 rounded-md ${i === 0 ? 'bg-indigo-900/40 border border-indigo-800 text-indigo-100' : 'bg-slate-800/50 border border-slate-700 text-slate-400'}`}>
                                        <div>
                                            <span className="font-semibold text-white">{b.amount} €</span> <span className="text-slate-500 text-xs">par {bidderName}</span>
                                            <div className="text-xs text-indigo-400/80 mt-1">🗓️ Prévu le: {new Date(b.plannedExecutionDate).toLocaleDateString()}</div>
                                        </div>
                                        <span className="text-xs text-slate-600 mt-1 sm:mt-0">{new Date(b.at).toLocaleDateString()}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {canManualAward && lowestBid && (
                    <Button size="sm" onClick={onAward}>
                        {isAdmin && isTimerRunning ? `⚡ Attribuer maintenant (Admin) (${lowestBid.amount} €)` : `✅ Attribuer au plus bas (${lowestBid.amount} €)`}
                    </Button>
                )}

                {/* WORKER ACTIONS (AWARDED) */}
                {task.status === "awarded" && task.awardedTo === me.email && onRequestVerification && (
                    <div className="flex gap-2">
                         <Button size="sm" onClick={onRequestVerification}>🏁 J'ai fini (Demander validation)</Button>
                    </div>
                )}

                {/* VERIFICATION FLOW (CS/ADMIN) */}
                {task.status === "verification" && (
                     <div className="bg-fuchsia-900/30 border border-fuchsia-800 text-fuchsia-200 p-3 rounded-lg text-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-2">🕵️ Contrôle qualité en cours</span>
                        </div>
                        <p className="text-xs opacity-80">Le copropriétaire indique avoir terminé. Le Conseil Syndical doit valider pour déclencher le paiement.</p>
                        
                        {canVerify && onComplete && onRejectWork ? (
                            <div className="flex gap-2 mt-1">
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 border-none text-white" onClick={onComplete}>✅ Valider le travail définitif</Button>
                                <Button size="sm" variant="destructive" onClick={onRejectWork}>❌ Refuser (Travail incomplet)</Button>
                            </div>
                        ) : (
                            <div className="text-xs italic opacity-50">En attente de validation par le CS.</div>
                        )}
                    </div>
                )}
                
                {task.status === "completed" && (
                    <div className="space-y-3">
                        <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-200 p-3 rounded-lg text-sm">
                            ✅ Intervention terminée {warrantyUntil && `(garantie jusqu'au ${warrantyUntil.toLocaleDateString()})`}
                        </div>
                        
                        {/* Display existing ratings or just count? For now, we show the RatingBox if not rated. */}
                        {task.ratings && task.ratings.length > 0 && (
                            <div className="text-xs text-slate-400">
                                {task.ratings.length} avis déposé(s).
                            </div>
                        )}

                        {/* Anyone can rate if they haven't already */}
                        {!hasRated ? (
                             <RatingBox onSubmit={onRate} />
                        ) : (
                             <div className="text-xs text-slate-500 italic text-center border border-slate-700 p-2 rounded">
                                 Vous avez déjà noté cette intervention.
                             </div>
                        )}
                    </div>
                )}
                
                {task.status === "pending" && (
                     <div className="bg-amber-900/30 border border-amber-800 text-amber-200 p-3 rounded-lg text-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span>⏳ En attente de validations du Conseil syndical. ({task.approvals?.length || 0}/{COUNCIL_MIN_APPROVALS})</span>
                        </div>
                        {onApprove && onReject && (
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    onClick={onApprove} 
                                    disabled={hasApproved && !isAdmin} 
                                    className="bg-emerald-600 hover:bg-emerald-500 border-none text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAdmin ? '⚡ Forcer la validation' : '✅ Valider'}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={onReject}>❌ Rejeter</Button>
                            </div>
                        )}
                    </div>
                )}

                {canDelete && (
                    <div className="pt-3 border-t border-slate-700">
                        <Button size="sm" variant="destructive" onClick={onDelete}>🗑️ Supprimer</Button>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
