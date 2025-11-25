
import React, { useState } from 'react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { ROLES } from '../constants';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from './ui';

interface LoginCardProps {
  onLogin: (user: User) => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  // Modes: 'login', 'signUp', 'forgotPassword'
  const [mode, setMode] = useState<'login' | 'signUp' | 'forgotPassword'>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [residence, setResidence] = useState("Résidence Watteau");
  
  // Identity fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Helper to extract real error message from Supabase objects
  const getErrorMessage = (e: any) => {
      let msg = "";
      if (typeof e === 'string') msg = e;
      else if (e instanceof Error) msg = e.message;
      else if (e?.message) msg = e.message;
      else if (e?.error_description) msg = e.error_description;
      else msg = "Une erreur est survenue (" + JSON.stringify(e) + ")";

      // Friendly translation for RLS error
      if (msg.includes("row-level security")) {
          return "Erreur de configuration serveur (RLS). Contactez l'administrateur.";
      }
      if (msg.includes("User already registered")) {
          return "Cet email est déjà inscrit. Veuillez vous connecter.";
      }
      return msg;
  };

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRole("owner");
    setResidence("Résidence Watteau");
    setFirstName("");
    setLastName("");
    setErr("");
    setSuccessMsg("");
  };

  const handleLogin = async () => {
    try {
      setErr("");
      const u = await api.login(email.trim(), password);
      onLogin(u);
    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setErr("Les mots de passe ne correspondent pas.");
      return;
    }
    try {
      setErr("");
      // REVERTED: Standard pending status only
      await api.signUp(email.trim(), password, role, firstName.trim(), lastName.trim());
      
      setSuccessMsg("Compte créé ! En attente de validation par le Conseil Syndical.");
      setTimeout(() => {
          setMode('login');
          setSuccessMsg("Votre compte a été créé. Veuillez attendre la validation du CS avant de vous connecter.");
          setPassword(""); 
      }, 3000);

    } catch (e) {
      setErr(getErrorMessage(e));
    }
  };

  const handleForgotPassword = async () => {
      try {
          setErr("");
          // This triggers the real Supabase email flow
          await api.requestPasswordReset(email.trim());
          setSuccessMsg("Si cet email existe, un lien de réinitialisation a été envoyé. Vérifiez vos spams.");
          setTimeout(() => {
             setMode('login');
          }, 5000);
      } catch (e) {
          setErr(getErrorMessage(e));
      }
  };

  const switchTo = (m: 'login' | 'signUp' | 'forgotPassword') => {
    setMode(m);
    resetFields();
  };
  
  // Render Logic
  let cardTitle = "Bienvenue";
  
  if (mode === 'login') cardTitle = "Connexion";
  else if (mode === 'signUp') cardTitle = "Créer un compte";
  else if (mode === 'forgotPassword') cardTitle = "Récupération";

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
        
        {/* BIG HEADER OUTSIDE CARD */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-2">CoproSmart.</h1>
            <p className="text-lg md:text-xl text-indigo-200 font-bold tracking-tight">On réduit nos charges de copropriété.</p>
        </div>

        <Card className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border-slate-700 shadow-2xl">
        <CardHeader className="pb-2">
            <CardTitle className="text-white text-center text-xl font-black">{cardTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
            
            {/* SUCCESS MESSAGE */}
            {successMsg && (
                <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-200 p-3 rounded-lg text-sm mb-4 text-center">
                    {successMsg}
                </div>
            )}
            
            {/* LOGIN FORM */}
            {mode === 'login' && (
                <>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Email</Label>
                        <Input 
                            type="email" 
                            placeholder="prenom@copro.fr" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            className="!bg-white !text-slate-900"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <Label className="text-slate-300">Mot de passe</Label>
                            <button onClick={() => switchTo('forgotPassword')} className="text-xs text-indigo-400 hover:underline">Oublié ?</button>
                        </div>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className="!bg-white !text-slate-900"
                        />
                    </div>
                    {err && (
                        <div className="text-sm text-rose-400 bg-rose-900/20 p-2 rounded border border-rose-900/50 flex flex-col gap-2 text-center">
                            {err}
                        </div>
                    )}
                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-lg shadow-lg shadow-indigo-500/20" onClick={handleLogin}>Se connecter</Button>
                    <Button variant="outline" className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 mt-2" onClick={() => switchTo('signUp')}>
                        Créer un compte
                    </Button>
                </>
            )}

            {/* SIGN UP FORM */}
            {mode === 'signUp' && (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Prénom</Label>
                            <Input 
                                value={firstName} 
                                onChange={(e) => setFirstName(e.target.value)} 
                                className="!bg-white !text-slate-900"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Nom</Label>
                            <Input 
                                value={lastName} 
                                onChange={(e) => setLastName(e.target.value)} 
                                className="!bg-white !text-slate-900"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Email</Label>
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            className="!bg-white !text-slate-900"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Mot de passe</Label>
                        <Input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="!bg-white !text-slate-900"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Confirmer</Label>
                        <Input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            className="!bg-white !text-slate-900"
                        />
                    </div>
                    <div className="space-y-1.5">
                    <Label className="text-slate-300">Nom de la résidence</Label>
                    <Select
                        value={residence}
                        onChange={(e) => setResidence(e.target.value)}
                        className="!bg-white !text-slate-900"
                    >
                        <option value="Résidence Watteau">Résidence Watteau</option>
                    </Select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Rôle</Label>
                        <Select 
                            value={role} 
                            onChange={(e) => setRole(e.target.value as UserRole)} 
                            className="!bg-white !text-slate-900"
                        >
                            {/* Filter out 'admin' so new users cannot sign up as admin */}
                            {ROLES.filter(r => r.id !== 'admin').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </Select>
                    </div>
                    {err && (
                        <div className="text-sm text-rose-400 bg-rose-900/20 p-2 rounded border border-rose-900/50 flex flex-col gap-2 text-center">
                            {err}
                        </div>
                    )}
                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2" onClick={handleSignUp}>M'inscrire</Button>
                    <Button variant="outline" className="w-full bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 mt-2" onClick={() => switchTo('login')}>
                        Annuler
                    </Button>
                </>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgotPassword' && (
                <>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Email</Label>
                        <Input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            autoCapitalize="none"
                            autoComplete="email"
                            className="!bg-white !text-slate-900"
                        />
                    </div>
                    {err && <p className="text-sm text-rose-400 text-center">{err}</p>}
                    <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white" onClick={handleForgotPassword}>Envoyer le lien</Button>
                    <Button variant="ghost" className="w-full mt-2 text-slate-400 hover:text-white" onClick={() => switchTo('login')}>Retour</Button>
                </>
            )}

        </CardContent>
        </Card>

        {/* LOGIN FOOTER TEXT */}
        <div className="mt-12 text-center px-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="text-sm text-slate-400 leading-relaxed font-light">
            CoproSmart permet aux copropriétaires de réduire collectivement les charges communes en réalisant eux-mêmes les petits travaux des parties communes : une ampoule à changer, une porte à régler, des encombrants à évacuer… Les charges diminuent pour tous, et celui qui intervient bénéficie d’un crédit supplémentaire sur ses propres charges. <br/>
            <span className="font-black tracking-tighter text-white block mt-2 text-base">simple. local. gagnant-gagnant.</span>
            </p>
            <div className="flex justify-center gap-6 text-xs text-slate-600 mt-6">
                <button className="hover:text-slate-400 transition-colors">Conditions Générales d'Utilisation</button>
                <button className="hover:text-slate-400 transition-colors">Mentions Légales</button>
            </div>
        </div>
    </div>
  );
}
