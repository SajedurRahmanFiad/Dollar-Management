import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  AlertCircle,
  Inbox,
  UserCheck,
  Plus,
  Receipt,
  Wallet,
  Clock,
  Sparkles,
  X,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useExchange } from '../../context/ExchangeContext';

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);
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
      label: 'Deals',
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
      label: 'Requests',
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
      label: 'My Deals',
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
      label: 'My Requests',
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
    <div className="group fixed left-3 top-20 bottom-4 z-50 hidden lg:block">
      <div className="pointer-events-none fixed inset-0 z-40 bg-slate-950/25 opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100" />
      <aside
        className="relative z-50 flex h-full w-20 flex-col justify-between overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white py-4 shadow-xl select-none transition-[width] duration-300 ease-in-out group-hover:w-64"
      >
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-center px-3 transition-[padding] duration-300 group-hover:justify-start group-hover:px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors group-hover:w-full group-hover:justify-start group-hover:px-2">
            <img
              src="/uploads/Avatar.png"
              alt="Account"
              className="h-9 w-9 rounded-lg object-cover group-hover:hidden"
            />
            <img
              src="/uploads/logoPNGFIT.png"
              alt="Fundify"
              className="hidden h-10 w-auto max-w-full object-contain group-hover:block"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-3 space-y-1 p-2 transition-[padding] duration-300 group-hover:p-3">
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
                className={`w-full flex cursor-pointer items-center rounded-xl text-xs font-semibold transition-all relative min-h-10.5 ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                } justify-center px-2 py-2.5 group-hover:justify-between group-hover:px-3.5`}
              >
                <div className="flex items-center justify-center gap-0 transition-[gap] duration-300 group-hover:justify-start group-hover:gap-3">
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isActive ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  />
                  <span className="pointer-events-none absolute whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:static group-hover:opacity-100">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={`hidden text-[10px] px-2 py-0.5 rounded-full font-bold group-hover:inline-flex ${
                      isActive ? 'bg-white/15 text-white' : item.badgeColor
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
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => handleSelectTab('profile')}
          className={`mx-2 flex min-h-10.5 cursor-pointer items-center justify-center gap-3 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all group-hover:mx-3 group-hover:justify-start group-hover:px-3.5 ${
            currentView === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserRound className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="pointer-events-none absolute whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:static group-hover:opacity-100">
            Profile
          </span>
        </button>
        <button
          type="button"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="mx-2 mb-3 flex min-h-10.5 cursor-pointer items-center justify-center gap-3 rounded-xl px-2 py-2.5 text-xs font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 group-hover:mx-3 group-hover:justify-start group-hover:px-3.5"
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="pointer-events-none absolute whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:static group-hover:opacity-100">
            Logout
          </span>
        </button>
      </div>
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" onClick={() => setIsLogoutConfirmOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-base font-black text-slate-900">Log out?</h3>
            <p className="mt-2 text-xs text-slate-500">You will need to sign in again to access your account.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setIsLogoutConfirmOpen(false)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={logout} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">Log out</button>
            </div>
          </div>
        </div>
      )}
      </aside>
    </div>
  );
};
