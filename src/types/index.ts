export type DealStatus = 
  | 'draft'
  | 'dollar_sent_pending'
  | 'awaiting_confirmation'
  | 'fundify_verification_pending'
  | 'active_due'
  | 'partially_paid'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type RequestStatus = 'new' | 'under_discussion' | 'converted' | 'cancelled' | 'pending' | 'rejected' | 'archived';

export type ActorRole = 'owner' | 'customer' | 'system';

export type AppView = 'dashboard' | 'deals' | 'customers' | 'dues' | 'requests' | 'analytics' | 'portal' | 'profile';

export type TimelineEventType = 
  | 'deal_created'
  | 'dollar_proof_uploaded'
  | 'receipt_confirmed'
  | 'receipt_disputed'
  | 'payment_proof_submitted'
  | 'payment_approved'
  | 'payment_declined'
  | 'balance_adjusted'
  | 'deal_completed'
  | 'deal_cancelled';

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO string
  type: TimelineEventType;
  actor: ActorRole;
  actorName: string;
  title: string;
  description?: string;
  amountUsd?: number;
  amountBdt?: number;
  exchangeRate?: number;
  proofImageUrl?: string;
  proofType?: 'usd_sent' | 'bdt_paid';
  proofStatus?: 'pending' | 'approved' | 'rejected' | 'disputed';
  paymentEventId?: string; // Links payment submission to approval/rejection
  rejectionReason?: string;
}

export interface PaymentSubmission {
  id: string;
  dealId: string;
  timestamp: string;
  amountBdt: number;
  proofImageUrl: string;
  status: 'pending' | 'approved' | 'declined';
  reviewedAt?: string;
  reviewedBy?: string;
  note?: string;
}

export interface Deal {
  id: string;
  dealNumber: string; // e.g. "DL-2401"
  customerId: string;
  customerName: string;
  customerPhone: string;
  dollarAmount: number; // in USD
  exchangeRate: number; // BDT per USD (e.g. 122.50)
  expectedBdtAmount: number; // dollarAmount * exchangeRate
  paidAmount: number; // in BDT (sum of approved payments)
  dueAmount: number; // expectedBdtAmount - paidAmount (only active once receipt confirmed)
  status: DealStatus;
  createdAt: string;
  confirmedAt?: string; // When customer confirmed dollar receipt
  completedAt?: string;
  linkedRequestId?: string;
  notes?: string;
  dollarProofUrl?: string;
  dollarProofUploadedAt?: string;
  timeline: TimelineEvent[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  notes?: string;
  createdAt: string;
  avatarColor?: string;
}

export interface CustomerFinancialSummary {
  currentDue: number; // Sum of due amounts across active/partially paid deals
  lifetimeValue: number; // Sum of expected BDT across all active/completed deals
  totalDollarsPurchased: number; // Sum of USD sold across active/completed deals
  totalAmountPaid: number; // Sum of all approved BDT payments
  totalDealsCount: number;
  activeDealsCount: number;
  completedDealsCount: number;
  disputedDealsCount: number;
  averageDealSizeUsd: number;
  largestDealUsd: number;
  lastActivityDate: string;
  paymentBehavior: 'Prompt & Reliable' | 'Moderate' | 'Has Overdue Dues' | 'New Customer';
  oldestUnpaidDealDays: number;
}

export interface DollarRequest {
  id: string;
  requestNumber: string; // e.g. "REQ-104"
  customerId: string;
  customerName: string;
  customerPhone: string;
  requestedUsdAmount: number;
  targetRate?: number;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  convertedDealId?: string;
}

export type Request = DollarRequest;

export interface PlatformActivity {
  id: string;
  timestamp: string;
  dealId?: string;
  dealNumber?: string;
  customerId?: string;
  customerName: string;
  type: TimelineEventType | 'request_created' | 'customer_added';
  title: string;
  description: string;
  amountUsd?: number;
  amountBdt?: number;
  badgeType: 'info' | 'warning' | 'success' | 'danger' | 'purple';
}
