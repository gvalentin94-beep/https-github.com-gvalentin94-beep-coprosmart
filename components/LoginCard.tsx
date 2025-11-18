
import React, { useState } from 'react';
import { fakeApi } from '../services/api';
import type { User, UserRole } from '../types';
import { ROLES } from '../constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from './ui';

interface LoginCardProps {
  onLogin: (user: User) => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [err, setErr] = useState("");

  const submit = async () => {
    try {
      setErr("");
      const u = await fakeApi.login(email.trim(), role);
      onLogin(u);
    } catch (e) {
      if (e instanceof Error) {
        setErr(e.message);
      } else {
        setErr("An unknown error occurred.");
      }
    }
  };

  return (
    <Card className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Se connecter à CoproSmart</CardTitle>
        <CardDescription className="text-slate-300">Entrez vos informations pour commencer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Email</Label>
          <Input
            placeholder="prenom@copro.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Rôle (prototype)</Label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-slate-700/50 border-slate-600 text-white focus:ring-indigo-400 focus:border-indigo-400"
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        {err && <p className="text-sm text-rose-400">{err}</p>}
        <div className="flex gap-3 pt-2">
          <Button className="flex-1" onClick={submit}>
            Continuer
          </Button>
          <Button variant="outline" className="flex-1 bg-transparent border-slate-500 text-slate-200 hover:bg-slate-700" onClick={submit}>
            Créer un compte
          </Button>
        </div>
        <p className="text-xs text-slate-400 pt-1">
          Le choix du rôle est uniquement pour le prototype. Aucune vraie
          authentification n’est encore branchée.
        </p>
      </CardContent>
    </Card>
  );
}
