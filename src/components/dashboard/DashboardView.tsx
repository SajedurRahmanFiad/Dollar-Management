import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Plus,
  ChevronRight,
  Eye,
  Check,
  X,
  Layers,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { formatBdt, formatRate, formatUsd } from '../../utils/calculations';
import { StatusBadge } from '../common/StatusBadge';
import { ImageViewerModal } from '../common/ImageViewerModal';

interface DashboardViewProps {
  onSelectDeal: (dealId: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onOpenNewDealModal: () => void;
  onOpenNewRequestModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectDeal,
  onSelectCustomer,
  onOpenNewDealModal,
  onOpenNewRequestModal,
}) => {
  const {
    deals,
    customers,
    requests,
    approvePaymentProof,
    declinePaymentProof,
    convertRequestToDeal,
    setCurrentView,
  } = useExchange();

  const [selectedProofModal, setSelectedProofModal] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Core Financial Metrics
  const totalAmountOwed = useMemo(() => {
    return deals
      .filter((d) => (d.status === 'active_due' || d.status === 'partially_paid') && d.dueAmount > 0)
      .reduce((sum, d) => sum + d.dueAmount, 0);
  }, [deals]);

  const totalUsdVolume = useMemo(() => {
    return deals
      .filter((d) => d.status !== 'cancelled')
      .reduce((sum, d) => sum + d.dollarAmount, 0);
  }, [deals]);

  const totalCollectedBdt = useMemo(() => {
    return deals.reduce((sum, d) => sum + (d.paidAmount || 0), 0);
  }, [deals]);

  const activeDealsCount = useMemo(() => {
    return deals.filter(
      (d) => d.status === 'active_due' || d.status === 'partially_paid' || d.status === 'awaiting_confirmation'
    ).length;
  }, [deals]);

  // Action Queue: Pending payment proofs awaiting owner verification
  const pendingPaymentEvents = useMemo(() => {
    const items: Array<{
      deal: typeof deals[0];
      event: typeof deals[0]['timeline'][0];
    }> = [];
    deals.forEach((d) => {
      d.timeline.forEach((e) => {
        if (e.type === 'payment_proof_submitted' && e.proofStatus === 'pending') {
          items.push({ deal: d, event: e });
        }
      });
    });
    return items;
  }, [deals]);

  // Pending customer buy inquiries
  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'new' || r.status === 'pending');
  }, [requests]);

  const recentDeals = useMemo(() => {
    return [...deals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  }, [deals]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-150">
      {/* Top Banner & Quick Controls */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
        </div>

        <button
          onClick={onOpenNewDealModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Deal</span>
        </button>
      </div>

      {/* 4 Clean Visual Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Dues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Outstanding Due
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-amber-950 tabular-nums">
              {formatBdt(totalAmountOwed)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {activeDealsCount} active debtor transaction(s)
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-3/4" />
          </div>
        </div>

        {/* Card 2: Total USD Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total USD Volume
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              $
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {formatUsd(totalUsdVolume)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Across {deals.length} total deals
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full w-4/5" />
          </div>
        </div>

        {/* Card 3: Total Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total BDT Settled
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-emerald-800 tabular-nums">
              {formatBdt(totalCollectedBdt)}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Verified &amp; banked collections
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        {/* Card 4: Action Center */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Actions
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                pendingPaymentEvents.length + pendingRequests.length > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {pendingPaymentEvents.length + pendingRequests.length} Required
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 tabular-nums">
              {pendingPaymentEvents.length}{' '}
              <span className="text-sm font-semibold text-slate-500">Proofs</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              +{pendingRequests.length} client buy requests
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-blue-600">Review below</span>
          </div>
        </div>
      </div>

      {/* Action Queue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sub-card 1: Payment Proofs Awaiting Verification */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <h3 className="text-sm font-black text-amber-950">
                    Payment Proofs to Verify ({pendingPaymentEvents.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                  Action Needed
                </span>
              </div>

          {pendingPaymentEvents.length > 0 ? (
            <div className="space-y-2.5">
              {pendingPaymentEvents.map(({ deal, event }) => (
                  <div
                    key={event.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {deal.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {deal.dealNumber}
                        </span>
                      </div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">
                        {formatBdt(event.amountBdt || 0)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {event.proofImageUrl && (
                        <button
                          onClick={() =>
                            setSelectedProofModal({
                              url: event.proofImageUrl!,
                              title: `Payment Slip - ${deal.customerName}`,
                              subtitle: `${formatBdt(event.amountBdt || 0)}`,
                            })
                          }
                          className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Slip Screenshot"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => approvePaymentProof(deal.id, event.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt('Reason for declining this payment proof:');
                          if (reason) declinePaymentProof(deal.id, event.id, reason);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Decline"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <p className="flex min-h-24 flex-1 items-center justify-center text-center text-xs font-semibold text-emerald-700">
              Everything is clean. No payment proofs need verification.
            </p>
          )}
        </div>

        {/* Sub-card 2: Incoming Customer Buy Inquiries */}
        <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-black text-blue-950">
                    Client Requests ({pendingRequests.length})
                  </h3>
                </div>
                <button
                  onClick={() => setCurrentView('requests')}
                  className="text-[10px] font-bold text-blue-700 hover:underline"
                >
                  View All
                </button>
              </div>

          {pendingRequests.length > 0 ? (
            <div className="space-y-2.5">
              {pendingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="bg-white p-3.5 rounded-xl border border-blue-200/60 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {req.customerName}
                        </span>
                      </div>
                      <div className="text-xs font-black text-blue-900 mt-0.5">
                        {formatUsd(req.requestedUsdAmount)} USD
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        const rate = prompt(
                          `Enter exchange rate for ${req.customerName} ($${req.requestedUsdAmount}):`,
                          '122.50'
                        );
                        if (rate && !isNaN(parseFloat(rate))) {
                          const deal = await convertRequestToDeal(req.id, parseFloat(rate));
                          if (deal) onSelectDeal(deal.id);
                        }
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      Convert to Deal
                    </button>
                  </div>
              ))}
            </div>
          ) : (
            <p className="flex min-h-24 flex-1 items-center justify-center text-center text-xs font-semibold text-emerald-700">
              Everything is clean. No customer requests are pending.
            </p>
          )}
        </div>
      </div>

      {/* Recent Deals Table with Clean Visual Layout */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Active Deals
            </h2>
          </div>

          <button
            onClick={() => setCurrentView('deals')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Deals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="py-3 px-5">Deal Number</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">USD Amount</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Due Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDeals.map((deal) => (
                <tr
                  key={deal.id}
                  onClick={() => onSelectDeal(deal.id)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                    {deal.dealNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {deal.customerName}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 font-mono tabular-nums">
                    {formatUsd(deal.dollarAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 tabular-nums">
                    {formatRate(deal.exchangeRate)}
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
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Open &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lightbox for previewing proofs */}
      {selectedProofModal && (
        <ImageViewerModal
          isOpen={!!selectedProofModal}
          onClose={() => setSelectedProofModal(null)}
          imageUrl={selectedProofModal.url}
          title={selectedProofModal.title}
          subtitle={selectedProofModal.subtitle}
        />
      )}
    </div>
  );
};
