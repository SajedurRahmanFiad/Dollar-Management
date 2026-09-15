import React, { useState } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Phone,
  Mail,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Edit2,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { StatusBadge } from '../common/StatusBadge';
import { calculateCustomerSummary, formatBdt, formatRate, formatUsd } from '../../utils/calculations';
import { NewDealModal } from '../modals/NewDealModal';
import { ClientBadge } from '../common/ClientBadge';
import { Pagination } from '../common/Pagination';
import { useUrlPagination } from '../../hooks/useUrlPagination';

interface CustomerProfileViewProps {
  customerId: string;
  onBack: () => void;
  onSelectDeal: (dealId: string) => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  customerId,
  onBack,
  onSelectDeal,
}) => {
  const { customers, deals, updateCustomer } = useExchange();
  const customer = customers.find((c) => c.id === customerId);

  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all' | 'payments' | 'timeline'>('active');
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

  const customerDeals = customer
    ? deals.filter((d) => d.customerId === customer.id)
    : [];
  const activeDeals = customerDeals.filter(
    (d) => d.status === 'active_due' || d.status === 'partially_paid' || d.status === 'fundify_verification_pending' || d.status === 'awaiting_confirmation' || d.status === 'draft'
  );
  const completedDeals = customerDeals.filter((d) => d.status === 'completed');
  const allPaymentEvents = customerDeals.flatMap((d) =>
    d.timeline
      .filter((e) => e.type === 'payment_proof_submitted' || e.type === 'payment_approved')
      .map((e) => ({ ...e, dealNumber: d.dealNumber, dealId: d.id }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const dealsInView = activeTab === 'active'
    ? activeDeals
    : activeTab === 'completed'
    ? completedDeals
    : customerDeals;
  const { currentPage: dealsPage, totalPages: dealsTotalPages, pageStart: dealsPageStart, pageEnd: dealsPageEnd, goToPage: goToDealsPage } =
    useUrlPagination(dealsInView.length, 'dealsPage');
  const { currentPage: paymentsPage, totalPages: paymentsTotalPages, pageStart: paymentsPageStart, pageEnd: paymentsPageEnd, goToPage: goToPaymentsPage } =
    useUrlPagination(allPaymentEvents.length, 'paymentsPage');

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">Customer not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const summary = calculateCustomerSummary(customer, deals);
  const visibleDeals = dealsInView.slice(dealsPageStart, dealsPageEnd);
  const visiblePaymentEvents = allPaymentEvents.slice(paymentsPageStart, paymentsPageEnd);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Back to clients"
            className="p-2 shrink-0 self-center bg-transparent hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-600 rounded-xl transition-all flex items-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2.5">
              <h1 className="order-last text-2xl font-bold text-slate-900 tracking-tight sm:order-none">
                {customer.name}
              </h1>
              <span className="order-first sm:order-none">
                <ClientBadge size="sm" variant="gold" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.phone}
              </span>
              {customer.companyName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {customer.companyName}
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewDealModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Deal</span>
        </button>
      </div>

      {/* Financial Vitals at the Top */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Current Due</span>
            <div className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums tracking-tight">
            {formatBdt(summary.currentDue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {summary.currentDue > 0
              ? `${summary.activeDealsCount} unpaid deal(s)`
              : 'All balances cleared'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Lifetime Transaction Value
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums tracking-tight">
            {formatBdt(summary.lifetimeValue)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Total historical deal volume
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Amount Paid
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums tracking-tight">
            {formatBdt(summary.totalAmountPaid)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Approved BDT payments received
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Dollars Purchased
          </span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1 font-mono tabular-nums tracking-tight">
            {formatUsd(summary.totalDollarsPurchased)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Across {summary.totalDealsCount} recorded deals
          </span>
        </div>
      </div>

      {/* Secondary Relationship Behavior Metrics */}
      <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block font-medium">Payment Behavior</span>
          <span className="font-bold text-slate-900 mt-0.5 inline-flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                summary.paymentBehavior === 'Prompt & Reliable'
                  ? 'bg-emerald-500'
                  : summary.paymentBehavior === 'Has Overdue Dues'
                  ? 'bg-rose-500'
                  : 'bg-blue-500'
              }`}
            />
            {summary.paymentBehavior}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block font-medium">Average Deal Size</span>
          <span className="font-bold text-slate-900 mt-0.5 font-mono">
            {formatUsd(summary.averageDealSizeUsd)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block font-medium">Largest Deal</span>
          <span className="font-bold text-slate-900 mt-0.5 font-mono">
            {formatUsd(summary.largestDealUsd)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block font-medium">Customer Since</span>
          <span className="font-bold text-slate-900 mt-0.5">
            {new Date(customer.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Tabbed Interface: Active Deals, Completed Deals, All Deals, Payment History */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        {/* Clean Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'active'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Active Deals ({activeDeals.length})
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'completed'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Completed Deals ({completedDeals.length})
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            All Deals ({customerDeals.length})
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Payment Proof History ({allPaymentEvents.length})
          </button>
        </div>

        {/* Tab Content: Deals Table */}
        {(activeTab === 'active' || activeTab === 'completed' || activeTab === 'all') && (
          <div>
            {/* Mobile Card List (< md) */}
            <div className="space-y-3 bg-slate-50 p-3 md:hidden">
              {dealsInView.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  No deals in this tab.
                </div>
              ) : (
                visibleDeals.map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => onSelectDeal(deal.id)}
                    className="flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-xs transition-colors active:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-mono text-xs font-black text-slate-900">
                          {deal.dealNumber}
                        </span>
                        <StatusBadge status={deal.status} size="sm" />
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-black text-slate-900">
                          {formatUsd(deal.dollarAmount)} USD
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          Rate: {formatRate(deal.exchangeRate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100/80 pt-2 text-xs">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="block text-[10px] font-bold uppercase leading-tight text-slate-400">
                            Settled
                          </span>
                          <span className="text-xs font-bold tabular-nums text-emerald-700">
                            {formatBdt(deal.paidAmount)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase leading-tight text-slate-400">
                            Remaining Due
                          </span>
                          <span className={`text-xs font-black tabular-nums ${deal.dueAmount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                            {formatBdt(deal.dueAmount)}
                          </span>
                        </div>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-blue-600">
                        Open <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Deal Number</th>
                  <th className="py-3.5 px-4 text-right">USD Amount</th>
                  <th className="py-3.5 px-4 text-right">Exchange Rate</th>
                  <th className="py-3.5 px-4 text-right">Expected BDT</th>
                  <th className="py-3.5 px-4 text-right">Paid Amount</th>
                  <th className="py-3.5 px-4 text-right">Remaining Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {dealsInView.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      No deals in this tab.
                    </td>
                  </tr>
                ) : (
                  visibleDeals.map((deal) => (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-5 font-mono font-bold text-slate-900">
                        {deal.dealNumber}
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {formatUsd(deal.dollarAmount)}
                      </td>
                      <td className="py-4 px-4 text-right text-slate-600 tabular-nums">
                        {formatRate(deal.exchangeRate)}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-slate-800 tabular-nums">
                        {formatBdt(deal.expectedBdtAmount)}
                      </td>
                      <td className="py-4 px-4 text-right text-emerald-600 font-semibold tabular-nums">
                        {formatBdt(deal.paidAmount)}
                      </td>
                      <td className="py-4 px-4 text-right tabular-nums">
                        {deal.dueAmount > 0 ? (
                          <span className="font-bold text-amber-700">
                            {formatBdt(deal.dueAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400">৳0</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={deal.status} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap text-[11px] tabular-nums">
                        {new Date(deal.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="inline-flex items-center px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors">
                          <span>Open</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
            <Pagination
              currentPage={dealsPage}
              totalPages={dealsTotalPages}
              totalItems={dealsInView.length}
              onPageChange={goToDealsPage}
            />
          </div>
        )}

        {/* Tab Content: Payment History */}
        {activeTab === 'payments' && (
          <div className="p-6 space-y-3">
            {allPaymentEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No payment history recorded yet.
              </p>
            ) : (
              visiblePaymentEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onSelectDeal(evt.dealId)}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/60 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        evt.proofStatus === 'approved' || evt.type === 'payment_approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : evt.proofStatus === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      ৳
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {evt.title} — Deal <span className="font-mono">{evt.dealNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{evt.description}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-bold text-slate-900 block tabular-nums">
                      {evt.amountBdt ? formatBdt(evt.amountBdt) : ''}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <Pagination
              currentPage={paymentsPage}
              totalPages={paymentsTotalPages}
              totalItems={allPaymentEvents.length}
              onPageChange={goToPaymentsPage}
            />
          </div>
        )}
      </div>

      {/* Modal */}
      <NewDealModal
        isOpen={isNewDealModalOpen}
        onClose={() => setIsNewDealModalOpen(false)}
        initialCustomerId={customer.id}
      />
    </div>
  );
};
