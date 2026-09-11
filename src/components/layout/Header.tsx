import React, { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  User,
  DollarSign,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  Menu,
  X,
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

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand Indicator */}
        <div className="flex items-center gap-2">
          <div className="lg:hidden flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-2xs ${
                activeRole === 'customer'
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-600'
                  : 'bg-slate-900'
              }`}
            >
              $
            </div>
            <span className="font-extrabold text-xs text-slate-900 tracking-tight block sm:hidden">
              Ahmed Sourov
            </span>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:block w-48 lg:w-72">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeRole === 'customer'
                    ? 'Search orders & receipts...'
                    : 'Search deals, clients...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            aria-label="Search"
          >
            {isMobileSearchOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>

          {/* If in Customer Role: Show Active Customer Picker */}
          {activeRole === 'customer' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl max-w-[130px] sm:max-w-none">
              <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Client:
              </span>
              <select
                value={currentCustomer?.id || ''}
                onChange={(e) => setActiveCustomerId(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 focus:outline-none cursor-pointer truncate pr-0.5"
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
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
              activeRole === 'customer'
                ? customerPersonalDue > 0
                  ? 'bg-amber-50 border-amber-200/80 text-amber-950'
                  : 'bg-emerald-50 border-emerald-200/80 text-emerald-950'
                : 'bg-amber-50 border-amber-200/80 text-amber-950'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                (activeRole === 'customer'
                  ? customerPersonalDue
                  : totalOwnerOutstandingDue) > 0
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-emerald-500'
              }`}
            />
            <div className="text-left">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider block leading-none">
                {activeRole === 'customer' ? 'My Due' : 'Due Owed'}
              </span>
              <span className="text-xs font-black tabular-nums leading-tight block">
                {formatBdt(
                  activeRole === 'customer'
                    ? customerPersonalDue
                    : totalOwnerOutstandingDue
                )}
              </span>
            </div>
          </div>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveRole('owner')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs transition-all ${
                activeRole === 'owner'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setActiveRole('customer')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs transition-all flex items-center gap-1 ${
                activeRole === 'customer'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span>Client</span>
            </button>
          </div>

          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (confirm('Reset system data to initial state?')) {
                resetToMockData();
              }
            }}
            title="Reset Demo Data"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Row */}
      {isMobileSearchOpen && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 md:hidden animate-in fade-in slide-in-from-top-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder={
                activeRole === 'customer'
                  ? 'Search orders & receipts...'
                  : 'Search deals, clients...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      )}
    </header>
  );
};
