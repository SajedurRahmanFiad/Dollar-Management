import React, { useState } from 'react';
import {
  DollarSign,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Layers,
  Plus,
  ArrowRight,
  Wallet,
  TrendingUp,
  X,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  formatBdt,
  formatRate,
  formatUsd,
  calculateCustomerSummary,
} from '../../utils/calculations';
import { SubmitPaymentProofModal } from '../modals/SubmitPaymentProofModal';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { ClientBadge } from '../common/ClientBadge';

interface CustomerPortalViewProps {
  onSelectDeal: (dealId: string) => void;
  onOpenNewRequestModal?: () => void;
}

const getProgressColor = (percent: number) => {
  const red = [239, 68, 68];
  const emerald = [16, 185, 129];
  const ratio = Math.max(0, Math.min(100, percent)) / 100;
  const channels = red.map((channel, index) =>
    Math.round(channel + (emerald[index] - channel) * ratio)
  );

  return `rgb(${channels.join(', ')})`;
};

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  onSelectDeal,
  onOpenNewRequestModal,
}) => {
  const {
    customers,
    deals,
    requests,
    activeCustomerId,
    setActiveCustomerId,
    confirmDollarReceipt,
    disputeDollarReceipt,
    submitPaymentProof,
  } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [isSubmitPaymentModalOpen, setIsSubmitPaymentModalOpen] = useState(false);
  const [activePaymentDeal, setActivePaymentDeal] = useState<
    typeof deals[0] | null
  >(null);
  const [receiptConfirmationDeal, setReceiptConfirmationDeal] = useState<
    typeof deals[0] | null
  >(null);
  const [selectedProofImg, setSelectedProofImg] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

  if (!currentCustomer) return null;

  // STRICTLY Customer's own deals and inquiries
  const customerDeals = deals.filter((d) => d.customerId === currentCustomer.id);
  const customerRequests = requests.filter(
    (r) =>
      r.customerId === currentCustomer.id ||
      r.customerPhone === currentCustomer.phone
  );

  const summary = calculateCustomerSummary(currentCustomer, deals);

  const awaitingConfirmationDeals = customerDeals.filter(
    (d) => d.status === 'awaiting_confirmation'
  );
  const activeDueDeals = customerDeals.filter(
    (d) =>
      d.status !== 'completed' &&
      d.status !== 'cancelled' &&
      d.dueAmount > 0
  );
  const completedDeals = customerDeals.filter((d) => d.status === 'completed');

  const filteredDeals =
    activeTab === 'active'
      ? customerDeals.filter((d) => d.status !== 'completed' && d.status !== 'cancelled')
      : activeTab === 'completed'
      ? completedDeals
      : customerDeals;

  const totalPaidPercent =
    summary.lifetimeValue > 0
      ? Math.min(100, Math.round((summary.totalAmountPaid / summary.lifetimeValue) * 100))
      : 100;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Client Header & Quick Stats Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 min-w-14 min-h-14 shrink-0 rounded-full bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-center text-xl font-black shadow-xs">
            {currentCustomer.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2.5">
              <h1 className="order-2 text-xl font-black text-slate-900 md:order-1">
                {currentCustomer.name}
              </h1>
              <span className="order-1 md:order-2">
                <ClientBadge tier="Private Client" size="md" variant="gold" />
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentCustomer.phone} {currentCustomer.email ? `• ${currentCustomer.email}` : ''}
            </p>
            {currentCustomer.companyName && (
              <p className="text-xs text-slate-500 mt-0.5">
                {currentCustomer.companyName}
              </p>
            )}
          </div>
        </div>

        {/* Action Button: Client Requests Dollars */}
        <div className="hidden items-center gap-3 md:flex">
          {onOpenNewRequestModal && (
            <button
              onClick={onOpenNewRequestModal}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Request Fund</span>
            </button>
          )}
        </div>
      </div>

      {/* Immediate Action Banner: Awaiting Receipt Confirmation */}
      {awaitingConfirmationDeals.length > 0 && (
        <div className="space-y-3">
          {awaitingConfirmationDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-spin text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-md">
                      Action Required
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    Please confirm receipt of {formatUsd(deal.dollarAmount)}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                {deal.dollarProofUrl && (
                  <button
                    onClick={() =>
                      setSelectedProofImg({
                        url: deal.dollarProofUrl!,
                        title: `Transfer Proof - ${deal.dealNumber}`,
                        subtitle: `${formatUsd(deal.dollarAmount)} USD Transfer`,
                      })
                    }
                    className="px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Proof</span>
                  </button>
                )}

                <button
                  onClick={() => setReceiptConfirmationDeal(deal)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Received</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visual Personal Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Outstanding Due */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              My Outstanding Due
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                summary.currentDue > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="my-2">
            <div
              className={`text-2xl font-black tabular-nums tracking-tight ${
                summary.currentDue > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {formatBdt(summary.currentDue)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {summary.currentDue > 0
                ? `${activeDueDeals.length} active order(s) pending payment`
                : 'All dues fully settled'}
            </span>
          </div>

          {summary.currentDue > 0 && activeDueDeals[0] && (
            <button
              onClick={() => {
                setActivePaymentDeal(activeDueDeals[0]);
                setIsSubmitPaymentModalOpen(true);
              }}
              className="mt-2 w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Payment Slip</span>
            </button>
          )}
        </div>

        {/* Card 2: Total USD Bought */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total USD Purchased
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              $
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight tabular-nums">
              {formatUsd(summary.totalDollarsPurchased)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Across {summary.totalDealsCount} total orders
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${Math.min(100, summary.totalDealsCount * 25)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Total Paid & Settlement Progress */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total BDT Settled
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-700 tabular-nums tracking-tight">
              {formatBdt(summary.totalAmountPaid)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-0.5">
              <span>Settlement Progress</span>
              <span className="font-bold text-slate-700">{totalPaidPercent}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${totalPaidPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Deals List (Only Customer's Deals) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              My Deals
            </h2>
            <p className="text-xs text-slate-500">
              {customerDeals.length} deals in total
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({customerDeals.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Active ({activeDueDeals.length + awaitingConfirmationDeals.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Settled ({completedDeals.length})
            </button>
          </div>
        </div>

        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No orders found</h3>
            <p className="text-xs text-slate-400 mt-1">
              You do not have any orders in this tab.
            </p>
            {onOpenNewRequestModal && (
              <button
                onClick={onOpenNewRequestModal}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Request Funds Now
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-2 bg-slate-50 p-2">
              {filteredDeals.map((deal) => {
                const hasDue = deal.dueAmount > 0;
                const progressPercent = deal.expectedBdtAmount > 0
                  ? Math.min(100, Math.round((deal.paidAmount / deal.expectedBdtAmount) * 100))
                  : 0;

                return (
                  <div
                    key={deal.id}
                    onClick={() => onSelectDeal(deal.id)}
                    className="cursor-pointer rounded-xl border border-slate-100 bg-white p-4 shadow-xs transition-colors active:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-500">
                          {new Date(deal.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <StatusBadge status={deal.status} size="sm" />
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-3 border-t border-slate-100/80 pt-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          USD Amount
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-black tabular-nums text-slate-900">
                          {formatUsd(deal.dollarAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Total BDT
                        </div>
                        <div className="mt-0.5 font-bold tabular-nums text-slate-800">
                          {formatBdt(deal.expectedBdtAmount)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${progressPercent}%`,
                              backgroundColor: getProgressColor(progressPercent),
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-[10px] font-bold tabular-nums text-slate-500">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] font-bold tabular-nums text-slate-500">
                        {hasDue ? `Due: ${formatBdt(deal.dueAmount)}` : 'Paid'}
                      </div>
                    </div>

                    <div className="mt-2 flex w-full gap-2">
                      {hasDue && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setActivePaymentDeal(deal);
                            setIsSubmitPaymentModalOpen(true);
                          }}
                          className="flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-amber-600"
                        >
                          <Upload className="h-3 w-3" />
                          <span>Pay Due</span>
                        </button>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          onSelectDeal(deal.id);
                        }}
                        className={`${hasDue ? 'flex-1' : 'w-full'} flex min-w-0 items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-200`}
                      >
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-190 text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-5">Deal Number</th>
                  <th className="py-3 px-4">USD Amount</th>
                  <th className="py-3 px-4">Total BDT</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDeals.map((deal) => {
                  const hasDue = deal.dueAmount > 0;
                  const progressPercent = deal.expectedBdtAmount > 0
                    ? Math.min(100, Math.round((deal.paidAmount / deal.expectedBdtAmount) * 100))
                    : 0;

                  return (
                    <tr
                      key={deal.id}
                      onClick={() => onSelectDeal(deal.id)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-slate-900">{deal.dealNumber}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          {new Date(deal.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 font-mono tabular-nums">
                        {formatUsd(deal.dollarAmount)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <div className="font-bold text-slate-800">{formatBdt(deal.expectedBdtAmount)}</div>
                        <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
                          @ {formatRate(deal.exchangeRate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 min-w-40">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor: getProgressColor(progressPercent),
                              }}
                            />
                          </div>
                          <span className="w-8 text-right text-[10px] font-bold text-slate-500 tabular-nums">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="mt-1 text-[10px] font-bold text-slate-500 tabular-nums">
                          {hasDue ? `Due: ${formatBdt(deal.dueAmount)}` : 'Paid'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={deal.status} />
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          {hasDue && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setActivePaymentDeal(deal);
                                setIsSubmitPaymentModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Pay Due</span>
                            </button>
                          )}
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onSelectDeal(deal.id);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span>Details</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      {/* Customer's Submitted Inquiries Section */}
      {customerRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                My Fund Requests
              </h3>
            </div>
            {onOpenNewRequestModal && (
              <button
                onClick={onOpenNewRequestModal}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Request</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customerRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {req.requestNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 mt-1">
                    {formatUsd(req.requestedUsdAmount)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'converted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {req.status === 'converted'
                      ? 'Converted to Deal'
                      : req.status === 'under_discussion'
                      ? 'In Discussion'
                      : 'Under Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Proof Modal */}
      {receiptConfirmationDeal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => setReceiptConfirmationDeal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Fund Receipt
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Have you received {formatUsd(receiptConfirmationDeal.dollarAmount)} in your wallet?
                  Confirming will activate your outstanding balance of{' '}
                  {formatBdt(receiptConfirmationDeal.expectedBdtAmount)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptConfirmationDeal(null)}
                aria-label="Close confirmation"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReceiptConfirmationDeal(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDollarReceipt(receiptConfirmationDeal.id);
                  setReceiptConfirmationDeal(null);
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                Confirm Received
              </button>
            </div>
          </div>
        </div>
      )}

      {activePaymentDeal && (
        <SubmitPaymentProofModal
          deal={activePaymentDeal}
          isOpen={isSubmitPaymentModalOpen}
          onClose={() => {
            setIsSubmitPaymentModalOpen(false);
            setActivePaymentDeal(null);
          }}
          onSubmit={(id, amount, url, note) => submitPaymentProof(id, amount, url, note)}
        />
      )}

      {/* Image Lightbox */}
      {selectedProofImg && (
        <ImageViewerModal
          isOpen={!!selectedProofImg}
          onClose={() => setSelectedProofImg(null)}
          imageUrl={selectedProofImg.url}
          title={selectedProofImg.title}
          subtitle={selectedProofImg.subtitle}
        />
      )}
    </div>
  );
};
