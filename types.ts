
export type UserRole = "owner" | "council" | "admin";
export type TaskStatus = "pending" | "open" | "awarded" | "completed" | "rejected";
export type TaskScope = "copro" | "apartment";
export type TaskCategory = "ampoule" | "porte" | "encombrants" | "divers";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Me {
  email: string;
  role: UserRole;
}

export interface Bid {
  by: string;
  amount: number;
  note: string;
  at: string;
}

export interface Approval {
  by: string;
  at: string;
}

export interface Rejection {
  by: string;
  at: string;
}

export interface Rating {
  stars: number;
  comment: string;
  at: string;
  byHash: string;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  scope: TaskScope;
  details: string;
  location: string;
  startingPrice: number;
  warrantyDays: number;
  plannedDate: string | null;
  status: TaskStatus;
  createdBy: string;
  createdAt: string;
  bids: Bid[];
  ratings: Rating[];
  approvals: Approval[];
  rejections: Rejection[];
  awardedTo?: string;
  awardedAmount?: number;
  completionAt?: string;
}

export interface LedgerEntry {
  taskId: string;
  type: "charge_credit" | "apartment_payment";
  payer: string;
  payee: string;
  amount: number;
  at: string;
}
