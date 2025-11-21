
import React, { useState } from 'react';
import { api } from '../services/api';
import type { User, UserRole } from '../types';
import { ROLES } from '../constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from './ui';

interface LoginCardProps {
  onLogin: (user: User) => void;
}

export function LoginCard({ onLogin }: LoginCardProps) {
  // Modes: 'login', 'signUp', 'forgotPassword', 'resetPassword'
  const [mode, setMode] = useState<'login' | 'signUp' | 'forgotPassword' | 'resetPassword'>('login');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("owner");
  const [residence, setResidence] = useState("Résidence Watteau");
  
  // Identity fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Reset Flow
  const [resetToken, setResetToken] = useState("");
  const [simulatedToken, setSimulatedToken] = useState("");

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
          return "⚠️ Configuration requise : Vous devez exécuter les scripts SQL de sécurité dans Supabase pour autoriser l'inscription.";
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
    setResetToken("");
    setSimulatedToken("");
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
      await api.signUp(email.trim(), password, role, firstName.trim(), lastName.trim());
      // Do not auto-login. Show success message.
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
          const token = await api.requestPasswordReset(email.trim());
          setSimulatedToken(token);
          // Move to next step automatically for simulation
          setTimeout(() => {
             setMode('resetPassword');
             setResetToken(token); 
          }, 2000);
      } catch (e) {
          setErr(getErrorMessage(e));
      }
  };

  const handleResetPassword = async () => {
      if (password !== confirmPassword) {
          setErr("Les mots de passe ne correspondent pas.");
          return;
      }
      try {
          setErr("");
          await api.resetPassword(resetToken, password);
          setSuccessMsg("Mot de passe modifié ! Vous pouvez vous connecter.");
          setTimeout(() => {
              setMode('login');
              resetFields();
          }, 2000);
      } catch (e) {
          setErr(getErrorMessage(e));
      }
  };

  const switchTo = (m: 'login' | 'signUp' | 'forgotPassword') => {
    setMode(m);
    resetFields();
  };
  
  // Render Logic
  let title = "Se connecter à CoproSmart";
  let desc = "Entrez vos informations pour commencer.";
  
  if (mode === 'signUp') {
      title = "Créer un compte";
      desc = "Renseignez vos informations. Validation requise.";
  } else if (mode === 'forgotPassword') {
      title = "Mot de passe oublié";
      desc = "Entrez votre email pour recevoir un code.";
  } else if (mode === 'resetPassword') {
      title = "Réinitialiser le mot de passe";
      desc = "Entrez le code reçu et votre nouveau mot de passe.";
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-slate-300">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* SUCCESS MESSAGE */}
        {successMsg && (
            <div className="bg-emerald-900/30 border border-emerald-800 text-emerald-200 p-3 rounded-lg text-sm mb-4">
                {successMsg}
            </div>
        )}

        {/* SIMULATED EMAIL FOR FORGOT PASSWORD */}
        {mode === 'forgotPassword' && simulatedToken && (
            <div className="bg-indigo-900/30 border border-indigo-800 text-indigo-200 p-3 rounded-lg text-sm mb-4 animate-pulse">
                📧 <b>Email simulé:</b> Votre code est <b>{simulatedToken}</b>
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
                    />
                </div>
                {err && <p className="text-sm text-rose-400 bg-rose-900/20 p-2 rounded border border-rose-900/50">{err}</p>}
                <Button className="w-full mt-2" onClick={handleLogin}>Continuer</Button>
                <Button variant="outline" className="w-full bg-transparent border-slate-500 text-slate-200 hover:bg-slate-700 mt-2" onClick={() => switchTo('signUp')}>
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
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Nom</Label>
                        <Input 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
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
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-300">Mot de passe</Label>
                    <Input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-300">Confirmer le mot de passe</Label>
                    <Input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nom de la résidence</Label>
                  <Select
                    value={residence}
                    onChange={(e) => setResidence(e.target.value)}
                  >
                    <option value="Résidence Watteau">Résidence Watteau</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-300">Rôle</Label>
                    <Select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value as UserRole)} 
                    >
                        {/* Filter out 'admin' so new users cannot sign up as admin */}
                        {ROLES.filter(r => r.id !== 'admin').map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </Select>
                </div>
                {err && <p className="text-sm text-rose-400 bg-rose-900/20 p-2 rounded border border-rose-900/50">{err}</p>}
                <Button className="w-full mt-2" onClick={handleSignUp}>Créer mon compte</Button>
                <Button variant="outline" className="w-full bg-transparent border-slate-500 text-slate-200 hover:bg-slate-700 mt-2" onClick={() => switchTo('login')}>
                    Retour à la connexion
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
                    />
                </div>
                {err && <p className="text-sm text-rose-400">{err}</p>}
                <Button className="w-full mt-2" onClick={handleForgotPassword}>Envoyer le code</Button>
                <Button variant="ghost" className="w-full mt-2" onClick={() => switchTo('login')}>Annuler</Button>
             </>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'resetPassword' && (
             <>
                <div className="space-y-1.5">
                    <Label className="text-slate-300">Code de vérification</Label>
                    <Input 
                        type="text" 
                        value={resetToken} 
                        onChange={(e) => setResetToken(e.target.value)} 
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-300">Nouveau mot de passe</Label>
                    <Input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-300">Confirmer</Label>
                    <Input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                    />
                </div>
                {err && <p className="text-sm text-rose-400">{err}</p>}
                <Button className="w-full mt-2" onClick={handleResetPassword}>Changer le mot de passe</Button>
             </>
        )}

      </CardContent>
    </Card>
  );
}
