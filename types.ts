export type UserRole = "owner" | "council" | "admin";
export type TaskStatus = "pending" | "open" | "awarded" | "verification" | "completed" | "rejected";
export type TaskScope = "copro" | "apartment";
export type TaskCategory = "ampoule" | "porte" | "encombrants" | "divers";
export type UserStatus = "pending" | "active" | "rejected" | "deleted";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  residence: string;
}

export interface RegisteredUser extends User {
  password?: string; // Optional because Supabase handles auth
  status: UserStatus;
  resetToken?: string;
  resetTokenExpires?: number;
  avatar?: string;
}

export interface Me {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  residence: string;
}

export interface Bid {
  id?: string;
  userId?: string; // UUID of the bidder
  by: string; // Email (for display compatibility)
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
  byHash: string; // User ID
}

export interface DeletedRating extends Rating {
    deletedAt: string;
    deletedBy: string;
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
  residence: string;
  createdBy: string; // Email for display
  createdById?: string; // UUID
  createdAt: string;
  bids: Bid[];
  ratings: Rating[];
  deletedRatings?: DeletedRating[]; // History of deleted ratings
  approvals: Approval[];
  rejections: Rejection[];
  awardedTo?: string; // Email
  awardedToId?: string; // UUID
  awardedAmount?: number;
  completionAt?: string;
  biddingStartedAt?: string;
  photo?: string; // Base64 image string
  validatedBy?: string;
}

export interface LedgerEntry {
  id?: string;
  taskId: string;
  residence: string;
  type: "charge_credit" | "apartment_payment";
  payer: string;
  payee: string;
  amount: number;
  at: string;
  taskTitle?: string;
  taskCreator?: string;
}