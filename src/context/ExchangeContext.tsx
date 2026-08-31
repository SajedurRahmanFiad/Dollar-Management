import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_CUSTOMERS, INITIAL_DEALS, INITIAL_REQUESTS } from '../data/mockData';
import {
  ActorRole,
  Customer,
  Deal,
  DollarRequest,
  PlatformActivity,
  TimelineEvent,
} from '../types';
import { generateReceiptDataUrl } from '../utils/receiptGenerator';

interface ExchangeContextType {
  deals: Deal[];
  customers: Customer[];
  requests: DollarRequest[];
  activities: PlatformActivity[];
  activeRole: ActorRole;
  setActiveRole: (role: ActorRole) => void;
  activeCustomerId: string;
  setActiveCustomerId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  
  // Deal Operations
  createDeal: (params: {
    customerId: string;
    dollarAmount: number;
    exchangeRate: number;
    notes?: string;
    linkedRequestId?: string;
  }) => Deal;
  uploadDollarProof: (dealId: string, proofImageUrl?: string, note?: string) => void;
  confirmDollarReceipt: (dealId: string) => void;
  disputeDollarReceipt: (dealId: string, reason: string) => void;
  submitPaymentProof: (dealId: string, amountBdt: number, proofImageUrl?: string, note?: string) => void;
  approvePaymentProof: (dealId: string, eventId: string) => void;
  declinePaymentProof: (dealId: string, eventId: string, reason: string) => void;
  cancelDeal: (dealId: string, reason: string) => void;

  // Customer Operations
  createCustomer: (customerData: {
    name: string;
    phone: string;
    email?: string;
    location?: string;
    notes?: string;
    preferredChannel?: 'WhatsApp' | 'Messenger' | 'Telegram' | 'Phone' | 'Platform';
  }) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;

  // Request Operations
  createRequest: (requestData: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    requestedUsdAmount: number;
    targetRate?: number;
    notes?: string;
    preferredChannel?: string;
  }) => DollarRequest;
  convertRequestToDeal: (requestId: string, exchangeRate: number) => Deal | null;
  rejectRequest: (requestId: string) => void;
  archiveRequest: (requestId: string) => void;

  // Navigation helper
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  currentView: 'dashboard' | 'deals' | 'customers' | 'dues' | 'requests' | 'analytics' | 'portal';
  setCurrentView: (view: 'dashboard' | 'deals' | 'customers' | 'dues' | 'requests' | 'analytics' | 'portal') => void;

  // Reset
  resetToSampleData: () => void;
  resetToMockData: () => void;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_DEALS = 'dems_deals_v1';
