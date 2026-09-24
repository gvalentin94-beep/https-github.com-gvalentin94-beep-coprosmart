import React, { useState } from 'react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { RESIDENCES } from '../constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from './ui';
import { LegalModal, CGUContent, MentionsLegalesContent } from './LegalModals';

interface LoginCardProps {
  onLogin: (user: User) => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  const [mode, setMode] = useState<'login' | 'signUp' | 'forgotPassword'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [residence, setResidence] = useState(RESIDENCES[0]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Modals state
  const [showCGU, setShowCGU] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

  const getErrorMessage = (e: any) => {
      let msg = "";
      if (typeof e === 'string') msg = e;
      else if (e instanceof Error) msg = e.message;
      else if (e?.message) msg = e.message;
      else msg = "Erreur d'authentification.";
      if (msg.includes("Invalid login credentials")) return "Identifiants invalides.";
      return msg;
  };

  const handleLogin = async () => {
    try {
      setErr("");
      if (!email.trim()) {
        setErr("Veuillez saisir votre adresse email.");
        return;
      }
      const u = await api.login(email.trim(), password);
      onLogin(u);
    } catch (e) { setErr(getErrorMessage(e)); }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setErr("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (password !== confirmPassword) { 
      setErr("Mots de passe différents."); 
      return; 
    }
    try {
      setErr("");
      await api.signUp(email.trim(), password, role, firstName.trim(), lastName.trim(), residence);
      setSuccessMsg("Inscription enregistrée ! Un email a été envoyé à l'administrateur pour valider votre identité.");
      setTimeout(() => setMode('login'), 3500);
    } catch (e) { setErr(getErrorMessage(e)); }
  };

  const handleForgotPassword = async () => {
      try {
          setErr("");
          await api.requestPasswordReset(email.trim());
          setSuccessMsg("Lien de récupération envoyé (si le compte existe).");
      } catch (e) { setErr(getErrorMessage(e)); }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
        <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2">CoproSmart<span className="text-indigo-500">.</span></h1>
            <p className="text-base md:text-lg text-indigo-200 font-medium tracking-tight">On réduit collectivement nos charges de copropriété.</p>
        </div>

        <Card className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border-slate-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white text-center font-black uppercase text-xs tracking-widest">
                {mode === 'login' ? 'Connexion' : mode === 'signUp' ? 'Nouveau Compte' : 'Récupération'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {successMsg && <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-200 p-3 rounded-lg text-xs text-center">{successMsg}</div>}
                
                {mode === 'login' ? (
                    <>
                        <div className="space-y-1.5">
                          <Label>Email</Label>
                          <Input 
                            type="email" 
                            placeholder="ex: emile.zola@gmail.com"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <Label>Mot de passe</Label>
                            <button onClick={() => setMode('forgotPassword')} className="text-[10px] text-indigo-400 hover:underline">Oublié ?</button>
                          </div>
                          <Input 
                            type="password" 
                            placeholder="••••••••"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                          />
                        </div>
                        {err && <p className="text-xs text-rose-400 text-center font-medium">{err}</p>}
                        <Button className="w-full mt-4 font-bold" onClick={handleLogin}>Se connecter</Button>
                        <button className="w-full text-xs text-slate-400 hover:text-white mt-4 transition" onClick={() => setMode('signUp')}>Pas encore inscrit ? Créer un compte</button>
                    </>
                ) : mode === 'signUp' ? (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5"><Label>Prénom</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                            <div className="space-y-1.5"><Label>Nom</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                        </div>
                        <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="ex: emile.zola@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                        <div className="space-y-1.5">
                          <Label>Profil</Label>
                          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                            <option value="owner">Copropriétaire</option>
                            <option value="council">Membre du conseil syndical</option>
                          </Select>
                          <p className="text-[10px] text-slate-400">
                            {role === 'council' 
                              ? "Les membres du Conseil Syndical sont également copropriétaires et valident les travaux." 
                              : "Accédez aux chantiers, proposez des travaux et participez à la vie de l'immeuble."}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5"><Label>Mot de passe</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                          <div className="space-y-1.5"><Label>Confirmer</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                        </div>
                        <div className="space-y-1.5"><Label>Résidence</Label><Select value={residence} onChange={(e) => setResidence(e.target.value)}>{RESIDENCES.map(r => <option key={r} value={r}>{r}</option>)}</Select></div>
                        {err && <p className="text-xs text-rose-400 text-center font-medium">{err}</p>}
                        <Button className="w-full mt-4 font-bold" onClick={handleSignUp}>S'inscrire</Button>
                        <button className="w-full text-xs text-slate-400 hover:text-white mt-4 transition" onClick={() => setMode('login')}>Déjà un compte ? Connexion</button>
                    </>
                ) : (
                    <>
                        <div className="space-y-1.5"><Label>Email</Label><Input type="email" placeholder="ex: emile.zola@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                        {err && <p className="text-xs text-rose-400 text-center font-medium">{err}</p>}
                        <Button className="w-full mt-4" onClick={handleForgotPassword}>Récupérer</Button>
                        <button className="w-full text-xs text-slate-400 hover:text-white mt-4 transition" onClick={() => setMode('login')}>Retour à la connexion</button>
                    </>
                )}
            </CardContent>
        </Card>

        <div className="mt-8 text-center text-slate-500 text-xs px-6">
            <p className="mb-3 max-w-sm">Chaque ampoule changée, chaque porte réglée réduit vos charges communes. Simple, local, gagnant-gagnant.</p>
            <div className="flex justify-center gap-6">
                <button onClick={() => setShowCGU(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4">CGU</button>
                <button onClick={() => setShowMentions(true)} className="hover:text-indigo-400 underline decoration-slate-800 underline-offset-4">Mentions Légales</button>
            </div>
        </div>

        <LegalModal title="Conditions d'Utilisation" isOpen={showCGU} onClose={() => setShowCGU(false)}><CGUContent /></LegalModal>
        <LegalModal title="Mentions Légales" isOpen={showMentions} onClose={() => setShowMentions(false)}><MentionsLegalesContent /></LegalModal>
    </div>
  );
}
