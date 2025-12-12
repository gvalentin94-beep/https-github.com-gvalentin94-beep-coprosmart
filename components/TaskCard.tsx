
import React, { useState, useEffect } from 'react';
import type { Task, User, Rating, Bid } from '../types';
import { Button, Card, Input, Label, Badge } from './ui';
import { CATEGORIES, TASK_STATUS_CONFIG, SCOPES, WARRANTY_OPTIONS, RATING_LEGEND, COUNCIL_MIN_APPROVALS } from '../constants';
import { formatTaskId } from '../services/api';

const statusClasses: { [key: string]: { border: string; text: string; bg: string } } = {
    amber: { border: 'border-amber-500', text: 'text-amber-500', bg: 'bg-amber-500' },
    indigo: { border: 'border-indigo-500', text: 'text-indigo-500', bg: 'bg-indigo-500' },
    sky: { border: 'border-sky-500', text: 'text-sky-500', bg: 'bg-sky-500' },
    emerald: { border: 'border-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500' },
    rose: { border: 'border-rose-500', text: 'text-rose-500', bg: 'bg-rose-500' },
    fuchsia: { border: 'border-fuchsia-500', text: 'text-fuchsia-500', bg: 'bg-fuchsia-500' },
};

interface BidBoxProps {
    task: Task;
    onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
    onCancel: () => void;
}

function BidBox({ task, onBid, onCancel }: BidBoxProps) {
    const hasBids = task.bids?.length > 0;
    const currentPrice = hasBids ? Math.min(...task.bids.map(b => b.amount)) : task.startingPrice;
    
    const [amount, setAmount] = useState(String(Math.floor(currentPrice - 1)));
    const [note, setNote] = useState("");
    
    // No default date to force user input
    const [plannedExecutionDate, setPlannedExecutionDate] = useState("");

    useEffect(() => {
        const nextVal = currentPrice > 1 ? Math.floor(currentPrice - 1) : 1;
        setAmount(String(nextVal));
    }, [currentPrice, task.id]);

    const handleBid = () => {
        const val = Number(amount);
        if (!Number.isInteger(val)) return alert("Pas de centimes.");
        if (!val || val <= 0) return alert("Montant positif requis.");
        if (val >= currentPrice) return alert(`L'offre doit être inférieure à ${currentPrice} €.`);
        if (!plannedExecutionDate) return alert("Merci d'indiquer la date à laquelle vous comptez réaliser la tâche.");
        onBid({ amount: val, note, plannedExecutionDate });
        setNote("");
        onCancel();
    };

    const handleTodayClick = () => {
        setPlannedExecutionDate(new Date().toISOString().split('T')[0]);
    };

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    return (
        <div className="border-t border-slate-700 pt-2 mt-2 space-y-2 bg-slate-900/50 p-2 rounded">
            <div className="flex gap-2 items-end">
                <div className="w-20 shrink-0">
                    <Label className="mb-1 text-[9px]">Prix (€)</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 font-bold text-indigo-600 text-center !bg-white text-xs" />
                </div>
                <div className="flex-1">
                    <Label className="mb-1 text-[9px] text-indigo-300">Date de réalisation</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="date" 
                            value={plannedExecutionDate} 
                            onChange={(e) => setPlannedExecutionDate(e.target.value)} 
                            min={today} max={maxDateStr} 
                            className="h-8 text-xs !bg-white text-slate-900 w-auto" 
                        />
                        <Button 
                            size="sm" 
                            onClick={handleTodayClick}
                            className="h-8 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap px-3 shadow-sm border border-indigo-400"
                        >
                            ⚡ Aujourd'hui
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/50">
                 <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={onCancel}>Annuler</Button>
                 <Button size="sm" className="h-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs" onClick={handleBid}>Valider l'offre</Button>
            </div>
        </div>
    );
}

interface RatingBoxProps {
    onSubmit: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
}

function RatingBox({ onSubmit }: RatingBoxProps) {
    const [open, setOpen] = useState(false);
    const [stars, setStars] = useState(5);

    if (!open) return <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="h-6 text-[10px] border-slate-600 text-slate-400 hover:text-white">⭐ Noter</Button>;

    return (
        <div className="absolute right-0 top-0 z-10 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl w-40">
            <div className="flex justify-center gap-1 mb-1">
                {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setStars(s)} className={`text-sm ${s <= stars ? 'grayscale-0' : 'grayscale opacity-30'}`}>⭐</button>
                ))}
            </div>
            <p className="text-[9px] text-center text-slate-400 mb-2">{RATING_LEGEND[stars]}</p>
            <div className="flex justify-between">
                <button onClick={() => setOpen(false)} className="text-[10px] text-slate-500 hover:text-white">Annuler</button>
                <button onClick={() => onSubmit({ stars, comment: "" })} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">Valider</button>
            </div>
        </div>
    );
}

