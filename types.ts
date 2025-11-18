
export type UserRole = "owner" | "council" | "admin";
export type TaskStatus = "pending" | "open" | "awarded" | "completed" | "rejected";
export type TaskScope = "copro" | "apartment";
export type TaskCategory = "ampoule" | "porte" | "encombrants" | "divers";
export type UserStatus = "pending" | "active" | "rejected";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface RegisteredUser extends User {
  password: string;
  status: UserStatus;
  resetToken?: string;
  resetTokenExpires?: number;
}

export interface Me {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Bid {
  by: string;
  amount: number;
  note: string;
  at: string;
  plannedExecutionDate: string;
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
  biddingStartedAt?: string;
}

export interface LedgerEntry {
  taskId: string;
  type: "charge_credit" | "apartment_payment";
  payer: string;
  payee: string;
  amount: number;
  at: string;
}