import type { Task, LedgerEntry, User, RegisteredUser } from '../types';

const INITIAL_USERS: RegisteredUser[] = [
  {
    id: 'usr-admin-1',
    email: 'g.valentin94@gmail.com',
    firstName: 'Guillaume',
    lastName: 'VALENTIN',
    role: 'admin',
    residence: 'Résidence Watteau',
    status: 'active'
  },
  {
    id: 'usr-cs-1',
    email: 'victor.hugo@coprosmart.fr',
    firstName: '[test] Victor',
    lastName: 'HUGO',
    role: 'council',
    residence: 'Résidence Watteau',
    status: 'active'
  },
  {
    id: 'usr-cs-2',
    email: 'emile.zola@coprosmart.fr',
    firstName: '[test] Émile',
    lastName: 'ZOLA',
    role: 'council',
    residence: 'Résidence Watteau',
    status: 'active'
  },
  {
    id: 'usr-owner-1',
    email: 'gustave.flaubert@coprosmart.fr',
    firstName: '[test] Gustave',
    lastName: 'FLAUBERT',
    role: 'owner',
    residence: 'Résidence Watteau',
    status: 'active'
  },
  {
    id: 'usr-owner-2',
    email: 'george.sand@coprosmart.fr',
    firstName: '[test] George',
    lastName: 'SAND',
    role: 'owner',
    residence: 'Résidence Watteau',
    status: 'active'
  },
  {
    id: 'usr-pending-1',
    email: 'marcel.proust@coprosmart.fr',
    firstName: '[test] Marcel',
    lastName: 'PROUST',
    role: 'owner',
    residence: 'Résidence Watteau',
    status: 'pending'
  }
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-001',
    title: '[Exemple] Remplacement ampoule LED Hall A',
    category: 'ampoule',
    scope: 'copro',
    location: 'Bâtiment A',
    startingPrice: 15,
    warrantyDays: 30,
    status: 'open',
    residence: 'Résidence Watteau',
    createdBy: 'victor.hugo@coprosmart.fr',
    createdById: 'usr-cs-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    biddingStartedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    details: "L'ampoule principale du hall du bâtiment A clignote. Ampoule de rechange disponible dans le local technique ou à déduire.",
    bids: [
      {
        id: 'bid-1',
        userId: 'usr-owner-1',
        by: 'gustave.flaubert@coprosmart.fr',
        amount: 12,
        note: 'Je peux faire le changement ce soir.',
        at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        plannedExecutionDate: new Date().toISOString().split('T')[0]
      }
    ],
    approvals: [
      { by: 'victor.hugo@coprosmart.fr', at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
      { by: 'g.valentin94@gmail.com', at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() }
    ],
    rejections: [],
    ratings: []
  },
  {
    id: 'tsk-002',
    title: '[Exemple] Réglage groom porte d\'accès caves',
    category: 'porte',
    scope: 'copro',
    location: 'Caves',
    startingPrice: 30,
    warrantyDays: 180,
    status: 'verification',
    residence: 'Résidence Watteau',
    createdBy: 'victor.hugo@coprosmart.fr',
    createdById: 'usr-cs-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    biddingStartedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    awardedTo: 'gustave.flaubert@coprosmart.fr',
    awardedToId: 'usr-owner-1',
    awardedAmount: 25,
    details: 'Le ferme-porte claque violemment la nuit. Réglage de la vis de temporisation et graissage des gonds effectué.',
    bids: [
      {
        id: 'bid-2',
        userId: 'usr-owner-1',
        by: 'gustave.flaubert@coprosmart.fr',
        amount: 25,
        note: 'Jeu de clés Allen et graisse silicone adaptés.',
        at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        plannedExecutionDate: new Date().toISOString().split('T')[0]
      }
    ],
    approvals: [
      { by: 'victor.hugo@coprosmart.fr', at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString() },
      { by: 'g.valentin94@gmail.com', at: new Date(Date.now() - 1000 * 60 * 60 * 21).toISOString() }
    ],
    rejections: [],
    ratings: []
  },
  {
    id: 'tsk-003',
    title: '[Exemple] Dépôt encombrants déchetterie',
    category: 'encombrants',
    scope: 'copro',
    location: 'Extérieurs',
    startingPrice: 40,
    warrantyDays: 0,
    status: 'pending',
    residence: 'Résidence Watteau',
    createdBy: 'george.sand@coprosmart.fr',
    createdById: 'usr-owner-2',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    details: 'Quelques cartons volumineux et 2 vieilles chaises laissés au local poubelle à emmener à la déchetterie municipale.',
    bids: [],
    approvals: [
      { by: 'victor.hugo@coprosmart.fr', at: new Date(Date.now() - 1000 * 60 * 30).toISOString() }
    ],
    rejections: [],
    ratings: []
  },
  {
    id: 'tsk-004',
    title: '[Exemple] Remplacement néon parking niveau -1',
    category: 'ampoule',
    scope: 'copro',
    location: 'Parking',
    startingPrice: 20,
    warrantyDays: 30,
    status: 'completed',
    residence: 'Résidence Watteau',
    createdBy: 'g.valentin94@gmail.com',
    createdById: 'usr-admin-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    awardedTo: 'gustave.flaubert@coprosmart.fr',
    awardedToId: 'usr-owner-1',
    awardedAmount: 18,
    completionAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    validatedBy: 'usr-cs-1',
    details: 'Tube néon grillé au-dessus de l\'emplacement 14. Changé avec starter neuf.',
    bids: [
      {
        id: 'bid-4',
        userId: 'usr-owner-1',
        by: 'gustave.flaubert@coprosmart.fr',
        amount: 18,
        note: 'Tube et starter fournis',
        at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
        plannedExecutionDate: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString().split('T')[0]
      }
    ],
    approvals: [
      { by: 'victor.hugo@coprosmart.fr', at: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString() },
      { by: 'g.valentin94@gmail.com', at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString() }
    ],
    rejections: [],
    ratings: [
      {
        stars: 5,
        comment: 'Très réactif et travail impeccable !',
        at: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
        byHash: 'usr-cs-1'
      }
    ]
  }
];

