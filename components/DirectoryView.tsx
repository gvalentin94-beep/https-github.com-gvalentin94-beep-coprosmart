import React, { useState } from 'react';
import type { RegisteredUser, User } from '../types';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from './ui';
import { ROLES } from '../constants';

interface DirectoryViewProps {
  users: RegisteredUser[];
  pendingUsers: RegisteredUser[];
  currentUser: User;
  onApproveUser: (email: string) => Promise<void>;
  onInviteUser?: (email: string) => Promise<void>;
  onDeleteUser?: (email: string) => Promise<void>;
}

export function DirectoryView({ users, pendingUsers, currentUser, onApproveUser, onInviteUser, onDeleteUser }: DirectoryViewProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const canManageUsers = currentUser.role === 'admin' || currentUser.role === 'council';

  const filteredUsers = users.filter(u => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadges = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1">
            <Badge className="bg-purple-600 text-white border-purple-500 text-[10px]">👑 Admin</Badge>
            <Badge className="bg-indigo-600/80 text-white border-indigo-500 text-[10px]">🛡️ CS</Badge>
            <Badge className="bg-sky-700 text-sky-100 border-sky-600 text-[10px]">👤 Copro</Badge>
          </div>
        );
      case 'council':
        return (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1">
            <Badge className="bg-indigo-600 text-white border-indigo-500 text-[10px]">🛡️ Conseil Syndical</Badge>
            <Badge className="bg-sky-700 text-sky-100 border-sky-600 text-[10px]">👤 Copro</Badge>
          </div>
        );
      case 'owner':
      default:
        return <Badge className="bg-sky-700 text-sky-100 border-sky-600 text-[10px]">👤 Copropriétaire</Badge>;
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !onInviteUser) return;
    try {
      await onInviteUser(inviteEmail.trim());
      setInviteSuccess(`Invitation envoyée à ${inviteEmail} !`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(''), 4000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Validation Section for Council & Admin */}
      {canManageUsers && pendingUsers.length > 0 && (
        <Card className="bg-amber-950/20 border-amber-800/60 shadow-lg">
          <CardHeader className="bg-amber-950/40 border-b border-amber-900/40">
            <CardTitle className="text-amber-300 text-sm flex items-center gap-2">
              ⏳ Demandes d'adhésion en attente ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-amber-200/80">
              Vérifiez l'identité de chaque personne avant de valider son accès à la copropriété.
            </p>
            <div className="divide-y divide-amber-900/40 border border-amber-900/40 rounded-lg overflow-hidden bg-slate-900/40">
              {pendingUsers.map(u => (
                <div key={u.id || u.email} className="p-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>👤 {u.firstName} {u.lastName}</span>
                      <Badge className="bg-amber-800/80 text-amber-200 border-amber-600 text-[10px]">
                        {u.role === 'council' ? '🛡️ CS & Copropriétaire' : '👤 Copropriétaire'}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {u.email} • {u.residence || 'Résidence Watteau'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      onClick={() => onApproveUser(u.email)}
                    >
                      Valider l'accès
                    </Button>
                    {currentUser.role === 'admin' && onDeleteUser && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs px-2"
                        title="Refuser et supprimer la demande"
                        onClick={() => {
                          if (window.confirm(`Refuser et supprimer la demande de ${u.firstName} ${u.lastName} ?`)) {
                            onDeleteUser(u.email);
                          }
                        }}
                      >
                        Refuser
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directory Main List */}
      <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
        <CardHeader className="bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white text-lg">👥 Annuaire des résidents</CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              {users.length} résident{users.length > 1 ? 's' : ''} inscrit{users.length > 1 ? 's' : ''} dans votre copropriété.
            </p>
          </div>
          {onInviteUser && (
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="inviter un voisin..."
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-8 text-xs w-48"
              />
              <Button type="submit" size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500">
                Inviter
              </Button>
            </form>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {inviteSuccess && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-lg text-center">
              {inviteSuccess}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs text-xs"
            />
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                  roleFilter === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Tous ({users.length})
              </button>
              {ROLES.map(r => {
                const count = users.filter(u => u.role === r.id).length;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleFilter(r.id)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                      roleFilter === r.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    {r.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {filteredUsers.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-slate-500 text-sm">
                Aucun résident ne correspond à votre recherche.
              </div>
            ) : (
              filteredUsers.map(u => (
                <div
                  key={u.id || u.email}
                  className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-slate-700 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-lg">
                      {u.avatar || '👤'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {u.firstName} {u.lastName}
                        {u.email === currentUser.email && (
                          <span className="text-[10px] text-indigo-400 font-mono">(vous)</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadges(u.role)}
                    {currentUser.role === 'admin' && onDeleteUser && u.email !== currentUser.email && (
                      <button
                        className="text-rose-500 hover:text-rose-400 p-1 text-xs opacity-60 hover:opacity-100 transition rounded hover:bg-rose-950/40"
                        title="Supprimer l'utilisateur"
                        onClick={() => {
                          if (window.confirm(`Supprimer définitivement l'utilisateur ${u.firstName} ${u.lastName} (${u.email}) ?`)) {
                            onDeleteUser(u.email);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
