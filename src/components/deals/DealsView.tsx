import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowUpDown,
  ChevronRight,
  DollarSign,
  Filter,
  Layers,
  Upload,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { StatusBadge } from '../common/StatusBadge';
import { Pagination } from '../common/Pagination';
import { formatBdt, formatRate, formatUsd } from '../../utils/calculations';
import { Deal, DealStatus } from '../../types';
import { useUrlPagination } from '../../hooks/useUrlPagination';

interface DealsViewProps {
  onSelectDeal: (dealId: string) => void;
  onOpenNewDealModal: () => void;
}

export const DealsView: React.FC<DealsViewProps> = ({
  onSelectDeal,
  onOpenNewDealModal,
}) => {
  const {
    deals,
    customers,
    searchQuery,
    setSearchQuery,
    activeRole,
    activeCustomerId,
    setCurrentView,
  } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'usd_desc' | 'due_desc'>('newest');

  // Customer scope vs Owner scope
  const scopedDeals = useMemo(() => {
    if (activeRole === 'customer') {
      return deals.filter((d) => d.customerId === currentCustomer?.id);
    }
    return deals;
  }, [deals, activeRole, currentCustomer]);

  // Filter and Sort Logic
  const filteredDeals = useMemo(() => {
    return scopedDeals
      .filter((deal) => {
        // Global search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesQuery =
            deal.dealNumber.toLowerCase().includes(q) ||
            deal.customerName.toLowerCase().includes(q) ||
            deal.customerPhone.toLowerCase().includes(q) ||
            deal.dollarAmount.toString().includes(q) ||
            deal.expectedBdtAmount.toString().includes(q);
          if (!matchesQuery) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && deal.status !== statusFilter) {
          return false;
        }

        // Customer filter (owner only)
        if (activeRole === 'owner' && customerFilter !== 'all' && deal.customerId !== customerFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'usd_desc') {
          return b.dollarAmount - a.dollarAmount;
        }
        if (sortBy === 'due_desc') {
          return b.dueAmount - a.dueAmount;
        }
        return 0;
      });
  }, [scopedDeals, searchQuery, statusFilter, customerFilter, sortBy, activeRole]);

  const { currentPage, totalPages, pageStart, pageEnd, goToPage } =
    useUrlPagination(filteredDeals.length);
  const paginatedDeals = filteredDeals.slice(pageStart, pageEnd);

  // Summary counts
  const totalUsdInView = filteredDeals.reduce((sum, d) => sum + d.dollarAmount, 0);
  const totalDueInView = filteredDeals.reduce((sum, d) => sum + (d.dueAmount || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {activeRole === 'customer' ? 'My Deals & Orders' : 'Deals'}
          </h1>
        </div>

        {activeRole === 'customer' ? (
          <button
            onClick={() => setCurrentView('requests')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Fund</span>
          </button>
        ) : (
          <button
            onClick={onOpenNewDealModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Deal</span>
          </button>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'awaiting_confirmation', label: 'Awaiting Confirmation' },
            { id: 'fundify_verification_pending', label: 'Fundify Verification Pending' },
            { id: 'active_due', label: 'Active Due' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'completed', label: 'Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sorting Dropdown & Customer Filter (Owner only) */}
        <div className="flex items-center gap-2">
          {activeRole === 'owner' && (
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">All Clients</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="usd_desc">Highest USD</option>
            <option value="due_desc">Highest Due</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Deals Data List / Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No deals match your filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden space-y-3 bg-slate-50">
              {paginatedDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal.id)}
                  className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs active:bg-slate-50 transition-colors flex flex-col gap-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-black text-xs text-slate-900">
                          {deal.customerName}
                        </span>
                        <StatusBadge status={deal.status} size="sm" />
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 font-mono">
                        {formatUsd(deal.dollarAmount)} USD
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Rate: {formatRate(deal.exchangeRate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight uppercase font-bold">
                          Settled
                        </span>
                        <span className="font-bold text-emerald-700 text-xs tabular-nums">
                          {formatBdt(deal.paidAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block leading-tight uppercase font-bold">
                          Remaining Due
                        </span>
                        <span
                          className={`font-black text-xs tabular-nums ${
                            deal.dueAmount > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {formatBdt(deal.dueAmount)}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-5">Deal Number</th>
                    {activeRole === 'owner' && <th className="py-3 px-4">Client</th>}
                    <th className="py-3 px-4">USD Dispatched</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Total (BDT)</th>
                    <th className="py-3 px-4">Settled</th>
                    <th className="py-3 px-4">Remaining Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        {deal.dealNumber}
                      </td>

                      {activeRole === 'owner' && (
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {deal.customerName}
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-black text-slate-900 font-mono tabular-nums">
                        {formatUsd(deal.dollarAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums">
                        {formatRate(deal.exchangeRate)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                        {formatBdt(deal.expectedBdtAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">
                        {formatBdt(deal.paidAmount)}
                      </td>

                      <td className="py-3.5 px-4 tabular-nums">
                        <span
                          className={`font-black ${
                            deal.dueAmount > 0 ? 'text-amber-700' : 'text-slate-400'
                          }`}
                        >
                          {formatBdt(deal.dueAmount)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={deal.status} />
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDeal(deal.id);
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          Open &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDeals.length}
              onPageChange={goToPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
