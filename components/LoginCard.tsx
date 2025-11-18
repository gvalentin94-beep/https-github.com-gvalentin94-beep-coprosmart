
import React, { useState } from 'react';
import { fakeApi } from '../services/api';
import type { User, UserRole } from '../types';
import { ROLES } from '../constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from './ui';

interface LoginCardProps {
  onLogin: (user: User) => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [err, setErr] = useState("");

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("owner");
    setErr("");
  };

  const handleLogin = async () => {
    try {
      setErr("");
      const u = await fakeApi.login(email.trim(), password);
      onLogin(u);
    } catch (e) {
      if (e instanceof Error) setErr(e.message);
      else setErr("Une erreur inconnue est survenue.");
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setErr("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      setErr("");
      const u = await fakeApi.signUp(email.trim(), password, role);
      onLogin(u);
    } catch (e) {
      if (e instanceof Error) setErr(e.message);
      else setErr("Une erreur inconnue est survenue.");
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetFields();
  };
  
  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">{isSignUp ? "Créer un compte" : "Se connecter à CoproSmart"}</CardTitle>
        <CardDescription className="text-slate-300">
          {isSignUp ? "Renseignez vos informations pour vous inscrire." : "Entrez vos informations pour commencer."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300">Email</Label>
          <Input
            type="email"
            placeholder="prenom@copro.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white border-slate-300 text-black placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300">Mot de passe</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white border-slate-300 text-black placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {isSignUp && (
          <>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Confirmer le mot de passe</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white border-slate-300 text-black placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Rôle</Label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-white border-slate-300 text-black focus:ring-indigo-500 focus:border-indigo-500"
              >
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </Select>
            </div>
          </>
        )}
        {err && <p className="text-sm text-rose-400">{err}</p>}
        <div className="flex flex-col gap-3 pt-2">
          <Button className="w-full" onClick={isSignUp ? handleSignUp : handleLogin}>
            {isSignUp ? "Créer mon compte" : "Continuer"}
          </Button>
          <Button variant="outline" className="w-full bg-transparent border-slate-500 text-slate-200 hover:bg-slate-700" onClick={toggleMode}>
            {isSignUp ? "Déjà un compte ? Se connecter" : "Créer un compte"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}