const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'led-001',
    taskId: 'tsk-004',
    residence: 'Résidence Watteau',
    type: 'charge_credit',
    payer: 'Copro',
    payee: 'gustave.flaubert@coprosmart.fr',
    amount: 18,
    at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    taskTitle: '[Exemple] Remplacement néon parking niveau -1',
    taskCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

function loadStorage<T>(key: string, defaultVal: T): T {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
}

// Nettoyage et initialisation automatique pour la phase de test
if (typeof window !== 'undefined') {
  try {
    const rawUsers = localStorage.getItem('coprosmart_users');
    if (rawUsers) {
      const parsed = JSON.parse(rawUsers) as RegisteredUser[];
      // Si plusieurs comptes ont g.valentin94@gmail.com ou s'il reste des traces de test
      const gvAccounts = parsed.filter(u => u.email.toLowerCase() === 'g.valentin94@gmail.com');
      const hasOldAdmin = parsed.some(u => u.email.toLowerCase() === 'admin@coprosmart.fr');
      if (gvAccounts.length > 1 || hasOldAdmin) {
        // Conserver uniquement les comptes valides avec un seul compte pour g.valentin94@gmail.com
        const cleaned = parsed.filter(u => {
          if (u.email.toLowerCase() === 'admin@coprosmart.fr') return false;
          if (u.email.toLowerCase() === 'g.valentin94@gmail.com') {
            return u.id === 'usr-admin-1' || u.role === 'admin';
          }
          return true;
        });
        localStorage.setItem('coprosmart_users', JSON.stringify(cleaned));
      }
    }
    const currentUser = localStorage.getItem('coprosmart_current_user');
    if (currentUser && (currentUser.includes('admin@coprosmart.fr') || currentUser.includes('[test] Guillaume'))) {
      localStorage.setItem('coprosmart_current_user', JSON.stringify({
        id: 'usr-admin-1',
        email: 'g.valentin94@gmail.com',
        firstName: 'Guillaume',
        lastName: 'VALENTIN',
        role: 'admin',
        residence: 'Résidence Watteau'
      }));
    }
  } catch (e) {
    // ignore
  }
}

function saveStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