const LOCAL_STORAGE_KEY_CUSTOMERS = 'dems_customers_v1';
const LOCAL_STORAGE_KEY_REQUESTS = 'dems_requests_v1';
const LOCAL_STORAGE_KEY_ACTIVITIES = 'dems_activities_v1';

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DEALS);
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [requests, setRequests] = useState<DollarRequest[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_REQUESTS);
    return saved ? JSON.parse(saved) : INITIAL_REQUESTS;
  });

  const [activities, setActivities] = useState<PlatformActivity[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVITIES);
    if (saved) return JSON.parse(saved);

    // Bootstrap initial activities from initial deals
    return [
      {
        id: 'act-1',
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        dealId: 'deal-2405',
        dealNumber: 'DL-2405',
        customerName: 'Rafiqul Islam',
        type: 'payment_proof_submitted',
        title: 'Payment Proof Submitted',
        description: 'Submitted proof for ৳96,000 via bKash. Awaiting owner verification.',
        amountBdt: 96000,
        badgeType: 'warning',
      },
      {
        id: 'act-2',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        dealId: 'deal-2404',
        dealNumber: 'DL-2404',
        customerName: 'Nusrat Jahan',
        type: 'dollar_proof_uploaded',
        title: 'Dollar Proof Sent',
        description: 'Owner dispatched $1,500 via Wise. Awaiting customer confirmation.',
        amountUsd: 1500,
        badgeType: 'info',
      },
      {
        id: 'act-3',
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        customerName: 'Tahmid Rahman',
        type: 'request_created',
        title: 'New Dollar Request',
        description: 'Customer requested $3,500 @ ৳122.80 target rate.',
        amountUsd: 3500,
        badgeType: 'purple',
      },
      {
        id: 'act-4',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        dealId: 'deal-2405',
        dealNumber: 'DL-2405',
        customerName: 'Rafiqul Islam',
        type: 'payment_approved',
        title: 'Payment Approved (৳150,000)',
        description: 'City Bank transfer approved. Balance reduced to ৳96,000.',
        amountBdt: 150000,
        badgeType: 'success',
      },
      {
        id: 'act-5',
        timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        dealId: 'deal-2406',
        dealNumber: 'DL-2406',
        customerName: 'Tanvir Ahmed',
        type: 'receipt_confirmed',
        title: 'Dollar Receipt Confirmed',
        description: '$4,000 received. Active due balance of ৳492,800 created.',
        amountBdt: 492800,
        badgeType: 'info',
      },
    ];
  });

  const [activeRole, setActiveRole] = useState<ActorRole>('owner');
  const [activeCustomerId, setActiveCustomerId] = useState<string>('cust-2'); // default to Nusrat Jahan or first customer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'deals' | 'customers' | 'dues' | 'requests' | 'analytics' | 'portal'>('dashboard');

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_DEALS, JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
  }, [activities]);

  const logActivity = (activity: Omit<PlatformActivity, 'id' | 'timestamp'>) => {
    const newAct: PlatformActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const createCustomer = (customerData: {
    name: string;
    phone: string;
    email?: string;
    location?: string;
    notes?: string;
    preferredChannel?: 'WhatsApp' | 'Messenger' | 'Telegram' | 'Phone' | 'Platform';
  }): Customer => {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      email: customerData.email?.trim() || undefined,
      location: customerData.location?.trim() || undefined,
      notes: customerData.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      avatarColor: 'bg-indigo-600',
      preferredChannel: customerData.preferredChannel || 'WhatsApp',
    };

    setCustomers((prev) => [newCust, ...prev]);
    logActivity({
      customerId: newCust.id,
      customerName: newCust.name,
      type: 'customer_added',
      title: 'New Customer Profile Added',
      description: `Created profile for ${newCust.name} (${newCust.phone}).`,
      badgeType: 'info',
    });

    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const createDeal = (params: {
    customerId: string;
    dollarAmount: number;
    exchangeRate: number;
    notes?: string;
    linkedRequestId?: string;
  }): Deal => {
    const customer = customers.find((c) => c.id === params.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';
    const customerPhone = customer ? customer.phone : '';

    const nextNumber = 2400 + deals.length + 1;
    const dealNumber = `DL-${nextNumber}`;
    const expectedBdtAmount = Math.round(params.dollarAmount * params.exchangeRate);

    const initialEvent: TimelineEvent = {
      id: `evt-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      type: 'deal_created',
      actor: 'owner',
      actorName: 'Business Owner',
      title: params.linkedRequestId
        ? `Deal Created from Request (${dealNumber})`
        : `Deal Created (${dealNumber})`,
      description: `Agreement registered for $${params.dollarAmount.toLocaleString()} @ ৳${params.exchangeRate.toFixed(2)}. Expected payment: ৳${expectedBdtAmount.toLocaleString()}.`,
      amountUsd: params.dollarAmount,
      amountBdt: expectedBdtAmount,
      exchangeRate: params.exchangeRate,
    };

    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      dealNumber,
      customerId: params.customerId,
      customerName,
      customerPhone,
      dollarAmount: params.dollarAmount,
      exchangeRate: params.exchangeRate,
      expectedBdtAmount,
      paidAmount: 0,
      dueAmount: 0, // Outstanding balance is only activated after customer confirms receipt!
      status: 'draft',
      createdAt: new Date().toISOString(),
      linkedRequestId: params.linkedRequestId,
      notes: params.notes,
      timeline: [initialEvent],
    };

    setDeals((prev) => [newDeal, ...prev]);

    if (params.linkedRequestId) {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === params.linkedRequestId
            ? { ...r, status: 'converted', convertedDealId: newDeal.id }
            : r
        )
      );
    }

    logActivity({
      dealId: newDeal.id,
      dealNumber: newDeal.dealNumber,
      customerId: newDeal.customerId,
      customerName: newDeal.customerName,
      type: 'deal_created',
      title: `Deal ${dealNumber} Created`,
      description: `Agreed on $${params.dollarAmount.toLocaleString()} @ ৳${params.exchangeRate.toFixed(2)} with ${customerName}.`,
      amountUsd: params.dollarAmount,
      amountBdt: expectedBdtAmount,
      badgeType: 'info',
    });

    return newDeal;
  };

  const uploadDollarProof = (dealId: string, proofImageUrl?: string, note?: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const finalImage =
      proofImageUrl ||
      generateReceiptDataUrl('usd_sent', {
        amount: deal.dollarAmount,
        recipient: `${deal.customerName} (Verified Wallet)`,
        sender: 'FastFx Trading Desk',
        channel: 'Binance Pay / Wise USD',
      });

    const nowIso = new Date().toISOString();

    const uploadEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      type: 'dollar_proof_uploaded',
      actor: 'owner',
      actorName: 'Business Owner',
      title: 'Dollar Transfer Proof Sent',
      description:
        note ||
        `Sent $${deal.dollarAmount.toLocaleString()} to customer wallet. Screenshot attached. Waiting for customer confirmation.`,
      amountUsd: deal.dollarAmount,
      proofImageUrl: finalImage,
      proofType: 'usd_sent',
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          status: 'awaiting_confirmation',
          dollarProofUrl: finalImage,
          dollarProofUploadedAt: nowIso,
          timeline: [...d.timeline, uploadEvent],
        };
      })
    );

    logActivity({
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      customerId: deal.customerId,
      customerName: deal.customerName,
      type: 'dollar_proof_uploaded',
      title: `Dollar Proof Sent (${deal.dealNumber})`,
      description: `Owner dispatched $${deal.dollarAmount.toLocaleString()} proof. Awaiting ${deal.customerName}'s confirmation.`,
      amountUsd: deal.dollarAmount,
      badgeType: 'info',
    });
  };

  const confirmDollarReceipt = (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const nowIso = new Date().toISOString();
    const currentDue = deal.expectedBdtAmount - deal.paidAmount;

    const confirmEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      type: 'receipt_confirmed',
      actor: 'customer',
      actorName: deal.customerName,
      title: 'Dollar Receipt Confirmed',
      description: `Customer verified receipt of $${deal.dollarAmount.toLocaleString()}. Active outstanding balance established at ৳${currentDue.toLocaleString()}.`,
      amountUsd: deal.dollarAmount,
      amountBdt: currentDue,
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          status: d.paidAmount > 0 ? 'partially_paid' : 'active_due',
          dueAmount: currentDue,
          confirmedAt: nowIso,
          timeline: [...d.timeline, confirmEvent],
        };
      })
    );

    logActivity({
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      customerId: deal.customerId,
      customerName: deal.customerName,
      type: 'receipt_confirmed',
      title: `Dollar Receipt Confirmed (${deal.dealNumber})`,
      description: `${deal.customerName} confirmed receipt of $${deal.dollarAmount.toLocaleString()}. ৳${currentDue.toLocaleString()} is now active due.`,
      amountBdt: currentDue,
      badgeType: 'success',
    });
  };

  const disputeDollarReceipt = (dealId: string, reason: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const nowIso = new Date().toISOString();
    const disputeEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      type: 'receipt_disputed',
      actor: 'customer',
      actorName: deal.customerName,
      title: 'Dollar Receipt Disputed',
      description: `Customer reported an issue: "${reason}"`,
      amountUsd: deal.dollarAmount,
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          status: 'disputed',
          timeline: [...d.timeline, disputeEvent],
        };
      })
    );

    logActivity({
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      customerId: deal.customerId,
      customerName: deal.customerName,
      type: 'receipt_disputed',
      title: `Dispute Raised on ${deal.dealNumber}`,
      description: `${deal.customerName} flagged: "${reason}"`,
      amountUsd: deal.dollarAmount,
      badgeType: 'danger',
    });
  };

  const submitPaymentProof = (
    dealId: string,
    amountBdt: number,
    proofImageUrl?: string,
    note?: string
  ) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const finalImage =
      proofImageUrl ||
      generateReceiptDataUrl('bdt_paid', {
        amount: amountBdt,
        sender: `${deal.customerName} (${deal.customerPhone})`,
        recipient: 'FastFx Settlement Account',
        channel: 'bKash / Bank NPSB',
      });

    const paymentEventId = `pay-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const paymentEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      type: 'payment_proof_submitted',
      actor: 'customer',
      actorName: deal.customerName,
      title: `Payment Proof Submitted (৳${amountBdt.toLocaleString()})`,
      description:
        note ||
        `Customer uploaded payment screenshot for ৳${amountBdt.toLocaleString()}. Awaiting business owner verification.`,
      amountBdt,
      proofImageUrl: finalImage,
      proofType: 'bdt_paid',
      proofStatus: 'pending',
      paymentEventId,
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          timeline: [...d.timeline, paymentEvent],
        };
      })
    );

    logActivity({
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      customerId: deal.customerId,
      customerName: deal.customerName,
      type: 'payment_proof_submitted',
      title: `Payment Proof Submitted (৳${amountBdt.toLocaleString()})`,
      description: `${deal.customerName} submitted payment screenshot for deal ${deal.dealNumber}.`,
      amountBdt,
      badgeType: 'warning',
    });
  };

  const approvePaymentProof = (dealId: string, eventId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const targetEvent = deal.timeline.find((e) => e.id === eventId);
    const amountToApprove = targetEvent?.amountBdt || 0;
    if (amountToApprove <= 0) return;

    const nowIso = new Date().toISOString();
    const newPaidAmount = deal.paidAmount + amountToApprove;
    const newDueAmount = Math.max(0, deal.expectedBdtAmount - newPaidAmount);
    const isNowCompleted = newDueAmount <= 0;

    const approvalEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      type: 'payment_approved',
      actor: 'owner',
      actorName: 'Business Owner',
      title: `Payment Approved (৳${amountToApprove.toLocaleString()})`,
      description: `Payment screenshot verified. ৳${amountToApprove.toLocaleString()} applied to deal. Remaining balance: ৳${newDueAmount.toLocaleString()}.`,
      amountBdt: amountToApprove,
      paymentEventId: targetEvent?.paymentEventId,
    };

    const completionEvent: TimelineEvent = {
      id: `evt-${Date.now() + 1}`,
      timestamp: nowIso,
      type: 'deal_completed',
      actor: 'system',
      actorName: 'System',
      title: 'Deal Fully Completed',
      description: `Outstanding balance reached ৳0. All obligations fulfilled. Deal ${deal.dealNumber} closed.`,
      amountBdt: deal.expectedBdtAmount,
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;

        // Update the original payment event status to approved
        const updatedTimeline = d.timeline.map((e) =>
          e.id === eventId ? { ...e, proofStatus: 'approved' as const } : e
        );

        const newTimeline = isNowCompleted
          ? [...updatedTimeline, approvalEvent, completionEvent]
          : [...updatedTimeline, approvalEvent];

        return {
          ...d,
          paidAmount: newPaidAmount,
          dueAmount: newDueAmount,
          status: isNowCompleted ? 'completed' : 'partially_paid',
          completedAt: isNowCompleted ? nowIso : d.completedAt,
          timeline: newTimeline,
        };
      })
    );

    logActivity({
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      customerId: deal.customerId,
      customerName: deal.customerName,
      type: isNowCompleted ? 'deal_completed' : 'payment_approved',
      title: isNowCompleted
        ? `Deal ${deal.dealNumber} Completed! 🎉`
        : `Payment Approved (৳${amountToApprove.toLocaleString()})`,
      description: isNowCompleted
        ? `Final payment of ৳${amountToApprove.toLocaleString()} verified. Balance cleared for ${deal.customerName}.`
        : `Approved ৳${amountToApprove.toLocaleString()} for deal ${deal.dealNumber}. Remaining: ৳${newDueAmount.toLocaleString()}.`,
      amountBdt: amountToApprove,
      badgeType: 'success',
    });
  };

  const declinePaymentProof = (dealId: string, eventId: string, reason: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const targetEvent = deal.timeline.find((e) => e.id === eventId);
    const amountDeclined = targetEvent?.amountBdt || 0;
    const nowIso = new Date().toISOString();

    const declineEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: nowIso,
      type: 'payment_declined',
      actor: 'owner',
      actorName: 'Business Owner',
      title: `Payment Declined (৳${amountDeclined.toLocaleString()})`,
      description: `Payment rejected by owner: "${reason}". No deduction made.`,
      amountBdt: amountDeclined,
      rejectionReason: reason,
      paymentEventId: targetEvent?.paymentEventId,
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        const updatedTimeline = d.timeline.map((e) =>
          e.id === eventId
            ? { ...e, proofStatus: 'rejected' as const, rejectionReason: reason }
            : e
        );
        return {
          ...d,
          timeline: [...updatedTimeline, declineEvent],
        };
      })
    );

    logActivity({
      dealId: deal.id,
      dealNumber: deal.dealNumber,
      customerId: deal.customerId,
      customerName: deal.customerName,
      type: 'payment_declined',
      title: `Payment Rejected (${deal.dealNumber})`,
      description: `Owner rejected ৳${amountDeclined.toLocaleString()} proof: "${reason}".`,
      amountBdt: amountDeclined,
      badgeType: 'danger',
    });
  };

  const cancelDeal = (dealId: string, reason: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    const cancelEvent: TimelineEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'deal_cancelled',
      actor: 'owner',
      actorName: 'Business Owner',
      title: 'Deal Cancelled',
      description: `Deal cancelled: "${reason}".`,
    };

    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
        return {
          ...d,
          status: 'cancelled',
          dueAmount: 0,
          timeline: [...d.timeline, cancelEvent],
        };
      })
    );
  };

  const createRequest = (data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    requestedUsdAmount: number;
    targetRate?: number;
    notes?: string;
    preferredChannel?: string;
  }): DollarRequest => {
    const nextNum = 100 + requests.length + 1;
    const newReq: DollarRequest = {
      id: `req-${Date.now()}`,
      requestNumber: `REQ-${nextNum}`,
      customerId: data.customerId || `cust-${Date.now()}`,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      requestedUsdAmount: data.requestedUsdAmount,
      targetRate: data.targetRate,
      notes: data.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      preferredChannel: data.preferredChannel || 'WhatsApp',
    };

    // If new customer, add to customer list
    if (!data.customerId || !customers.some((c) => c.id === data.customerId)) {
      createCustomer({
        name: data.customerName,
        phone: data.customerPhone,
      });
    }

    setRequests((prev) => [newReq, ...prev]);

    logActivity({
      customerId: newReq.customerId,
      customerName: newReq.customerName,
      type: 'request_created',
      title: `Dollar Inquiry ${newReq.requestNumber}`,
      description: `${newReq.customerName} requested $${data.requestedUsdAmount.toLocaleString()}${
        data.targetRate ? ` @ ৳${data.targetRate}` : ''
      }.`,
      amountUsd: data.requestedUsdAmount,
      badgeType: 'purple',
    });

    return newReq;
  };

  const convertRequestToDeal = (requestId: string, exchangeRate: number): Deal | null => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return null;

    let cust = customers.find((c) => c.id === req.customerId || c.phone === req.customerPhone);
    if (!cust) {
      cust = createCustomer({
        name: req.customerName,
        phone: req.customerPhone,
      });
    }

    const createdDeal = createDeal({
      customerId: cust.id,
      dollarAmount: req.requestedUsdAmount,
      exchangeRate,
      notes: req.notes ? `Converted from ${req.requestNumber}: ${req.notes}` : undefined,
      linkedRequestId: req.id,
    });

    return createdDeal;
  };

  const rejectRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected' } : r))
    );
  };

  const archiveRequest = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'archived' } : r))
    );
  };

  const resetToSampleData = () => {
    setDeals(INITIAL_DEALS);
    setCustomers(INITIAL_CUSTOMERS);
    setRequests(INITIAL_REQUESTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_DEALS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CUSTOMERS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_REQUESTS);
    localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVITIES);
  };

  return (
    <ExchangeContext.Provider
      value={{
        deals,
        customers,
        requests,
        activities,
        activeRole,
        setActiveRole,
        activeCustomerId,
        setActiveCustomerId,
        searchQuery,
        setSearchQuery,
        createDeal,
        uploadDollarProof,
        confirmDollarReceipt,
        disputeDollarReceipt,
        submitPaymentProof,
        approvePaymentProof,
        declinePaymentProof,
        cancelDeal,
        createCustomer,
        updateCustomer,
        createRequest,
        convertRequestToDeal,
        rejectRequest,
        archiveRequest,
        selectedDealId,
        setSelectedDealId,
        selectedCustomerId,
        setSelectedCustomerId,
        currentView,
        setCurrentView,
        resetToSampleData,
        resetToMockData: resetToSampleData,
      }}
    >
      {children}
    </ExchangeContext.Provider>
  );
};

export const useExchange = () => {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error('useExchange must be used within an ExchangeProvider');
  }
  return context;
};
