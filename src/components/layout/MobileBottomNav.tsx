import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  AlertCircle,
  Inbox,
  Wallet,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';

interface MobileBottomNavProps {
  onOpenNewDealModal?: () => void;
  onOpenNewRequestModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenNewDealModal,
  onOpenNewRequestModal,
}) => {
  const {
    currentView,
    setCurrentView,
    activeRole,
    deals,
    requests,
    activeCustomerId,
    customers,
    setSelectedDealId,
    setSelectedCustomerId,
  } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Actionable badge counts
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

  const customerDeals = deals.filter(
    (d) => d.customerId === currentCustomer?.id
  );
  const customerUnpaidDues = customerDeals.filter(
    (d) =>
      (d.status === 'active_due' || d.status === 'partially_paid') &&
      d.dueAmount > 0
  ).length;

  const handleNavClick = (viewId: any) => {
    setSelectedDealId(null);
    if (viewId === 'customers') {
      setSelectedCustomerId(null);
    }
    setCurrentView(viewId);
  };

  if (activeRole === 'customer') {
    const customerTabs = [
      {
        id: 'portal',
        label: 'Overview',
        icon: LayoutDashboard,
      },
      {
        id: 'deals',
        label: 'Orders',
        icon: ArrowLeftRight,
        badge: customerDeals.length > 0 ? customerDeals.length : undefined,
      },
      {
        id: 'dues',
        label: 'Dues',
        icon: Wallet,
        badge: customerUnpaidDues > 0 ? customerUnpaidDues : undefined,
        badgeAlert: true,
      },
      {
        id: 'requests',
        label: 'Inquiries',
        icon: Inbox,
      },
    ];

    return (
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-3 py-1.5 flex items-center justify-around shadow-lg select-none"
      >
        {customerTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative min-h-[48px] ${
                isActive
                  ? 'text-amber-600 font-bold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                      tab.badgeAlert
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
              )}
            </button>
          );
        })}

        {/* Quick Request Button on Mobile */}
        {onOpenNewRequestModal && (
          <button
            onClick={onOpenNewRequestModal}
            aria-label="Request Dollars"
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-amber-900 bg-amber-100/90 active:bg-amber-200 min-h-[48px] transition-all"
          >
            <Plus className="w-5 h-5 text-amber-700" />
            <span className="text-[10px] font-black text-amber-800 tracking-tight whitespace-nowrap">
              Buy USD
            </span>
          </button>
        )}
      </nav>
    );
  }

  // Owner Mobile Navigation
  const ownerTabs = [
    {
      id: 'dashboard',
      label: 'Desk',
      icon: LayoutDashboard,
      badge: ownerPendingApprovals > 0 ? ownerPendingApprovals : undefined,
      badgeAlert: true,
    },
    {
      id: 'deals',
      label: 'Deals',
      icon: ArrowLeftRight,
    },
    {
      id: 'customers',
      label: 'Clients',
      icon: Users,
    },
    {
      id: 'dues',
      label: 'Dues',
      icon: AlertCircle,
      badge: totalOwnerUnpaidDues > 0 ? totalOwnerUnpaidDues : undefined,
      badgeAlert: true,
    },
    {
      id: 'requests',
      label: 'Inquiries',
      icon: Inbox,
      badge: ownerNewRequests > 0 ? ownerNewRequests : undefined,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg select-none"
    >
      {ownerTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleNavClick(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative min-h-[48px] ${
              isActive
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {tab.badge !== undefined && (
                <span
                  className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                    tab.badgeAlert
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {tab.label}
            </span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
            )}
          </button>
        );
      })}

      {/* Floating Action / New Deal trigger */}
      {onOpenNewDealModal && (
        <button
          onClick={onOpenNewDealModal}
          aria-label="New Deal"
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-white bg-slate-900 active:bg-slate-800 min-h-[48px] transition-all ml-1 shadow-xs"
        >
          <Plus className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold text-white tracking-tight whitespace-nowrap">
            New Deal
          </span>
        </button>
      )}
    </nav>
  );
};
