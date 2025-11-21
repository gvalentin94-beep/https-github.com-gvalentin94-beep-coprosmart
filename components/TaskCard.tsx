
import React, { useState, useEffect } from 'react';
import type { Task, User, Rating, Bid } from '../types';
import { Button, Card, Input, Label, Badge, Textarea } from './ui';
import { CATEGORIES, TASK_STATUS_CONFIG, SCOPES, WARRANTY_OPTIONS, MapPinIcon, RATING_LEGEND } from '../constants';

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
    onCancel: () => void;
}

function BidBox({ task, onBid, onCancel }: BidBoxProps) {
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
        onCancel();
    };

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    return (
        <div className="border border-slate-700 rounded-xl p-4 space-y-4 bg-slate-900/50 shadow-inner mt-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nouvelle offre</div>
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
            <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={onCancel}>Annuler</Button>
                <Button className="flex-[3] bg-indigo-600 hover:bg-indigo-500" onClick={handleBid} disabled={!amount || Number(amount) <= 0 || Number(amount) >= currentPrice || !plannedExecutionDate}>
                    🚀 Confirmer mon offre
                </Button>
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

    if (!open) {
        return (
            <Button size="sm" variant="outline" className="bg-slate-800 border-slate-600 text-amber-400 hover:text-amber-300 hover:border-amber-500 hover:bg-slate-700 shadow-sm" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
                ⭐ Noter
            </Button>
        );
    }

    return (
        <div className="border border-slate-700 rounded-xl p-4 space-y-3 bg-slate-900/90 mt-2 relative z-10 shadow-xl animate-in slide-in-from-top-2 max-w-sm ml-auto">
            <div className="space-y-1">
                <Label className="text-center block">Quelle est votre appréciation ?</Label>
                <div className="flex justify-center gap-2 py-2">
                    {[1,2,3,4,5].map(s => (
                        <button 
                            key={s} 
                            onClick={() => setStars(s)} 
                            className={`text-2xl transition-transform hover:scale-125 p-1 ${s <= stars ? 'grayscale-0 scale-110' : 'grayscale opacity-40'}`}
                            title={RATING_LEGEND[s]}
                        >
                            ⭐
                        </button>
                    ))}
                </div>
                <p className="text-sm text-center font-medium text-indigo-300 min-h-[20px] animate-in fade-in duration-200">
                    {RATING_LEGEND[stars]}
                </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                <Button size="sm" onClick={() => { onSubmit({ stars, comment: "" }); setOpen(false); }}>Valider la note</Button>
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
            setTimeLeft(`Attribution automatique dans : ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt]);

    if (!timeLeft || timeLeft === "Terminé") return null;

    return (
        <div className="text-xs text-indigo-300 font-mono tracking-tight bg-indigo-900/30 px-2 py-1 rounded border border-indigo-800/50">
            ⏱ {timeLeft}
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
    const [showDetails, setShowDetails] = useState(false);
    const [showBidForm, setShowBidForm] = useState(false);
    
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const categoryInfo = CATEGORIES.find(c => c.id === task.category);
    const scopeInfo = SCOPES.find(s => s.id === task.scope);
    const warrantyInfo = WARRANTY_OPTIONS.find(w => String(w.val) === String(task.warrantyDays));
    
    const lowestBid = task.bids?.length > 0 ? task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]) : null;

    const style = statusClasses[statusConfig.color] || { border: 'border-slate-600', text: 'text-slate-400', bg: 'bg-slate-800' };
    
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
    const creatorName = task.createdBy && usersMap ? (usersMap[task.createdBy] || task.createdBy) : task.createdBy;
    const validatorName = task.validatedBy && usersMap ? (usersMap[task.validatedBy] || task.validatedBy) : task.validatedBy;
    const rejectorName = task.rejections?.length > 0 
        ? (usersMap?.[task.rejections[task.rejections.length-1].by] || task.rejections[task.rejections.length-1].by)
        : 'Inconnu';
    
    const hasRated = task.ratings?.some(r => r.byHash === me.id);
    const isAssignee = task.awardedTo === me.email;

    let displayPrice = task.startingPrice;
    if (lowestBid) displayPrice = lowestBid.amount;
    if (task.awardedAmount) displayPrice = task.awardedAmount;

    // Action Button Logic
    let ActionButton = null;

    if (task.status === 'open' && me.role === 'owner') {
        if (canBid) {
            ActionButton = <Button size="sm" onClick={(e) => { e.stopPropagation(); setShowBidForm(!showBidForm); }} className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-md whitespace-nowrap">🚀 Faire une offre</Button>;
        } else {
             ActionButton = <span className="text-xs text-slate-500 italic whitespace-nowrap">Offre envoyée</span>;
        }
    } else if (canManualAward) {
        ActionButton = <Button size="sm" onClick={onAward} className="bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap">{isAdmin && isTimerRunning ? '⚡ Attribuer (Admin)' : '✅ Attribuer'}</Button>;
    } else if (task.status === 'awarded' && isAssignee && onRequestVerification) {
        ActionButton = <Button size="sm" onClick={onRequestVerification} className="bg-fuchsia-600 hover:bg-fuchsia-500 whitespace-nowrap">🏁 Terminé (Demander contrôle)</Button>;
    } else if (task.status === 'verification' && canVerify && onRejectWork) {
        ActionButton = (
            <div className="flex flex-col sm:flex-row gap-1 items-end">
                <Button size="sm" onClick={onComplete} className="bg-emerald-600 hover:bg-emerald-500 whitespace-nowrap">✅ Valider qualité</Button>
                <Button size="sm" onClick={onRejectWork} variant="destructive" className="whitespace-nowrap">❌ Refuser (Non conforme)</Button>
            </div>
        );
    } else if (task.status === 'pending' && onApprove && onReject) {
        ActionButton = (
             <div className="flex gap-1">
                <Button size="sm" onClick={onApprove} disabled={hasApproved && !isAdmin} className="bg-emerald-600 px-2">✅</Button>
                <Button size="sm" onClick={onReject} variant="destructive" className="px-2">❌</Button>
            </div>
        );
    }

    // Determine Quality Control Text
    let qualityStatusNode = <span className="italic opacity-50">En attente</span>;
    if (task.status === 'completed' && validatorName) {
        qualityStatusNode = <span>✅ Validé par <span className="text-emerald-400 font-medium">{validatorName}</span></span>;
    } else if (task.status === 'rejected' && rejectorName) {
        qualityStatusNode = <span>❌ Rejeté par <span className="text-rose-400 font-medium">{rejectorName}</span></span>;
    } else if (task.status === 'verification') {
        qualityStatusNode = <span className="text-fuchsia-400 font-medium">À vérifier (Contrôle demandé)</span>;
    } else if (task.status === 'awarded') {
        qualityStatusNode = <span className="text-sky-400">Travaux en cours</span>;
    }

    // Check if we are in the "Completed History" list to show the detailed summary line
    const isHistoryView = task.status === 'completed' || task.status === 'rejected';

    return (
        <Card className={`transition-all duration-300 border-l-[4px] ${style.border} bg-slate-800 hover:bg-slate-800/80`}>
            <div className="p-3 md:p-4">
                {/* ROW LAYOUT: ICON | TITLE & BADGES | PRICE | ACTION */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    
                    {/* LEFT: Icon & Main Info */}
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${style.text} ${style.bg} mt-1 sm:mt-0`}>
                            {React.cloneElement(statusConfig.icon, { className: 'h-4 w-4' })}
                        </div>
                        
                        <div className="flex flex-col min-w-0 gap-1 w-full">
                            {/* MAIN LINE: Title and Badges inline */}
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-sm md:text-base text-white truncate leading-tight mr-2">{task.title}</h3>
                                
                                <Badge className="bg-slate-900/50 text-slate-400 border-slate-700 gap-1">
                                    <MapPinIcon className="w-3 h-3" /> {task.location}
                                </Badge>
                                
                                {categoryInfo && (
                                    <Badge className={`${categoryInfo.colorClass} gap-1`}>
                                        {React.cloneElement(categoryInfo.icon, { className: 'w-3 h-3' })}
                                        {categoryInfo.label}
                                    </Badge>
                                )}
                                
                                {scopeInfo && (
                                    <Badge className={`${scopeInfo.colorClass} gap-1`}>
                                        {React.cloneElement(scopeInfo.icon, { className: 'w-3 h-3' })}
                                        {scopeInfo.label}
                                    </Badge>
                                )}

                                {warrantyInfo && (
                                    <Badge className={`${warrantyInfo.colorClass} gap-1`}>
                                        {React.cloneElement(warrantyInfo.icon, { className: 'w-3 h-3' })}
                                        {warrantyInfo.label}
                                    </Badge>
                                )}

                                {task.biddingStartedAt && task.status === 'open' && <Countdown startedAt={task.biddingStartedAt} />}
                            </div>
                            
                            {/* ALWAYS VISIBLE TRACEABILITY LINE */}
                            {isHistoryView ? (
                                <div className="text-[11px] text-slate-400 mt-1.5 flex flex-wrap gap-2 items-center">
                                    <span>Créé par <span className="text-slate-300">{creatorName}</span></span>
                                    <span className="text-slate-600">•</span>
                                    {task.awardedTo ? (
                                        <span>Attribué à <span className="text-slate-300">{awardedToName}</span></span>
                                    ) : (
                                        <span className="italic opacity-50">Non attribué</span>
                                    )}
                                    <span className="text-slate-600">•</span>
                                    <span>{qualityStatusNode}</span>
                                </div>
                            ) : (
                                // Default simple subtitle for active tasks
                                <div className="text-[11px] text-slate-400 mt-1.5">
                                    {task.details.substring(0, 60)}{task.details.length > 60 && '...'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Price & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
                         <div className="text-right">
                            <div className="font-mono font-bold text-base md:text-lg text-white">{displayPrice}€</div>
                            {task.status === 'open' && <div className="text-[9px] text-slate-500 uppercase">Offre</div>}
                        </div>
                        
                        {ActionButton}

                        {/* Rating Trigger for Completed tasks */}
                        {task.status === 'completed' && !hasRated && !isAssignee && (
                            <RatingBox onSubmit={onRate} />
                        )}
                        
                        <button onClick={() => setShowDetails(!showDetails)} className="text-xs text-slate-500 hover:text-white underline whitespace-nowrap ml-2">
                            {showDetails ? 'Masquer' : 'Détails'}
                        </button>
                    </div>
                </div>

                {/* INLINE BID FORM */}
                {showBidForm && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        <BidBox task={task} onBid={onBid} onCancel={() => setShowBidForm(false)} />
                    </div>
                )}

                {/* EXPANDABLE DETAILS */}
                {showDetails && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4 animate-in fade-in duration-200">
                        
                        {/* Description & Photo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             {task.photo && (
                                <div className="md:col-span-1 aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-700">
                                    <img src={task.photo} alt="Photo" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className={task.photo ? 'md:col-span-2' : 'md:col-span-3'}>
                                <p className="text-sm text-slate-300 bg-slate-900/30 p-3 rounded-lg border border-slate-800/50">{task.details || "Aucune description détaillée."}</p>
                            </div>
                        </div>
                        
                        {/* Bids List (Only if Open) */}
                        {task.status === 'open' && task.bids?.length > 0 && (
                             <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-500 uppercase">Historique des offres</div>
                                {task.bids.map((b, i) => (
                                    <div key={i} className="text-xs flex justify-between p-2 bg-slate-900/30 rounded border border-slate-800/50">
                                        <span className="text-slate-300">{b.amount}€ par {usersMap?.[b.by] || b.by}</span>
                                        <span className="text-slate-500">{new Date(b.plannedExecutionDate).toLocaleDateString()}</span>
                                    </div>
                                ))}
                             </div>
                        )}

                        {/* Ratings List */}
                        {task.status === 'completed' && (
                            <div className="border-t border-slate-800 pt-2">
                                {task.ratings?.map((r, i) => (
                                    <div key={i} className="bg-slate-950/50 p-2 rounded mb-2 text-sm flex justify-between group">
                                        <div>
                                            <div className="text-amber-400 text-xs tracking-widest" title={RATING_LEGEND[r.stars]}>{Array(r.stars).fill('⭐').join('')}</div>
                                            {r.comment && <p className="text-slate-300 italic">"{r.comment}"</p>}
                                        </div>
                                        {canDelete && onDeleteRating && (
                                            <button onClick={() => onDeleteRating(task.id, i)} className="text-rose-500 opacity-0 group-hover:opacity-100">Supprimer</button>
                                        )}
                                    </div>
                                ))}
                                {/* Show deleted ratings to admin */}
                                {task.deletedRatings && canDelete && (
                                    <div className="mt-2 border-t border-rose-900/20 pt-2">
                                        <p className="text-[10px] text-rose-500 font-bold uppercase">Avis supprimés</p>
                                        {task.deletedRatings.map((dr, i) => (
                                            <div key={i} className="text-[10px] text-slate-500 flex gap-2">
                                                <span>{new Date(dr.deletedAt).toLocaleDateString()}</span>
                                                <span className="italic">"{dr.comment}"</span>
                                                <span className="text-rose-400">par {usersMap?.[dr.deletedBy] || dr.deletedBy}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                         {/* Delete Button */}
                         {canDelete && (
                            <div className="flex justify-end">
                                <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-900/20" onClick={onDelete}>Supprimer la tâche</Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}