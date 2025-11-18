
import React, { useState, useEffect } from 'react';
import type { Task, Me, Rating, Bid } from '../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Badge, Textarea } from './ui';
import { CATEGORIES, TASK_STATUS_CONFIG } from '../constants';

// --- Sub-components defined in the same file to keep file count low ---

// Fix: Statically define class names to ensure they are picked up by Tailwind's JIT compiler.
const statusClasses: { [key: string]: { border: string; text: string } } = {
    amber: { border: 'border-amber-400', text: 'text-amber-500' },
    indigo: { border: 'border-indigo-400', text: 'text-indigo-500' },
    sky: { border: 'border-sky-400', text: 'text-sky-500' },
    emerald: { border: 'border-emerald-400', text: 'text-emerald-500' },
    rose: { border: 'border-rose-400', text: 'text-rose-500' },
};

interface BidBoxProps {
    task: Task;
    onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
}

function BidBox({ task, onBid }: BidBoxProps) {
    const hasBids = task.bids?.length > 0;
    const currentPrice = hasBids ? Math.min(...task.bids.map(b => b.amount)) : task.startingPrice;
    
    const [amount, setAmount] = useState(String(currentPrice - 1));
    const [note, setNote] = useState("");
    const [plannedExecutionDate, setPlannedExecutionDate] = useState("");

    useEffect(() => {
        setAmount(String(currentPrice > 1 ? currentPrice - 1 : 1));
    }, [currentPrice, task.id]);

    const handleBid = () => {
        const val = Number(amount);
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
        setPlannedExecutionDate("");
    };

    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];
    
    return (
        <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/70">
            <div>
                <div className="text-xs text-slate-700 font-medium mb-1">Faire une offre (enchère inversée)</div>
                 <p className="text-xs text-slate-500">
                    Départ: <b className="text-slate-800">{task.startingPrice} €</b>
                    {hasBids && <> • Actuelle: <b className="text-indigo-600">{currentPrice} €</b></>}
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                    className="col-span-1"
                    type="number"
                    min="1"
                    max={currentPrice - 0.01}
                    step="0.01"
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
                className="w-full sm:w-auto"
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
        <div className="border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50/70">
            <div className="space-y-1">
                <Label>Note (1 à 5)</Label>
                <Input type="number" min="1" max="5" value={stars} onChange={(e) => setStars(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
                <Label>Commentaire (anonyme)</Label>
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
            const endTime = new Date(startedAt).getTime() + 48 * 60 * 60 * 1000;
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
        <div className="bg-indigo-50 text-indigo-800 p-2 rounded-lg text-sm font-medium text-center">
            ⏳ Attribution dans : <b className="font-mono">{timeLeft}</b>
        </div>
    );
}


// --- Main TaskCard Component ---

interface TaskCardProps {
  task: Task;
  me: Me;
  onBid: (bid: Omit<Bid, 'by' | 'at'>) => void;
  onAward: () => void;
  onComplete: () => void;
  onRate: (rating: Omit<Rating, 'at' | 'byHash'>) => void;
  onPayApartment: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function TaskCard({ task, me, onBid, onAward, onComplete, onRate, onPayApartment, onDelete, canDelete }: TaskCardProps) {
    const statusConfig = TASK_STATUS_CONFIG[task.status];
    const categoryInfo = CATEGORIES.find(c => c.id === task.category);
    const lowestBid = task.bids?.length > 0 ? task.bids.reduce((min, b) => b.amount < min.amount ? b : min, task.bids[0]) : null;

    const warrantyUntil = task.completionAt && task.warrantyDays
        ? new Date(new Date(task.completionAt).getTime() + task.warrantyDays * 24 * 3600 * 1000)
        : null;

    const colorClasses = statusClasses[statusConfig.color] || { border: 'border-slate-400', text: 'text-slate-500' };
    const borderColor = `border-l-4 ${colorClasses.border}`;
    
    const myBidsCount = task.bids.filter(b => b.by === me.email).length;
    const isFirstBidder = task.bids.length > 0 && task.bids[0].by === me.email;
    const canBid =
        (isFirstBidder && myBidsCount < 2) ||
        (!isFirstBidder && myBidsCount < 1);

    const BidArea = () => {
        if (task.status !== 'open' || me?.role !== 'owner' || me.email === task.createdBy) {
            return null;
        }

        if (canBid) {
            return <BidBox task={task} onBid={onBid} />;
        }
        
        return (
            <div className="bg-slate-100 text-slate-600 p-3 rounded-lg text-sm text-center">
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
                        <p className="text-xs text-slate-500">
                            Proposée par <span className="font-medium text-slate-600">{task.createdBy}</span> le {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                     <div className="flex items-center gap-2">
                        {categoryInfo && React.cloneElement(categoryInfo.icon, {className: "h-5 w-5 text-slate-400"})}
                        <Badge variant="secondary" className="font-mono text-sm">{task.startingPrice}€</Badge>
                     </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-slate-700">{task.details}</p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
                    <div className="flex items-center gap-2"><span className="text-slate-400">📍</span><span>{task.location || 'Non précisé'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-400">🛡️</span><span>Garantie: {task.warrantyDays} jours</span></div>
                    <div className="flex items-center gap-2"><span className="text-slate-400">{task.scope === 'copro' ? '🏢' : '🏠'}</span><span>{task.scope === 'copro' ? 'Charges communes' : 'Privatif'}</span></div>
                </div>
                
                {task.biddingStartedAt && task.status === 'open' && <Countdown startedAt={task.biddingStartedAt} />}

                {task.awardedTo && (
                    <div className="bg-sky-50 text-sky-800 p-3 rounded-lg text-sm">
                        🤝 Attribuée à <b>{task.awardedTo}</b> pour <b>{task.awardedAmount}€</b>
                    </div>
                )}

                <BidArea />

                {task.status === 'open' && task.bids?.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-700">Offres en cours</h4>
                        <ul className="space-y-1">
                            {task.bids.slice().sort((a,b) => a.amount - b.amount).map((b, i) => (
                                <li key={i} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm p-2 rounded-md ${i === 0 ? 'bg-indigo-50 text-indigo-800' : 'bg-slate-50'}`}>
                                    <div>
                                        <span className="font-semibold">{b.amount} €</span> <span className="text-slate-500 text-xs">par {b.by}</span>
                                        <div className="text-xs text-indigo-600/80 mt-1">🗓️ Prévu le: {new Date(b.plannedExecutionDate).toLocaleDateString()}</div>
                                    </div>
                                    <span className="text-xs text-slate-400 mt-1 sm:mt-0">{new Date(b.at).toLocaleDateString()}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {task.status === "open" && task.createdBy === me?.email && task.bids?.length > 0 && lowestBid && (
                    <Button size="sm" onClick={onAward}>✅ Attribuer au plus bas ({lowestBid.amount} €)</Button>
                )}

                {task.status === "awarded" && task.createdBy === me?.email && (
                    <div className="flex gap-2">
                        <Button size="sm" onClick={onComplete}>✅ Marquer comme terminé</Button>
                        {task.scope === "apartment" && <Button size="sm" variant="outline" onClick={onPayApartment}>💳 Payer en ligne</Button>}
                    </div>
                )}
                
                {task.status === "completed" && (
                    <div className="space-y-3">
                        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm">
                            ✅ Intervention terminée {warrantyUntil && `(garantie jusqu'au ${warrantyUntil.toLocaleDateString()})`}
                        </div>
                        <RatingBox onSubmit={onRate} />
                    </div>
                )}
                
                {task.status === "pending" && (
                     <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">
                        ⏳ En attente de validations du Conseil syndical. (Validations: {task.approvals?.length || 0})
                    </div>
                )}

                {canDelete && (
                    <div className="pt-3 border-t border-slate-100">
                        <Button size="sm" variant="destructive" onClick={onDelete}>🗑️ Supprimer</Button>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}