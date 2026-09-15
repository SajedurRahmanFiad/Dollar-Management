import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  LogOut,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useExchange } from '../../context/ExchangeContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    deals,
    customers,
    requests,
    searchQuery,
    setSearchQuery,
    activeRole,
    setCurrentView,
    setSelectedDealId,
    setSelectedCustomerId,
  } = useExchange();

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileAccountOpen, setIsMobileAccountOpen] = useState(false);

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const items: Array<{
      id: string;
      label: string;
      detail: string;
      type: 'deal' | 'customer' | 'request';
    }> = [];

    deals
      .filter((deal) =>
        [deal.dealNumber, deal.customerName, deal.customerPhone]
          .some((value) => value.toLowerCase().includes(query))
      )
      .slice(0, 4)
      .forEach((deal) => items.push({
        id: deal.id,
        label: deal.dealNumber,
        detail: deal.customerName,
        type: 'deal',
      }));

    customers
      .filter((customer) =>
        [customer.name, customer.phone, customer.companyName || '']
          .some((value) => value.toLowerCase().includes(query))
      )
      .slice(0, 3)
      .forEach((customer) => items.push({
        id: customer.id,
        label: customer.name,
        detail: customer.phone,
        type: 'customer',
      }));

    requests
      .filter((request) =>
        [request.requestNumber, request.customerName, request.customerPhone]
          .some((value) => value.toLowerCase().includes(query))
      )
      .slice(0, 2)
      .forEach((request) => items.push({
        id: request.id,
        label: request.requestNumber,
        detail: request.customerName,
        type: 'request',
      }));

    return items.slice(0, 6);
  }, [customers, deals, requests, searchQuery]);

  const handleSuggestionSelect = (suggestion: (typeof suggestions)[number]) => {
    setSearchQuery('');
    if (suggestion.type === 'deal') {
      setSelectedDealId(suggestion.id);
    } else if (suggestion.type === 'customer') {
      setSelectedCustomerId(suggestion.id);
      setCurrentView('customers');
    } else {
      setCurrentView('requests');
    }
    setIsMobileSearchOpen(false);
  };

  const renderSuggestions = () => suggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {suggestions.map((suggestion) => (
        <button
          key={`${suggestion.type}-${suggestion.id}`}
          type="button"
          onClick={() => handleSuggestionSelect(suggestion)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-50"
        >
          <span className="font-bold text-slate-800">{suggestion.label}</span>
          <span className="truncate text-slate-400">{suggestion.detail}</span>
        </button>
      ))}
    </div>
  );

  return (
    <header className="sticky top-0 z-30 min-h-16 bg-white/95 backdrop-blur-md border-b border-slate-100 px-3 sm:px-6 py-2.5 transition-all">
      <div className="relative flex min-h-11 items-center justify-between gap-2 sm:gap-4">
        {/* Left Side: Brand Indicator */}
        <div className="flex items-center gap-2">
          <div className="lg:hidden flex items-center gap-2">
            <img
              src="/uploads/logoPNGFIT.png"
              alt="Fundify"
              className="h-8 w-auto max-w-30 object-contain"
            />
          </div>

        </div>

        {/* Search Bar (Desktop) */}
        <div className="absolute left-1/2 top-1/2 hidden w-64 -translate-x-1/2 -translate-y-1/2 md:block lg:w-96">
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
            {renderSuggestions()}
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

          <div className="relative md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileAccountOpen((open) => !open)}
              aria-label="Account menu"
              aria-expanded={isMobileAccountOpen}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-xs font-black text-white ring-2 ring-white hover:bg-slate-700"
            >
              {user?.name?.charAt(0).toUpperCase() || <UserRound className="h-4 w-4" />}
            </button>
            {isMobileAccountOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('profile');
                    setIsMobileAccountOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <UserRound className="h-4 w-4 text-slate-400" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4 text-slate-400" />
                  Logout
                </button>
              </div>
            )}
          </div>

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
            {renderSuggestions()}
          </div>
        </div>
      )}
    </header>
  );
};