export const mockStore = {
  getUsers: (): RegisteredUser[] => {
    let stored = loadStorage<RegisteredUser[]>('coprosmart_users', INITIAL_USERS);
    // Supprime tout compte en doublon ayant g.valentin94@gmail.com autre que Guillaume VALENTIN admin
    const gValentinCount = stored.filter(u => u.email.toLowerCase() === 'g.valentin94@gmail.com').length;
    if (gValentinCount > 1) {
      stored = stored.filter(u => {
        if (u.email.toLowerCase() === 'g.valentin94@gmail.com') {
          return u.id === 'usr-admin-1' || u.role === 'admin';
        }
        return true;
      });
      mockStore.setUsers(stored);
    }
    // Ensure all INITIAL_USERS are present and up to date in stored (match by ID or Email)
    const existingIds = new Set(stored.map(u => u.id));
    let updated = false;

    // Nettoyer les anciens emails obsolètes (cs@coprosmart.fr, thomas@coprosmart.fr, etc.)
    const oldEmailMap: Record<string, string> = {
      'cs@coprosmart.fr': 'victor.hugo@coprosmart.fr',
      'cs2@coprosmart.fr': 'emile.zola@coprosmart.fr',
      'thomas@coprosmart.fr': 'gustave.flaubert@coprosmart.fr',
      'sophie@coprosmart.fr': 'george.sand@coprosmart.fr',
      'marc.moreau@coprosmart.fr': 'marcel.proust@coprosmart.fr'
    };

    stored = stored.map(u => {
      if (oldEmailMap[u.email.toLowerCase()]) {
        updated = true;
        const mappedEmail = oldEmailMap[u.email.toLowerCase()];
        const matchedInit = INITIAL_USERS.find(iu => iu.email.toLowerCase() === mappedEmail.toLowerCase());
        return matchedInit ? { ...u, email: matchedInit.email, firstName: matchedInit.firstName, lastName: matchedInit.lastName } : { ...u, email: mappedEmail };
      }
      return u;
    });

    for (const initUser of INITIAL_USERS) {
      const idx = stored.findIndex(u => u.id === initUser.id || u.email.toLowerCase() === initUser.email.toLowerCase());
      if (idx === -1) {
        stored.push(initUser);
        updated = true;
      } else {
        let itemUpdated = false;
        if (stored[idx].email !== initUser.email) {
          stored[idx].email = initUser.email;
          itemUpdated = true;
        }
        if (stored[idx].firstName !== initUser.firstName || stored[idx].lastName !== initUser.lastName) {
          stored[idx].firstName = initUser.firstName;
          stored[idx].lastName = initUser.lastName;
          itemUpdated = true;
        }
        if (initUser.role === 'admin' && stored[idx].status !== 'active') {
          stored[idx].status = 'active';
          itemUpdated = true;
        }
        if (initUser.role && stored[idx].role !== initUser.role) {
          stored[idx].role = initUser.role;
          itemUpdated = true;
        }
        if ((initUser.role === 'admin' || initUser.role === 'council') && stored[idx].status !== 'active') {
          stored[idx].status = 'active';
          itemUpdated = true;
        }
        if (itemUpdated) updated = true;
      }
    }
    if (updated) {
      mockStore.setUsers(stored);
    }
    return stored;
  },
  setUsers: (users: RegisteredUser[]) => saveStorage('coprosmart_users', users),

  getTasks: (): Task[] => {
    const tasks = loadStorage<Task[]>('coprosmart_tasks', INITIAL_TASKS);
    let updated = false;
    for (const initTask of INITIAL_TASKS) {
      const idx = tasks.findIndex(t => t.id === initTask.id);
      if (idx !== -1 && tasks[idx].title !== initTask.title) {
        tasks[idx].title = initTask.title;
        updated = true;
      }
    }
    if (updated) {
      mockStore.setTasks(tasks);
    }
    return tasks;
  },
  setTasks: (tasks: Task[]) => saveStorage('coprosmart_tasks', tasks),

  getLedger: (): LedgerEntry[] => {
    const ledger = loadStorage<LedgerEntry[]>('coprosmart_ledger', INITIAL_LEDGER);
    let updated = false;
    for (const initEntry of INITIAL_LEDGER) {
      const idx = ledger.findIndex(e => e.id === initEntry.id);
      if (idx !== -1 && ledger[idx].taskTitle !== initEntry.taskTitle) {
        ledger[idx].taskTitle = initEntry.taskTitle;
        updated = true;
      }
    }
    if (updated) {
      mockStore.setLedger(ledger);
    }
    return ledger;
  },
  setLedger: (ledger: LedgerEntry[]) => saveStorage('coprosmart_ledger', ledger),

  findUserByEmail: (email: string) => {
    const users = mockStore.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  addUser: (user: RegisteredUser) => {
    const users = mockStore.getUsers();
    users.push(user);
    mockStore.setUsers(users);
  },

  approveUser: (email: string) => {
    const users = mockStore.getUsers();
    const updated = users.map(u => u.email === email ? { ...u, status: 'active' as const } : u);
    mockStore.setUsers(updated);
  },

  deleteUser: (email: string) => {
    const users = mockStore.getUsers();
    const updated = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    mockStore.setUsers(updated);
  },

  createTask: (taskData: Partial<Task>, uid: string, res: string): string => {
    const tasks = mockStore.getTasks();
    const users = mockStore.getUsers();
    const author = users.find(u => u.id === uid);
    const id = `tsk-${Date.now()}`;
    const newTask: Task = {
      id,
      title: taskData.title || 'Nouvelle tâche',
      category: taskData.category || 'divers',
      scope: taskData.scope || 'copro',
      details: taskData.details || '',
      location: taskData.location || 'Parties communes',
      startingPrice: Number(taskData.startingPrice) || 20,
      warrantyDays: Number(taskData.warrantyDays) || 0,
      status: taskData.status || 'pending',
      residence: res,
      createdBy: author?.email || 'Inconnu',
      createdById: uid,
      createdAt: new Date().toISOString(),
      bids: [],
      approvals: [],
      rejections: [],
      ratings: [],
      photo: taskData.photo
    };
    tasks.unshift(newTask);
    mockStore.setTasks(tasks);
    return id;
  },

  updateTaskStatus: (tid: string, status: Task['status'], extras: any = {}) => {
    const tasks = mockStore.getTasks();
    const idx = tasks.findIndex(t => t.id === tid);
    if (idx === -1) return;
    const t = { ...tasks[idx], status };
    if (extras.awardedTo) t.awardedTo = extras.awardedTo;
    if (extras.awardedAmount) t.awardedAmount = extras.awardedAmount;
    if (extras.validatedBy) t.validatedBy = extras.validatedBy;
    if (status === 'completed') t.completionAt = new Date().toISOString();
    tasks[idx] = t;
    mockStore.setTasks(tasks);
  },

  updateTaskDetails: (tid: string, details: string) => {
    const tasks = mockStore.getTasks();
    const idx = tasks.findIndex(t => t.id === tid);
    if (idx !== -1) {
      tasks[idx].details = details;
      mockStore.setTasks(tasks);
    }
  },

  deleteTask: (tid: string) => {
    const tasks = mockStore.getTasks().filter(t => t.id !== tid);
    mockStore.setTasks(tasks);
  },

  addBid: (tid: string, bid: any, uid: string) => {
    const tasks = mockStore.getTasks();
    const users = mockStore.getUsers();
    const user = users.find(u => u.id === uid);
    const idx = tasks.findIndex(t => t.id === tid);
    if (idx === -1) return;

    const newBid = {
      id: `bid-${Date.now()}`,
      userId: uid,
      by: user?.email || uid,
      amount: bid.amount,
      note: bid.note || '',
      at: new Date().toISOString(),
      plannedExecutionDate: bid.plannedExecutionDate
    };

    tasks[idx].bids = [newBid, ...(tasks[idx].bids || [])];
    if (!tasks[idx].biddingStartedAt) {
      tasks[idx].biddingStartedAt = new Date().toISOString();
    }
    mockStore.setTasks(tasks);
  },

  addApproval: (tid: string, uid: string) => {
    const tasks = mockStore.getTasks();
    const users = mockStore.getUsers();
    const user = users.find(u => u.id === uid);
    const idx = tasks.findIndex(t => t.id === tid);
    if (idx === -1 || !user) return;

    // Le créateur ne peut pas approuver son propre chantier
    if (tasks[idx].createdBy?.toLowerCase() === user.email.toLowerCase() || tasks[idx].createdById === uid) {
      return;
    }

    const currentApprovals = tasks[idx].approvals || [];
    if (!currentApprovals.some(a => a.by === user.email)) {
      tasks[idx].approvals = [...currentApprovals, { by: user.email, at: new Date().toISOString() }];
    }
    // L'admin valide immédiatement (sauf s'il est le créateur), ou 2 approbations du CS
    if (user.role === 'admin' || tasks[idx].approvals.length >= 2) {
      tasks[idx].status = 'open';
    }
    mockStore.setTasks(tasks);
  },

  addRating: (tid: string, rating: { stars: number; comment?: string }, uid: string) => {
    const tasks = mockStore.getTasks();
    const idx = tasks.findIndex(t => t.id === tid);
    if (idx === -1) return;
    const currentRatings = tasks[idx].ratings || [];
    tasks[idx].ratings = [
      ...currentRatings,
      {
        stars: rating.stars,
        comment: rating.comment || '',
        at: new Date().toISOString(),
        byHash: uid
      }
    ];
    mockStore.setTasks(tasks);
  },

  createLedgerEntry: (entry: any, res: string) => {
    const ledger = mockStore.getLedger();
    const tasks = mockStore.getTasks();
    const task = tasks.find(t => t.id === entry.taskId);
    const users = mockStore.getUsers();
    const payee = users.find(u => u.id === entry.payeeId);
    const payer = users.find(u => u.id === entry.payerId);

    const newEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      taskId: entry.taskId,
      residence: res,
      type: entry.type,
      payer: entry.type === 'charge_credit' ? 'Copro' : (payer?.email || 'Demandeur'),
      payee: payee?.email || entry.payeeId,
      amount: entry.amount,
      at: new Date().toISOString(),
      taskTitle: task?.title || 'Prestation',
      taskCreatedAt: task?.createdAt || new Date().toISOString()
    };
    ledger.unshift(newEntry);
    mockStore.setLedger(ledger);
  },

  deleteLedgerEntry: (id: string) => {
    const ledger = mockStore.getLedger().filter(e => e.id !== id);
    mockStore.setLedger(ledger);
  }
};
