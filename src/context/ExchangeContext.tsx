import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dealService } from '../services/dealService';
import { customerService } from '../services/customerService';
import { requestService } from '../services/requestService';
import { activityService } from '../services/activityService';
import { dashboardService } from '../services/dashboardService';
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
  }) => Promise<Deal>;
  uploadDollarProof: (dealId: string, proofImageUrl?: string, note?: string) => Promise<void>;
  confirmDollarReceipt: (dealId: string) => Promise<void>;
  disputeDollarReceipt: (dealId: string, reason: string) => Promise<void>;
  submitPaymentProof: (dealId: string, amountBdt: number, proofImageUrl?: string, note?: string) => Promise<void>;
  approvePaymentProof: (dealId: string, eventId: string) => Promise<void>;
  declinePaymentProof: (dealId: string, eventId: string, reason: string) => Promise<void>;
  cancelDeal: (dealId: string, reason: string) => Promise<void>;

  // Customer Operations
  createCustomer: (customerData: {
    name: string;
    phone: string;
    companyName?: string;
    notes?: string;
  }) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;

  // Request Operations
  createRequest: (requestData: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    requestedUsdAmount: number;
    targetRate?: number;
    notes?: string;
  }) => Promise<DollarRequest>;
  convertRequestToDeal: (requestId: string, exchangeRate: number) => Promise<Deal | null>;
  rejectRequest: (requestId: string) => Promise<void>;
  archiveRequest: (requestId: string) => Promise<void>;

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

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [requests, setRequests] = useState<DollarRequest[]>([]);
  const [activities, setActivities] = useState<PlatformActivity[]>([]);
  const [activeRole, setActiveRole] = useState<ActorRole>('owner');
  const [activeCustomerId, setActiveCustomerId] = useState<string>('2'); // default to Nusrat Jahan
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'deals' | 'customers' | 'dues' | 'requests' | 'analytics' | 'portal'>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data from API
  useEffect(() => {
    Promise.all([
      dealService.getAll().catch(() => []),
      customerService.getAll().catch(() => []),
      requestService.getAll().catch(() => []),
      activityService.getAll().catch(() => []),
    ]).then(([dealsData, customersData, requestsData, activitiesData]) => {
      setDeals(dealsData);
      setCustomers(customersData);
      setRequests(requestsData);
      setActivities(activitiesData);
      setIsLoaded(true);
    });
  }, []);

  const logActivity = useCallback(async (activity: Omit<PlatformActivity, 'id' | 'timestamp'>) => {
    // Activities are created server-side, so we just reload
    try {
      const freshActivities = await activityService.getAll();
      setActivities(freshActivities);
    } catch {
      // Fallback: add locally
      const newAct: PlatformActivity = {
        ...activity,
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
      };
      setActivities((prev) => [newAct, ...prev]);
    }
  }, []);

  // ========================
  // CUSTOMER OPERATIONS
  // ========================
  const createCustomer = useCallback(async (customerData: {
    name: string;
    phone: string;
    companyName?: string;
    notes?: string;
  }): Promise<Customer> => {
    const newCust = await customerService.create({
      name: customerData.name,
      phone: customerData.phone,
      companyName: customerData.companyName,
      notes: customerData.notes,
    });
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = await customerService.update(Number(id), updates);
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    );
  }, []);

  // ========================
  // DEAL OPERATIONS
  // ========================
  const createDeal = useCallback(async (params: {
    customerId: string;
    dollarAmount: number;
    exchangeRate: number;
    notes?: string;
    linkedRequestId?: string;
  }): Promise<Deal> => {
    const newDeal = await dealService.create({
      customerId: Number(params.customerId),
      dollarAmount: params.dollarAmount,
      exchangeRate: params.exchangeRate,
      notes: params.notes,
      linkedRequestId: params.linkedRequestId ? Number(params.linkedRequestId) : undefined,
    });

    // Reload data
    const [freshDeals, freshRequests] = await Promise.all([
      dealService.getAll(),
      requestService.getAll(),
    ]);
    setDeals(freshDeals);
    setRequests(freshRequests);

    return newDeal;
  }, []);

  const uploadDollarProof = useCallback(async (dealId: string, proofImageUrl?: string, note?: string) => {
    const finalImage = proofImageUrl || generateReceiptDataUrl('usd_sent', {
      amount: 0,
      recipient: '',
      sender: 'FastFx Trading Desk',
      channel: 'Binance Pay / Wise USD',
    });

    const updated = await dealService.uploadProof(Number(dealId), finalImage, note);
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, []);

  const confirmDollarReceipt = useCallback(async (dealId: string) => {
    const updated = await dealService.confirmReceipt(Number(dealId));
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, []);

  const disputeDollarReceipt = useCallback(async (dealId: string, reason: string) => {
    const updated = await dealService.dispute(Number(dealId), reason);
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, []);

  const submitPaymentProof = useCallback(async (
    dealId: string,
    amountBdt: number,
    proofImageUrl?: string,
    note?: string
  ) => {
    const deal = deals.find((d) => d.id === dealId);
    const finalImage = proofImageUrl || generateReceiptDataUrl('bdt_paid', {
      amount: amountBdt,
      sender: deal ? `${deal.customerName} (${deal.customerPhone})` : '',
      recipient: 'FastFx Settlement Account',
      channel: 'bKash / Bank NPSB',
    });

    const updated = await dealService.submitPayment(Number(dealId), amountBdt, finalImage, note);
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, [deals]);

  const approvePaymentProof = useCallback(async (dealId: string, eventId: string) => {
    const updated = await dealService.approvePayment(Number(dealId), Number(eventId));
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, []);

  const declinePaymentProof = useCallback(async (dealId: string, eventId: string, reason: string) => {
    const updated = await dealService.declinePayment(Number(dealId), Number(eventId), reason);
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, []);

  const cancelDeal = useCallback(async (dealId: string, reason: string) => {
    const updated = await dealService.cancel(Number(dealId), reason);
    const freshDeals = await dealService.getAll();
    setDeals(freshDeals);
  }, []);

  // ========================
  // REQUEST OPERATIONS
  // ========================
  const createRequest = useCallback(async (data: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    requestedUsdAmount: number;
    targetRate?: number;
    notes?: string;
  }): Promise<DollarRequest> => {
    const newReq = await requestService.create({
      customerId: data.customerId ? Number(data.customerId) : undefined,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      requestedUsdAmount: data.requestedUsdAmount,
      targetRate: data.targetRate,
      notes: data.notes,
    });

    const [freshRequests, freshCustomers] = await Promise.all([
      requestService.getAll(),
      customerService.getAll(),
    ]);
    setRequests(freshRequests);
    setCustomers(freshCustomers);

    return newReq;
  }, []);

  const convertRequestToDeal = useCallback(async (requestId: string, exchangeRate: number): Promise<Deal | null> => {
    try {
      const deal = await requestService.convert(Number(requestId), exchangeRate);
      const [freshDeals, freshRequests, freshActivities] = await Promise.all([
        dealService.getAll(),
        requestService.getAll(),
        activityService.getAll(),
      ]);
      setDeals(freshDeals);
      setRequests(freshRequests);
      setActivities(freshActivities);
      return deal;
    } catch {
      return null;
    }
  }, []);

  const rejectRequest = useCallback(async (requestId: string) => {
    await requestService.reject(Number(requestId));
    const freshRequests = await requestService.getAll();
    setRequests(freshRequests);
  }, []);

  const archiveRequest = useCallback(async (requestId: string) => {
    await requestService.archive(Number(requestId));
    const freshRequests = await requestService.getAll();
    setRequests(freshRequests);
  }, []);

  // Reset (re-seeds database)
  const resetToSampleData = useCallback(async () => {
    // Reload from server (server data is seeded)
    const [dealsData, customersData, requestsData, activitiesData] = await Promise.all([
      dealService.getAll().catch(() => []),
      customerService.getAll().catch(() => []),
      requestService.getAll().catch(() => []),
      activityService.getAll().catch(() => []),
    ]);
    setDeals(dealsData);
    setCustomers(customersData);
    setRequests(requestsData);
    setActivities(activitiesData);
  }, []);

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
