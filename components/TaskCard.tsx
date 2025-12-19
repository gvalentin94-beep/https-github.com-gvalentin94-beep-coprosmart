
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
        if (!plannedExecutionDate) return alert("Indiquez la date d'intervention.");
        onBid({ amount: val, note, plannedExecutionDate });
        setNote("");
        onCancel();
    };

    const handleTodayClick = () => {
        setPlannedExecutionDate(new Date().toISOString().split('T')[0]);
    };

    const today = new Date().toISOString().split('T')[0];
    
    return (
        <div className="border-t border-slate-700 pt-2 mt-2 space-y-2 bg-slate-900/50 p-3 rounded">
            <div className="flex gap-4 items-end">
                <div className="w-24 shrink-0">
                    <Label className="text-[10px]">Prix (€)</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 font-bold text-center !bg-slate-950 border-slate-700" />
                </div>
                <div className="flex-1">
                    <Label className="text-[10px]">Date d'intervention</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="date" 
                            value={plannedExecutionDate} 
                            onChange={(e) => setPlannedExecutionDate(e.target.value)} 
                            min={today}
                            className="h-9 text-xs !bg-slate-950 border-slate-700" 
                        />
                        <Button size="sm" onClick={handleTodayClick} className="h-9 text-[10px] whitespace-nowrap">Dès aujourd'hui</Button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                 <Button size="sm" variant="ghost" onClick={onCancel}>Annuler</Button>
                 <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500" onClick={handleBid}>Confirmer l'offre</Button>
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

    if (!open) return <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="h-6 text-[10px]">⭐ Noter</Button>;

    return (
        <div className="absolute right-0 bottom-full mb-2 z-10 bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl w-48 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex justify-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setStars(s)} className={`text-lg ${s <= stars ? 'grayscale-0' : 'grayscale opacity-30'} transition-all hover:scale-110`}>⭐</button>
                ))}
            </div>
            <p className="text-[10px] text-center text-slate-400 mb-3 font-medium">{RATING_LEGEND[stars]}</p>
            <div className="flex justify-between gap-2">
                <button onClick={() => setOpen(false)} className="text-[10px] text-slate-500 hover:text-white flex-1">Fermer</button>
                <button onClick={() => onSubmit({ stars, comment: "" })} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex-1">Valider</button>
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

    if (expired) return <span className="text-rose-400 font-bold text-[10px] uppercase">Temps écoulé</span>;
    if (!timeLeft) return null;
    
    return (
        <span className="text-indigo-400 font-bold text-xs font-mono flex items-center gap-1">
             ⏱️ {timeLeft}
        </span>
    );
}

export interface TaskCardProps {
  task: Task;
  me: User;
  usersMap?: Record<string, string>; 
  onBid?: (bid: Omit<Bid, 'by' | 'at'>) => void;
  onAward?: () => void;
  onComplete?: () => void;
  onRate?: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
  onDeleteRating?: (taskId: string, ratingIndex: number) => void;
  onDelete: () => void;
  canDelete: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestVerification?: () => void;
  onRejectWork?: () => void;
}

