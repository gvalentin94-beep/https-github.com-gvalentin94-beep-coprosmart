import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Label } from './ui';
import { CATEGORIES, SCOPES, LOCATIONS, WARRANTY_OPTIONS, MAX_TASK_PRICE } from '../constants';
import type { TaskCategory, TaskScope } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onSubmit: (taskData: {
    title: string;
    category: TaskCategory;
    scope: TaskScope;
    location: string;
    startingPrice: number;
    warrantyDays: number;
    details: string;
    status?: 'open' | 'pending';
  }) => Promise<void>;
}

export function CreateTaskModal({ isOpen, onClose, onSubmit, isAdmin = false }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('ampoule');
  const [scope, setScope] = useState<TaskScope>('copro');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState('');
  const [price, setPrice] = useState('20');
  const [warrantyDays, setWarrantyDays] = useState('30');
  const [details, setDetails] = useState('');
  const [directOpen, setDirectOpen] = useState(isAdmin);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Veuillez indiquer un titre pour la tâche.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Veuillez renseigner un montant positif.');
      return;
    }

    if (!isAdmin && numPrice > MAX_TASK_PRICE) {
      setError(`Le montant maximum autorisé est de ${MAX_TASK_PRICE} €.`);
      return;
    }

    const finalLocation = location === 'Autre' ? customLocation.trim() || 'Parties communes' : location;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        scope,
        location: finalLocation,
        startingPrice: numPrice,
        warrantyDays: Number(warrantyDays),
        details: details.trim(),
        status: isAdmin && directOpen ? 'open' : 'pending'
      });
      // Reset form
      setTitle('');
      setDetails('');
      setPrice('20');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création de la tâche.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl my-8">
        <CardHeader className="flex flex-row justify-between items-center border-b border-slate-800">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            ✨ Nouvelle demande de travaux
          </CardTitle>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 text-lg">✕</button>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Titre de la tâche *</Label>
              <Input
                placeholder="ex: Changement ampoule LED hall A"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Type d'intervention</Label>
                <Select value={scope} onChange={(e) => setScope(e.target.value as TaskScope)}>
                  {SCOPES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Localisation</Label>
                <Select value={location} onChange={(e) => setLocation(e.target.value)}>
                  {LOCATIONS.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                  <option value="Autre">Autre...</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Prix initial proposé (€)</Label>
                <Input
                  type="number"
                  min="1"
                  max={MAX_TASK_PRICE}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            {location === 'Autre' && (
              <div className="space-y-1.5">
                <Label>Préciser la localisation</Label>
                <Input
                  placeholder="ex: Toit terrasse, Local vélos B..."
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Garantie demandée après réalisation</Label>
              <Select value={warrantyDays} onChange={(e) => setWarrantyDays(e.target.value)}>
                {WARRANTY_OPTIONS.map(w => (
                  <option key={w.val} value={w.val}>{w.label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Description des besoins / consignes</Label>
              <Textarea
                placeholder="Précisez le problème, les éventuels outils ou fournitures disponibles..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
              />
            </div>

            {isAdmin && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-700/50 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-200">👑 Option Administrateur : Validation immédiate</div>
                  <div className="text-[11px] text-slate-400">Publier directement dans "Travaux en cours" sans passer par l'étape de validation CS</div>
                </div>
                <input
                  type="checkbox"
                  checked={directOpen}
                  onChange={(e) => setDirectOpen(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Publication...' : 'Publier la demande'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