function Countdown({ startedAt }: { startedAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const endTime = new Date(startedAt).getTime() + 24 * 60 * 60 * 1000;
            const now = new Date().getTime();
            const distance = endTime - now;
            
            if (distance < 0) { 
                setExpired(true);
                setTimeLeft(""); 
                clearInterval(interval); 
                return; 
            }
            
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${h}h ${m}m ${s}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [startedAt]);

    if (expired) return <span className="text-rose-400 font-bold text-[10px] uppercase ml-auto">Temps écoulé</span>;
    if (!timeLeft) return null;
    
    return (
        <span className="text-indigo-400 font-bold text-xs font-mono ml-auto animate-pulse flex items-center gap-1">
             ⏱️ {timeLeft}
        </span>
    );
}

export interface TaskCardProps {
  task: Task;
  me: User;
  usersMap?: Record<string, string>; 
  onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
  onAward: () => void;
  onComplete: () => void;
  onRate: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
  onDeleteRating?: (taskId: string, ratingIndex: number) => void;
  onDelete: () => void;
  canDelete: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestVerification?: () => void;
  onRejectWork?: () => void;
  key?: React.Key;
}

export function TaskCard({ task, me, usersMap, onBid, onAward, onComplete, onRate, onDeleteRating, onDelete, canDelete, onApprove, onReject, onRequestVerification, onRejectWork }: TaskCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [showBidForm, setShowBidForm] = useState(false);
    
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const categoryInfo = CATEGORIES.find(c => c.id === task.category);
    const scopeInfo = SCOPES.find(s => s.id === task.scope);
    const warrantyInfo = WARRANTY_OPTIONS.find(w => String(w.val) === String(task.warrantyDays));
    
    const lowestBid = task.bids?.length > 0 ? task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]) : null;
    const style = statusClasses[statusConfig.color] || statusClasses.indigo;
    
    const myBidsCount = task.bids.filter(b => b.by === me.email).length;
    const isFirstBidder = task.bids.length > 0 && task.bids[0].by === me.email;
    const canBid = (isFirstBidder && myBidsCount < 2) || (!isFirstBidder && myBidsCount < 1);
    
    const hasApproved = task.approvals?.some(a => a.by === me.email);
    
    // Timer Logic
    const timerStart = task.biddingStartedAt || (task.bids?.length > 0 ? task.bids[0].at : null);
    const showTimer = task.status === 'open' && timerStart;
    const isTimerExpired = timerStart && (new Date().getTime() > new Date(timerStart).getTime() + 24 * 60 * 60 * 1000);
    
    const isAdmin = me.role === 'admin';
    const isCouncil = me.role === 'council';
    const isCouncilOrAdmin = isAdmin || isCouncil;

    const canVerify = isAdmin || isCouncil;
    
    // Can award if: Open AND has bids AND (Creator owner OR Admin) AND (Timer expired OR Admin bypass)
    const canManualAward = task.status === "open" && task.bids?.length > 0 && lowestBid && (isTimerExpired || isAdmin);
    
    // Name helpers
    const getName = (email: string | undefined | null) => {
        if (!email) return null;
        return usersMap && usersMap[email] ? usersMap[email] : email;
    };

    const awardedToName = getName(task.awardedTo);
    const creatorName = getName(task.createdBy);
    const validatorName = getName(task.validatedBy);
    const approverNames = task.approvals && task.approvals.length > 0 
        ? task.approvals.map(a => getName(a.by) || a.by).join(', ')
        : (task.status === 'pending' ? null : '-');

    const hasRated = task.ratings?.some(r => r.byHash === me.id);
    const isAssignee = task.awardedTo === me.email;
    
    // Find Winning Bid Info (for dates)
    const winningBid = task.awardedTo ? task.bids.find(b => b.userId === task.awardedToId || b.by === task.awardedTo) : null;

    let displayPrice = task.startingPrice;
    if (lowestBid) displayPrice = lowestBid.amount;
    if (task.awardedAmount) displayPrice = task.awardedAmount;

    // USE NEW DATE BASED ID FORMAT
    const refId = `#${formatTaskId(task.createdAt)}`;

    // ACTION BUTTONS Logic
    let ActionButton = null;
    let PendingActionButtons = null; // Specific to Pending/Verification status to move them up

    if (task.status === 'open') {
        if (canManualAward) {
             ActionButton = <Button size="sm" onClick={onAward} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap">Attribuer</Button>;
        } else if (canBid) {
             ActionButton = (
                <Button 
                    size="sm" 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        const nextState = !showBidForm;
                        setShowBidForm(nextState);
                        // Auto-open details when opening bid form
                        if (nextState) setShowDetails(true);
                    }} 
                    className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap"
                >
                    Faire une offre
                </Button>
            );
        } else {
             ActionButton = <span className="text-[10px] text-slate-500 italic">Offre envoyée</span>;
        }
    } else if (task.status === 'awarded' && isAssignee && onRequestVerification) {
        ActionButton = <Button size="sm" onClick={onRequestVerification} className="h-6 text-[10px] bg-fuchsia-600 hover:bg-fuchsia-500 whitespace-nowrap">Terminer</Button>;
    } else if (task.status === 'verification') {
        // Validation Logic: User must have rights (CS/Admin) AND NOT be the person who did the work (assignee)
        if (canVerify && !isAssignee && onComplete && onRejectWork) {
            // "En attente de validation (Travail fait)"
            PendingActionButtons = (
                <div className="flex gap-1 items-center">
                    <Badge className="bg-fuchsia-600 text-white animate-pulse">Contrôle qualité en cours</Badge>
                    <Button size="sm" onClick={onComplete} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 px-2 font-bold">Valider</Button>
                    <Button size="sm" onClick={onRejectWork} variant="destructive" className="h-6 text-[10px] px-2 font-bold">Refuser</Button>
                </div>
            );
        } else if (isAssignee) {
             // Affichage pour l'intervenant qui attend la validation (même si c'est un CS qui a fait le travail)
             const waitLabel = canVerify ? "Attente validation (Tiers)" : "⏳ En attente contrôle qualité";
             ActionButton = <Button size="sm" disabled className="h-6 text-[10px] bg-slate-700 text-slate-300 border border-slate-600 opacity-70 cursor-wait">{waitLabel}</Button>;
        }
    } else if (task.status === 'pending') {
        // "En attente de validation (Création)"
        if (isCouncilOrAdmin && onApprove && onReject) {
            PendingActionButtons = (
                 <div className="flex gap-1 items-center">
                    <Button 
                        size="sm" 
                        onClick={onApprove} 
                        disabled={hasApproved} 
                        className={`h-6 px-2 text-[10px] font-bold ${hasApproved ? 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                        {hasApproved ? 'VALIDÉ' : 'OUI'}
                    </Button>
                    <Button size="sm" onClick={onReject} variant="destructive" className="h-6 px-2 text-[10px] font-bold">NON</Button>
                </div>
            );
        } else {
             // Just Badge for simple users (already handled in badges section, or add extra here if needed)
        }
    }

    // Validation Count Logic
    const currentApprovals = task.approvals?.length || 0;
    const missingApprovals = Math.max(0, COUNCIL_MIN_APPROVALS - currentApprovals);
    const validationLabel = `Validation (${currentApprovals}/${COUNCIL_MIN_APPROVALS})`;

    return (
        <Card className={`bg-slate-800 border-l-[3px] ${style.border} p-0 shadow-none mb-1`}>
            <div className="p-2 flex flex-col gap-1">
                
                {/* LINE 1: Price (Left) - Title (Centered) - Ref Code (Right) */}
                <div className="relative flex items-center justify-between h-6 mb-1">
                    <span className="font-mono font-bold text-white text-sm w-16">{displayPrice}€</span>

                    <h3 className="absolute left-0 right-0 mx-auto w-fit font-extrabold text-white text-sm leading-none truncate max-w-[60%] text-center">
                        {task.title}
                    </h3>
                    
                    <span className="text-[9px] font-mono text-slate-400 min-w-[80px] text-right">{refId}</span>
                </div>

                {/* LINE 2: Badges + Bids (Right) + Pending/Verif Actions */}
                <div className="flex flex-wrap items-center w-full min-h-[1.5rem] gap-y-1">
                    
                    {/* Left: Badges */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                        {task.status === 'pending' && (
                            <Badge className="bg-amber-500 text-slate-900 border-amber-600 font-bold flex gap-1">
                                {validationLabel}
                                {missingApprovals > 0 && <span className="text-amber-900 border-l border-amber-800 pl-1 ml-0.5 font-extrabold uppercase text-[8px] tracking-tight">Manque {missingApprovals}</span>}
                            </Badge>
                        )}
                        {categoryInfo && <Badge className={`${categoryInfo.colorClass} border-none text-[9px] py-0 px-1.5 rounded-sm shadow-sm`}>{categoryInfo.label}</Badge>}
                        {scopeInfo && <Badge className={`${scopeInfo.colorClass} border-none text-[9px] py-0 px-1.5 rounded-sm shadow-sm`}>{scopeInfo.label}</Badge>}
                        <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-[9px] py-0 px-1.5 rounded-sm">{task.location}</Badge>
                        {/* Inline Countdown */}
                        {showTimer && <Countdown startedAt={timerStart} />}
                    </div>

                    {/* Right: Bids List (Open) - Aligned to right with ml-auto */}
                    {task.status === 'open' && task.bids?.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1 ml-auto items-center">
                             {task.bids.map((b, i) => (
                                <div key={i} className="flex items-center text-[10px] text-indigo-200">
                                    <span className="font-bold mr-1">{b.amount}€</span>
                                    <span className="text-slate-300">par {getName(b.by) || b.by}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pending/Verification Buttons - Flows after badges or right aligned if preferred. */}
                    {(task.status === 'pending' || task.status === 'verification') && PendingActionButtons && (
                        <div className="ml-auto">
                            {PendingActionButtons}
                        </div>
                    )}
                </div>
                
                {/* Planning Date for Assigned Tasks */}
                {(task.status === 'awarded' || task.status === 'verification') && winningBid && winningBid.plannedExecutionDate && (
                    <div className="mt-1 bg-indigo-900/20 px-2 py-1 rounded border border-indigo-500/20 flex justify-center text-xs text-indigo-200">
                         📅 Intervention prévue le : <strong className="ml-1 text-white">{new Date(winningBid.plannedExecutionDate).toLocaleDateString()}</strong>
                    </div>
                )}

                {/* LINE 3: Meta & Actions (Footer) */}
                <div className="flex justify-between items-end pt-1 border-t border-slate-700/50 mt-1">
                    
                    {/* GRID: Grouped Columns (Action vs Control) */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-slate-500 leading-none w-full mr-2">
                        <div className="space-y-0.5">
                            <div className="truncate">📝 Créé par: <span className="text-slate-300">{creatorName || '-'}</span></div>
                            <div className="truncate">🔨 Attribué à: <span className="text-slate-300">{awardedToName || '-'}</span></div>
                        </div>
                        <div className="space-y-0.5 border-l border-slate-700/50 pl-2">
                             <div className="truncate">👍 Approuvé par: <span className="text-slate-300">{approverNames || 'En attente'}</span></div>
                             <div className="truncate">🔍 Contrôle qualité par <span className="text-slate-300">{validatorName || '-'}</span></div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 self-end">
                        {/* Show other action buttons (Award, Verify, etc) but NOT pending/verification buttons (moved up) */}
                        {task.status !== 'pending' && (!PendingActionButtons || task.status !== 'verification') && ActionButton}
                        
                        {/* Rating */}
                        <div className="relative">
                            {task.status === 'completed' && !hasRated && !isAssignee ? (
                                <RatingBox onSubmit={onRate} />
                            ) : null}
                        </div>

                        <button onClick={() => setShowDetails(!showDetails)} className="text-[10px] text-slate-500 hover:text-white px-1">
                            {showDetails ? '▲' : '▼'}
                        </button>
                    </div>
                </div>

                {/* INLINE FORMS & DETAILS */}
                {showBidForm && <BidBox task={task} onBid={onBid} onCancel={() => setShowBidForm(false)} />}
                
                {showDetails && (
                    <div className="mt-2 pt-2 border-t border-slate-700 space-y-2 animate-in fade-in duration-200 text-xs text-slate-300">
                        {task.photo && <img src={task.photo} alt="Photo" className="h-auto max-h-96 w-auto max-w-full object-contain mx-auto bg-slate-950/50 rounded border border-slate-700" />}
                        <p className="p-2 bg-slate-900/50 rounded whitespace-pre-wrap text-[11px]">{task.details || "Pas de description."}</p>
                        
                        {/* Show Bids in details only if NOT open (history) */}
                        {task.status !== 'open' && task.bids?.length > 0 && (
                             <div>
                                <p className="font-bold text-slate-500 mb-1 text-[10px]">Historique des offres</p>
                                {task.bids.map((b, i) => (
                                    <div key={i} className="flex justify-between p-1 bg-slate-900/30 rounded mb-1 text-[10px]">
                                        <span>{b.amount}€ ({usersMap?.[b.by] || b.by})</span>
                                        <span className="text-slate-500">Prévu le {new Date(b.plannedExecutionDate).toLocaleDateString()}</span>
                                    </div>
                                ))}
                             </div>
                        )}

                        {task.status === 'completed' && (
                            <div>
                                {task.ratings?.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-1 rounded mb-1 text-[10px]">
                                        <div className="flex items-center">
                                            <span className="text-amber-400 tracking-widest">{Array(r.stars).fill('⭐').join('')}</span>
                                            <span className="text-slate-400 ml-2 italic text-[9px] font-bold text-amber-200/50">- {RATING_LEGEND[r.stars]}</span>
                                        </div>
                                        {canDelete && onDeleteRating && <button onClick={() => onDeleteRating(task.id, i)} className="text-rose-500 hover:underline">Suppr</button>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {canDelete && (
                            <Button size="sm" variant="ghost" className="w-full h-5 text-rose-500 hover:text-rose-400 text-[10px] bg-rose-950/20 hover:bg-rose-950/40" onClick={onDelete}>Supprimer la tâche</Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
