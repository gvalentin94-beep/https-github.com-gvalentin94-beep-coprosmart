
import React, { useState, useEffect } from 'react';
import type { Task, User, Rating, Bid } from '../types';
import { Button, Card, Input, Label, Badge } from './ui';
import { CATEGORIES, TASK_STATUS_CONFIG, SCOPES, WARRANTY_OPTIONS, RATING_LEGEND } from '../constants';

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
    
    const getTomorrow = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    };
    
    const [plannedExecutionDate, setPlannedExecutionDate] = useState(getTomorrow());

    useEffect(() => {
        const nextVal = currentPrice > 1 ? Math.floor(currentPrice - 1) : 1;
        setAmount(String(nextVal));
    }, [currentPrice, task.id]);

    const handleBid = () => {
        const val = Number(amount);
        if (!Number.isInteger(val)) return alert("Pas de centimes.");
        if (!val || val <= 0) return alert("Montant positif requis.");
        if (val >= currentPrice) return alert(`L'offre doit être inférieure à ${currentPrice} €.`);
        if (!plannedExecutionDate) return alert("Date requise.");
        onBid({ amount: val, note, plannedExecutionDate });
        setNote("");
        onCancel();
    };

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    return (
        <div className="border-t border-slate-700 pt-2 mt-2 space-y-2">
            <div className="flex gap-2">
                <div className="w-20">
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-7 font-bold text-indigo-600 text-center !bg-white text-xs" placeholder="Prix" />
                </div>
                <div className="flex-1">
                    <Input type="date" value={plannedExecutionDate} onChange={(e) => setPlannedExecutionDate(e.target.value)} min={today} max={maxDateStr} className="h-7 text-xs !bg-white text-slate-900" />
                </div>
                <Button size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-500 text-white text-xs" onClick={handleBid}>Valider</Button>
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

    let displayPrice = task.startingPrice;
    if (lowestBid) displayPrice = lowestBid.amount;
    if (task.awardedAmount) displayPrice = task.awardedAmount;

    // ACTION BUTTONS Logic
    let ActionButton = null;
    let PendingActionButtons = null; // Specific to Pending status to move them up

    if (task.status === 'open') {
        if (canManualAward) {
             ActionButton = <Button size="sm" onClick={onAward} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap">Attribuer</Button>;
        } else if (canBid) {
             ActionButton = <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowBidForm(!showBidForm); }} className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white whitespace-nowrap">Faire une offre</Button>;
        } else {
             ActionButton = <span className="text-[10px] text-slate-500 italic">Offre envoyée</span>;
        }
    } else if (task.status === 'awarded' && isAssignee && onRequestVerification) {
        ActionButton = <Button size="sm" onClick={onRequestVerification} className="h-6 text-[10px] bg-fuchsia-600 hover:bg-fuchsia-500 whitespace-nowrap">Terminer</Button>;
    } else if (task.status === 'verification' && canVerify && onRejectWork) {
        ActionButton = (
            <div className="flex gap-1">
                <Button size="sm" onClick={onComplete} className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 px-2">Valider</Button>
                <Button size="sm" onClick={onRejectWork} variant="destructive" className="h-6 text-[10px] px-2">Refuser</Button>
            </div>
        );
    } else if (task.status === 'pending' && onApprove && onReject) {
        if (isCouncilOrAdmin) {
            PendingActionButtons = (
                 <div className="flex gap-1 ml-auto">
                    <Button size="sm" onClick={onApprove} disabled={hasApproved && !isAdmin} className="h-6 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold">OUI</Button>
                    <Button size="sm" onClick={onReject} variant="destructive" className="h-6 px-2 text-[10px] font-bold">NON</Button>
                </div>
            );
        } else {
             PendingActionButtons = <span className="text-[10px] text-amber-500 italic ml-auto font-bold bg-amber-950/30 px-2 rounded border border-amber-500/20">Contrôle qualité en cours</span>;
        }
    }

    return (
        <Card className={`bg-slate-800 border-l-[3px] ${style.border} p-0 shadow-none mb-1`}>
            <div className="p-2 flex flex-col gap-1">
                
                {/* LINE 1: Title & Price */}
                <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-extrabold text-white text-sm leading-none truncate flex items-center gap-2">
                        {task.title}
                    </h3>
                    <span className="font-mono font-bold text-white text-sm">{displayPrice}€</span>
                </div>

                {/* LINE 2: Badges + Countdown + Pending Actions (Inline) */}
                <div className="flex flex-wrap gap-1.5 items-center w-full min-h-[1.5rem]">
                    {categoryInfo && <Badge className={`${categoryInfo.colorClass} border-none text-[9px] py-0 px-1.5 rounded-sm shadow-sm`}>{categoryInfo.label}</Badge>}
                    {scopeInfo && <Badge className={`${scopeInfo.colorClass} border-none text-[9px] py-0 px-1.5 rounded-sm shadow-sm`}>{scopeInfo.label}</Badge>}
                    <Badge className="bg-slate-700 text-slate-300 border border-slate-600 text-[9px] py-0 px-1.5 rounded-sm">{task.location}</Badge>
                    {warrantyInfo && <Badge className={`${warrantyInfo.colorClass} border-none text-[9px] py-0 px-1.5 rounded-sm shadow-sm`}>{warrantyInfo.label}</Badge>}
                    
                    {/* Inline Countdown */}
                    {showTimer && <Countdown startedAt={timerStart} />}

                    {/* Pending Actions moved here */}
                    {task.status === 'pending' && PendingActionButtons}
                </div>
                
                {/* MIDDLE: BIDS LIST (Compact Grid) - Visible for Open tasks */}
                {task.status === 'open' && task.bids?.length > 0 && (
                    <div className="my-1.5 bg-slate-950/50 rounded border border-slate-800 p-1">
                         <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            {task.bids.map((b, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800/50 last:border-0 pb-0.5">
                                    <span className="font-bold text-indigo-200">
                                        {b.amount}€
                                    </span>
                                    <span className="text-[9px] truncate max-w-[80px]">par {getName(b.by) || b.by}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* LINE 3: Meta & Actions (Footer) */}
                <div className="flex justify-between items-end pt-1 border-t border-slate-700/50 mt-1">
                    
                    {/* GRID: Grouped Columns (Action vs Control) */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-slate-500 leading-none w-full mr-2">
                        
                        {/* Column 1: Creation & Assignment */}
                        <div className="space-y-0.5">
                            <div className="truncate">📝 Créé par: <span className="text-slate-300">{creatorName || '-'}</span></div>
                            <div className="truncate">🔨 Attribué à: <span className="text-slate-300">{awardedToName || '-'}</span></div>
                        </div>

                        {/* Column 2: Approval & Control */}
                        <div className="space-y-0.5 border-l border-slate-700/50 pl-2">
                             <div className="truncate">👍 Approuvé par: <span className="text-slate-300">{approverNames || 'En attente'}</span></div>
                             <div className="truncate">🔍 Contrôle qualité par <span className="text-slate-300">{validatorName || '-'}</span></div>
                        </div>

                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 self-end">
                        {/* Show other action buttons (Award, Verify, etc) but NOT pending buttons (moved up) */}
                        {task.status !== 'pending' && ActionButton}
                        
                        {/* Rating */}
                        <div className="relative">
                            {task.status === 'completed' && !hasRated && !isAssignee ? (
                                <RatingBox onSubmit={onRate} />
                            ) : (
                                // Placeholder to keep height consistent or show nothing
                                null
                            )}
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
                                <p className="font-bold text-slate-500 mb-1 text-[10px]">Offres</p>
                                {task.bids.map((b, i) => (
                                    <div key={i} className="flex justify-between p-1 bg-slate-900/30 rounded mb-1 text-[10px]">
                                        <span>{b.amount}€ ({usersMap?.[b.by] || b.by})</span>
                                        <span className="text-slate-500">{new Date(b.plannedExecutionDate).toLocaleDateString()}</span>
                                    </div>
                                ))}
                             </div>
                        )}

                        {task.status === 'completed' && (
                            <div>
                                {task.ratings?.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-1 rounded mb-1 text-[10px]">
                                        <span className="text-amber-400 tracking-widest">{Array(r.stars).fill('⭐').join('')}</span>
                                        {canDelete && onDeleteRating && <button onClick={() => onDeleteRating(task.id, i)} className="text-rose-500 hover:underline">Suppr</button>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {canDelete && (
                            <Button size="sm" variant="ghost" className="w-full h-5 text-rose-500 hover:text-rose-400 text-[10px]" onClick={onDelete}>Supprimer</Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