export function TaskCard({ task, me, usersMap, onBid, onAward, onComplete, onRate, onDeleteRating, onDelete, canDelete, onApprove, onReject, onRequestVerification, onRejectWork }: TaskCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [showBidForm, setShowBidForm] = useState(false);
    
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const categoryInfo = CATEGORIES.find(c => c.id === task.category);
    const scopeInfo = SCOPES.find(s => s.id === task.scope);
    
    const lowestBid = task.bids?.length > 0 ? task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]) : null;
    const style = statusClasses[statusConfig.color] || statusClasses.indigo;
    
    const myBidsCount = task.bids.filter(b => b.by === me.email).length;
    const isFirstBidder = task.bids.length > 0 && task.bids[0].by === me.email;
    const canBid = (isFirstBidder && myBidsCount < 2) || (!isFirstBidder && myBidsCount < 1);
    
    const hasApproved = task.approvals?.some(a => a.by === me.email);
    const timerStart = task.biddingStartedAt || (task.bids?.length > 0 ? task.bids[0].at : null);
    const showTimer = task.status === 'open' && timerStart;
    const isTimerExpired = timerStart && (new Date().getTime() > new Date(timerStart).getTime() + 24 * 60 * 60 * 1000);
    
    const isAdmin = me.role === 'admin';
    const isCouncil = me.role === 'council';
    const isCouncilOrAdmin = isAdmin || isCouncil;

    const getName = (email: string | undefined | null) => {
        if (!email) return null;
        return usersMap && usersMap[email] ? usersMap[email] : email;
    };

    const awardedToName = getName(task.awardedTo);
    const creatorName = getName(task.createdBy);
    const approverNames = task.approvals && task.approvals.length > 0 
        ? task.approvals.map(a => getName(a.by) || a.by).join(', ')
        : (task.status === 'pending' ? null : '-');

    const hasRated = task.ratings?.some(r => r.byHash === me.id);
    const isAssignee = task.awardedTo === me.email;
    
    const winningBid = task.awardedTo ? task.bids.find(b => b.userId === task.awardedToId || b.by === task.awardedTo) : null;

    let displayPrice = task.startingPrice;
    if (lowestBid) displayPrice = lowestBid.amount;
    if (task.awardedAmount) displayPrice = task.awardedAmount;

    const refId = `#${formatTaskId(task.createdAt)}`;

    let ActionButton = null;
    let PendingActionButtons = null;

    if (task.status === 'open') {
        if (task.bids?.length > 0 && lowestBid && (isTimerExpired || isAdmin) && onAward) {
             ActionButton = <Button size="sm" onClick={onAward} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500">Attribuer</Button>;
        } else if (canBid && onBid) {
             ActionButton = (
                <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowBidForm(!showBidForm); if(!showBidForm) setShowDetails(true); }} className="h-7 text-[10px]">Faire une offre</Button>
            );
        }
    } else if (task.status === 'verification' && isCouncilOrAdmin && !isAssignee && onComplete) {
        PendingActionButtons = (
            <div className="flex gap-1 items-center">
                <Button size="sm" onClick={onComplete} className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500 font-bold">Valider le travail</Button>
                {onRejectWork && <Button size="sm" onClick={onRejectWork} variant="destructive" className="h-7 text-[10px]">Refuser</Button>}
            </div>
        );
    } else if (task.status === 'pending' && isCouncilOrAdmin && onApprove && onReject) {
        PendingActionButtons = (
             <div className="flex gap-1 items-center">
                <Button size="sm" onClick={onApprove} disabled={hasApproved} className={`h-7 px-3 text-[10px] font-bold ${hasApproved ? 'opacity-50' : 'bg-emerald-600 hover:bg-emerald-500'}`}>{hasApproved ? 'Voté' : 'Valider'}</Button>
                <Button size="sm" onClick={onReject} variant="destructive" className="h-7 text-[10px]">Rejeter</Button>
            </div>
        );
    }

    return (
        <Card className={`bg-slate-800 border-l-4 ${style.border} p-0 shadow-sm overflow-hidden`}>
            <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                             <h3 className="font-bold text-white text-base leading-tight">{task.title}</h3>
                             <span className="text-[10px] font-mono text-slate-500 uppercase">{refId}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            {categoryInfo && <Badge className={categoryInfo.colorClass}>{categoryInfo.label}</Badge>}
                            {scopeInfo && <Badge className={scopeInfo.colorClass}>{scopeInfo.label}</Badge>}
                            <Badge variant="outline">{task.location}</Badge>
                            {showTimer && <Countdown startedAt={timerStart} />}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-white leading-none">{displayPrice}€</div>
                        <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">{lowestBid ? "Offre actuelle" : "Prix de départ"}</div>
                    </div>
                </div>
                
                {winningBid?.plannedExecutionDate && (
                    <div className="bg-indigo-900/20 px-3 py-2 rounded-lg border border-indigo-500/10 text-xs text-indigo-300 flex items-center gap-2">
                         📅 Intervention prévue : <strong className="text-white">{new Date(winningBid.plannedExecutionDate).toLocaleDateString()}</strong>
                    </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
                    <div className="flex flex-col gap-1">
                        <div className="text-[10px] text-slate-500">Demande de <span className="text-slate-300 font-medium">{creatorName || '-'}</span></div>
                        {task.status === 'pending' && (
                             <div className="text-[10px] text-amber-500 font-bold">Approbations : {task.approvals?.length || 0}/{COUNCIL_MIN_APPROVALS}</div>
                        )}
                        {awardedToName && (
                             <div className="text-[10px] text-slate-500">Assigné à <span className="text-slate-300 font-medium">{awardedToName}</span></div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {PendingActionButtons || ActionButton}
                        
                        {task.status === 'completed' && !hasRated && !isAssignee && onRate && (
                            <div className="relative">
                                <RatingBox onSubmit={onRate} />
                            </div>
                        )}

                        <button onClick={() => setShowDetails(!showDetails)} className="text-slate-500 hover:text-white p-1 transition-colors">
                            {showDetails ? '▲ Moins' : '▼ Détails'}
                        </button>
                    </div>
                </div>

                {showBidForm && onBid && <BidBox task={task} onBid={onBid} onCancel={() => setShowBidForm(false)} />}
                
                {showDetails && (
                    <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 text-sm">
                        {task.photo && <img src={task.photo} alt="Task" className="rounded-lg w-full object-cover max-h-60 border border-slate-700" />}
                        <p className="p-3 bg-slate-900/50 rounded-lg text-slate-300 leading-relaxed border border-slate-700/30">{task.details || "Pas de description."}</p>
                        
                        {task.status !== 'open' && task.bids?.length > 0 && (
                             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                                <p className="font-bold text-slate-400 mb-2 text-[10px] uppercase">Historique des offres</p>
                                {task.bids.map((b, i) => (
                                    <div key={i} className="flex justify-between text-[11px] py-1 border-b border-slate-800 last:border-0">
                                        <span className="text-slate-300">{b.amount}€ par {getName(b.by)}</span>
                                        <span className="text-slate-500">{new Date(b.at).toLocaleDateString()}</span>
                                    </div>
                                ))}
                             </div>
                        )}

                        {task.ratings?.length > 0 && (
                            <div className="space-y-2">
                                {task.ratings.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                                        <div className="flex items-center gap-2">
                                            <span className="text-amber-400 tracking-widest">{Array(r.stars).fill('⭐').join('')}</span>
                                            <span className="text-slate-400 italic text-[11px]">- {RATING_LEGEND[r.stars]}</span>
                                        </div>
                                        {canDelete && onDeleteRating && <button onClick={() => onDeleteRating(task.id, i)} className="text-rose-500 hover:underline text-[10px] uppercase font-bold">Supprimer</button>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {canDelete && (
                            <Button size="sm" variant="ghost" className="w-full text-rose-500 hover:text-rose-400 hover:bg-rose-950/20" onClick={onDelete}>Supprimer la tâche</Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
