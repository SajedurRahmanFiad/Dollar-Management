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
          (customer.email && customer.email.toLowerCase().includes(q)) ||
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customer Relationship Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, auto-computed lifetime statistics, and deal histories
          </p>
        </div>

        <button
          onClick={onOpenNewCustomerModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Action Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, location..."
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
            <option value="all">All Customer Accounts ({customers.length})</option>
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

      {/* Customer Data Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Customer Profile</th>
                <th className="py-3.5 px-4 text-right">Current Due</th>
                <th className="py-3.5 px-4 text-right">Lifetime Value</th>
                <th className="py-3.5 px-4 text-right">Total USD</th>
                <th className="py-3.5 px-4 text-center">Deals</th>
                <th className="py-3.5 px-4">Payment Behavior</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customers match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(({ customer, summary }) => {
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
                            <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors block">
                              {customer.name}
                            </span>
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

                      {/* Payment Behavior */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border ${
                            summary.paymentBehavior === 'Prompt & Reliable'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : summary.paymentBehavior === 'Has Overdue Dues'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              summary.paymentBehavior === 'Prompt & Reliable'
                                ? 'bg-emerald-500'
                                : summary.paymentBehavior === 'Has Overdue Dues'
                                ? 'bg-rose-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {summary.paymentBehavior}
                        </span>
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{filteredCustomers.length}</strong> customers
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
