import React from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  User,
  DollarSign,
  ChevronDown,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { formatBdt } from '../../utils/calculations';

interface HeaderProps {
  onOpenNewDealModal: () => void;
  onOpenNewRequestModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewDealModal,
  onOpenNewRequestModal,
}) => {
  const {
    deals,
    customers,
    searchQuery,
    setSearchQuery,
    activeRole,
    setActiveRole,
    activeCustomerId,
    setActiveCustomerId,
    resetToMockData,
  } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Owner aggregate due
  const totalOwnerOutstandingDue = deals
    .filter(
      (d) =>
        (d.status === 'active_due' || d.status === 'partially_paid') &&
        d.dueAmount > 0
    )
    .reduce((sum, d) => sum + d.dueAmount, 0);

  // Customer personal due
  const customerPersonalDue = currentCustomer
    ? deals
        .filter(
          (d) =>
            d.customerId === currentCustomer.id &&
            (d.status === 'active_due' || d.status === 'partially_paid') &&
            d.dueAmount > 0
        )
        .reduce((sum, d) => sum + d.dueAmount, 0)
    : 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Search Bar (Clean & Compact) */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeRole === 'customer'
                ? 'Search my orders & receipts...'
                : 'Search deals, customers, receipts...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* If in Customer Role: Show Active Customer Picker */}
        {activeRole === 'customer' && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Viewing as:
            </span>
            <select
              value={currentCustomer?.id || ''}
              onChange={(e) => setActiveCustomerId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Financial Stat Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            activeRole === 'customer'
              ? customerPersonalDue > 0
                ? 'bg-amber-50 border-amber-200/80 text-amber-950'
                : 'bg-emerald-50 border-emerald-200/80 text-emerald-950'
              : 'bg-amber-50 border-amber-200/80 text-amber-950'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              (activeRole === 'customer' ? customerPersonalDue : totalOwnerOutstandingDue) > 0
                ? 'bg-amber-500 animate-pulse'
                : 'bg-emerald-500'
            }`}
          />
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
              {activeRole === 'customer' ? 'My Outstanding Due' : 'Total Due Owed'}
            </span>
            <span className="text-xs font-black tabular-nums leading-tight block">
              {formatBdt(
                activeRole === 'customer' ? customerPersonalDue : totalOwnerOutstandingDue
              )}
            </span>
          </div>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveRole('owner')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeRole === 'owner'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Owner
          </button>
          <button
            onClick={() => setActiveRole('customer')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeRole === 'customer'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Customer
          </button>
        </div>

        {/* Primary Role Action:
            - If Customer: "Request Dollars" (Inquiry)
            - If Owner: "New Deal"
        */}
        {activeRole === 'customer' ? (
          <button
            onClick={onOpenNewRequestModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Dollars</span>
          </button>
        ) : (
          <button
            onClick={onOpenNewDealModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Deal</span>
          </button>
        )}

        {/* Reset Demo Data Button */}
        <button
          onClick={() => {
            if (confirm('Reset system data to initial state?')) {
              resetToMockData();
            }
          }}
          title="Reset Demo Data"
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
