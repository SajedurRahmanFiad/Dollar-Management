import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  AlertCircle,
  Inbox,
  UserCheck,
  DollarSign,
  Plus,
  Receipt,
  Wallet,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';

interface SidebarProps {
  onOpenNewDealModal?: () => void;
  onOpenNewRequestModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewDealModal,
  onOpenNewRequestModal,
}) => {
  const {
    currentView,
    setCurrentView,
    deals,
    requests,
    activeRole,
    activeCustomerId,
    customers,
    setSelectedDealId,
    setSelectedCustomerId,
  } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Role-based counts
  const customerDeals = deals.filter(
    (d) => d.customerId === currentCustomer?.id
  );
  const customerUnpaidDues = customerDeals.filter(
    (d) =>
      (d.status === 'active_due' || d.status === 'partially_paid') &&
      d.dueAmount > 0
  ).length;
  const customerAwaitingConfirmation = customerDeals.filter(
    (d) => d.status === 'awaiting_confirmation'
  ).length;
  const customerInquiries = requests.filter(
    (r) =>
      r.customerId === currentCustomer?.id ||
      r.customerPhone === currentCustomer?.phone
  ).length;

  const totalOwnerUnpaidDues = deals.filter(
    (d) =>
      (d.status === 'active_due' || d.status === 'partially_paid') &&
      d.dueAmount > 0
  ).length;
  const ownerPendingApprovals = deals.reduce((sum, d) => {
    return (
      sum +
      d.timeline.filter(
        (e) =>
          e.type === 'payment_proof_submitted' && e.proofStatus === 'pending'
      ).length
    );
  }, 0);
  const ownerNewRequests = requests.filter(
    (r) => r.status === 'new' || r.status === 'pending'
  ).length;

  // Nav configurations
  const ownerNavItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge:
        ownerPendingApprovals > 0
          ? `${ownerPendingApprovals} Action`
          : undefined,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'deals' as const,
      label: 'Deals Operations',
      icon: ArrowLeftRight,
      badge: deals.length.toString(),
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'customers' as const,
      label: 'Clients',
      icon: Users,
    },
    {
      id: 'dues' as const,
      label: 'Due Management',
      icon: AlertCircle,
      badge:
        totalOwnerUnpaidDues > 0 ? `${totalOwnerUnpaidDues}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 font-bold',
    },
    {
      id: 'requests' as const,
      label: 'Buy Inquiries',
      icon: Inbox,
      badge: ownerNewRequests > 0 ? `${ownerNewRequests} New` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const customerNavItems = [
    {
      id: 'portal' as const,
      label: 'My Overview',
      icon: LayoutDashboard,
      badge:
        customerAwaitingConfirmation > 0
          ? 'Confirm USD'
          : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 font-bold',
    },
    {
      id: 'deals' as const,
      label: 'My Deals & Orders',
      icon: ArrowLeftRight,
      badge: customerDeals.length.toString(),
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'dues' as const,
      label: 'My Dues & Payments',
      icon: Wallet,
      badge:
        customerUnpaidDues > 0 ? `${customerUnpaidDues} Due` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 font-bold',
    },
    {
      id: 'requests' as const,
      label: 'My Inquiries',
      icon: Inbox,
      badge: customerInquiries > 0 ? `${customerInquiries}` : undefined,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  ];

  const activeNavList =
    activeRole === 'customer' ? customerNavItems : ownerNavItems;

  const handleSelectTab = (itemId: any) => {
    setSelectedDealId(null);
    if (itemId === 'customers') {
      setSelectedCustomerId(null);
    }
    setCurrentView(itemId);
  };

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-xs ${
                activeRole === 'customer'
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600'
                  : 'bg-slate-900'
              }`}
            >
              $
            </div>
            <div>
              <span className="font-extrabold text-xs text-slate-900 tracking-tight block">
                FastFx Exchange
              </span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                {activeRole === 'customer' ? 'Client Desk' : 'Admin Console'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {activeNavList.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (activeRole === 'customer' &&
                item.id === 'portal' &&
                currentView === 'dashboard');

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative min-h-[42px] ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Action Card at bottom of sidebar */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 m-2 rounded-2xl">
        {activeRole === 'customer' ? (
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                {currentCustomer?.name?.charAt(0) || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {currentCustomer?.name || 'Client'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 block truncate">
                  Client Account
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                if (onOpenNewRequestModal) onOpenNewRequestModal();
              }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Request Dollars</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs mb-2 px-1">
              <span className="font-bold text-slate-700 text-[11px]">
                Exchange Status
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active Desk
              </span>
            </div>
            <button
              onClick={() => {
                if (onOpenNewDealModal) onOpenNewDealModal();
              }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Deal</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
