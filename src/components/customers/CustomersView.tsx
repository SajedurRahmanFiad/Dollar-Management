import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  ArrowUpDown,
  Phone,
  Mail,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { calculateCustomerSummary, formatBdt, formatUsd } from '../../utils/calculations';
import { NewCustomerModal } from '../modals/NewCustomerModal';
import { ClientBadge } from '../common/ClientBadge';

interface CustomersViewProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenNewCustomerModal: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onSelectCustomer,
  onOpenNewCustomerModal,
}) => {
  const { customers, deals, searchQuery, setSearchQuery } = useExchange();

  const [behaviorFilter, setBehaviorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_desc' | 'volume_desc' | 'name' | 'recent'>('due_desc');

  // Customer summaries
  const customerSummaries = useMemo(() => {
    return customers.map((c) => ({
      customer: c,
      summary: calculateCustomerSummary(c, deals),
    }));
  }, [customers, deals]);

  // Filter & Sort
  const filteredCustomers = useMemo(() => {
    return customerSummaries.filter(({ customer, summary }) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          customer.name.toLowerCase().includes(q) ||
          customer.phone.toLowerCase().includes(q) ||
          (customer.location && customer.location.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (behaviorFilter === 'has_due' && summary.currentDue <= 0) return false;
      if (behaviorFilter === 'overdue' && summary.paymentBehavior !== 'Has Overdue Dues') return false;
      if (behaviorFilter === 'reliable' && summary.paymentBehavior !== 'Prompt & Reliable') return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'due_desc') return b.summary.currentDue - a.summary.currentDue;
      if (sortBy === 'volume_desc') return b.summary.lifetimeValue - a.summary.lifetimeValue;
      if (sortBy === 'name') return a.customer.name.localeCompare(b.customer.name);
      if (sortBy === 'recent') {
        return new Date(b.summary.lastActivityDate).getTime() - new Date(a.summary.lastActivityDate).getTime();
      }
      return 0;
    });
  }, [customerSummaries, searchQuery, behaviorFilter, sortBy]);

  const totalOutstandingDue = customerSummaries.reduce((sum, c) => sum + c.summary.currentDue, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Client Portfolio &amp; Directory
            </h1>
            <ClientBadge size="sm" variant="gold" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, auto-computed lifetime exchange statistics, and ledger balances
          </p>
        </div>

        <button
          onClick={onOpenNewCustomerModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Action Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, phone, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/70 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={behaviorFilter}
            onChange={(e) => setBehaviorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Client Accounts ({customers.length})</option>
            <option value="has_due">With Outstanding Balance Only</option>
            <option value="overdue">Overdue Balances (&gt;7 days)</option>
            <option value="reliable">Prompt &amp; Reliable Payers</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
          >
            <option value="due_desc">Sort: Highest Outstanding Due</option>
            <option value="volume_desc">Sort: Highest Lifetime Value</option>
            <option value="recent">Sort: Most Recently Active</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table & Mobile List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No clients match your search criteria.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredCustomers.map(({ customer, summary }) => {
                const hasDue = summary.currentDue > 0;
                return (
                  <div
                    key={customer.id}
                    onClick={() => onSelectCustomer(customer.id)}
                    className="p-4 active:bg-slate-50 transition-colors flex flex-col gap-3 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-xs ${
                            customer.avatarColor || 'bg-slate-800'
                          }`}
                        >
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">
                              {customer.name}
                            </span>
                            <ClientBadge
                              size="sm"
                              variant="gold"
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {customer.phone}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {hasDue ? (
                          <div>
                            <span className="font-black text-amber-700 text-sm tabular-nums block">
                              {formatBdt(summary.currentDue)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Due Owed
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ৳0 Due
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50/70 rounded-xl text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Lifetime (BDT)
                        </span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          {formatBdt(summary.lifetimeValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Total USD
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800 tabular-nums">
                          {formatUsd(summary.totalDollarsPurchased)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Deals
                        </span>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">
                          {summary.totalDealsCount}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span
                        className={`text-[11px] font-semibold ${
                          summary.paymentBehavior === 'Prompt & Reliable'
                            ? 'text-emerald-700'
                            : summary.paymentBehavior === 'Has Overdue Dues'
                            ? 'text-rose-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {summary.paymentBehavior}
                      </span>
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Client Profile</th>
                    <th className="py-3.5 px-4 text-right">Current Due</th>
                    <th className="py-3.5 px-4 text-right">Lifetime Value</th>
                    <th className="py-3.5 px-4 text-right">Total USD</th>
                    <th className="py-3.5 px-4 text-center">Deals</th>
                    <th className="py-3.5 px-4">Tier &amp; Standing</th>
                    <th className="py-3.5 px-4">Channel</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredCustomers.map(({ customer, summary }) => {
                    const hasDue = summary.currentDue > 0;

                    return (
                      <tr
                        key={customer.id}
                        onClick={() => onSelectCustomer(customer.id)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        {/* Customer info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs ${
                                customer.avatarColor || 'bg-slate-800'
                              }`}
                            >
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors block">
                                  {customer.name}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {customer.phone}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Current Due */}
                        <td className="py-4 px-4 text-right tabular-nums">
                          {hasDue ? (
                            <div>
                              <span className="font-bold text-amber-700 text-sm">
                                {formatBdt(summary.currentDue)}
                              </span>
                              {summary.oldestUnpaidDealDays > 0 && (
                                <span className="text-[10px] text-slate-400 block">
                                  {summary.oldestUnpaidDealDays}d outstanding
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-semibold">৳0 Due</span>
                          )}
                        </td>

                        {/* Lifetime Value */}
                        <td className="py-4 px-4 text-right font-bold text-slate-800 tabular-nums">
                          {formatBdt(summary.lifetimeValue)}
                        </td>

                        {/* Total USD */}
                        <td className="py-4 px-4 text-right font-mono font-semibold text-slate-700 tabular-nums">
                          {formatUsd(summary.totalDollarsPurchased)}
                        </td>

                        {/* Total Deals */}
                        <td className="py-4 px-4 text-center tabular-nums">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {summary.totalDealsCount}
                          </span>
                        </td>

                        {/* Tier & Payment Behavior */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-start gap-1">
                            <ClientBadge size="sm" variant="gold" />
                            <span
                              className={`text-[10px] font-semibold ${
                                summary.paymentBehavior === 'Prompt & Reliable'
                                  ? 'text-emerald-700'
                                  : summary.paymentBehavior === 'Has Overdue Dues'
                                  ? 'text-rose-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {summary.paymentBehavior}
                            </span>
                          </div>
                        </td>

                        {/* Preferred Channel */}
                        <td className="py-4 px-4 text-slate-500 text-xs">
                          {customer.preferredChannel || 'WhatsApp'}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-5 text-right">
                          <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                            <span>View Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{filteredCustomers.length}</strong> clients
          </span>
          <span>
            Total System Outstanding Due:{' '}
            <strong className="text-amber-700 font-bold tabular-nums">
              {formatBdt(totalOutstandingDue)}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
