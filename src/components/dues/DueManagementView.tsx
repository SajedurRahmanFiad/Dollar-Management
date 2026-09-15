import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Phone,
  Send,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Upload,
  Eye,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import {
  calculateCustomerSummary,
  formatBdt,
  formatRate,
  formatUsd,
} from '../../utils/calculations';
import { StatusBadge } from '../common/StatusBadge';
import { SubmitPaymentProofModal } from '../modals/SubmitPaymentProofModal';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { ClientBadge } from '../common/ClientBadge';
import { Pagination } from '../common/Pagination';
import { useUrlPagination } from '../../hooks/useUrlPagination';

interface DueManagementViewProps {
  onSelectDeal: (dealId: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

export const DueManagementView: React.FC<DueManagementViewProps> = ({
  onSelectDeal,
  onSelectCustomer,
}) => {
  const {
    customers,
    deals,
    activeRole,
    activeCustomerId,
    searchQuery,
    submitPaymentProof,
  } = useExchange();

  const [activePaymentDeal, setActivePaymentDeal] = useState<
    typeof deals[0] | null
  >(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedProofImg, setSelectedProofImg] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  // If in Customer Mode: Show strictly this customer's dues & payments
  if (activeRole === 'customer') {
    const myDeals = deals.filter((d) => d.customerId === currentCustomer?.id);
    const myDueDeals = myDeals.filter(
      (d) =>
        d.status !== 'completed' &&
        d.status !== 'cancelled' &&
        d.dueAmount > 0 &&
        (!searchQuery.trim() ||
          [d.dealNumber, d.customerName, d.customerPhone]
            .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase())))
    );
    const myTotalDue = myDueDeals.reduce((sum, d) => sum + d.dueAmount, 0);

    // List of payment events submitted by this customer
    const myPaymentSlips: Array<{
      deal: typeof deals[0];
      event: typeof deals[0]['timeline'][0];
    }> = [];
    myDeals.forEach((d) => {
      d.timeline.forEach((e) => {
        if (
          e.type === 'payment_proof_submitted' ||
          e.type === 'payment_approved'
        ) {
          myPaymentSlips.push({ deal: d, event: e });
        }
      });
    });

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in duration-150">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            My Dues &amp; Payment Ledger
          </h1>
        </div>

        {/* Due Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Outstanding Balance
            </span>
            <div
              className={`text-3xl font-black tabular-nums mt-1 ${
                myTotalDue > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {formatBdt(myTotalDue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {myTotalDue > 0
                ? `${myDueDeals.length} active deal(s) awaiting payment`
                : 'All your accounts and deals are settled.'}
            </p>
          </div>

          {myDueDeals.length > 0 && (
            <button
              onClick={() => {
                setActivePaymentDeal(myDueDeals[0]);
                setIsSubmitModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Payment Slip</span>
            </button>
          )}
        </div>

        {/* Unpaid Deals List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
          <h3 className="text-sm font-black text-slate-900 mb-3">
            Active Due Orders ({myDueDeals.length})
          </h3>

          {myDueDeals.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No outstanding dues pending on your account.
            </div>
          ) : (
            <div className="space-y-3">
              {myDueDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 bg-slate-50/70 border border-slate-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        {deal.dealNumber}
                      </span>
                      <StatusBadge status={deal.status} />
                    </div>
                    <div className="text-xs font-extrabold text-slate-800 mt-1">
                      {formatUsd(deal.dollarAmount)} USD @ {formatRate(deal.exchangeRate)}
                    </div>
                    <div className="text-xs text-amber-700 font-black mt-0.5">
                      Due: {formatBdt(deal.dueAmount)} (Paid:{' '}
                      {formatBdt(deal.paidAmount)})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActivePaymentDeal(deal);
                        setIsSubmitModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Submit Slip</span>
                    </button>
                    <button
                      onClick={() => onSelectDeal(deal.id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Slips History */}
        {myPaymentSlips.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
            <h3 className="text-sm font-black text-slate-900 mb-3">
              Submitted Payment Slips &amp; Receipts
            </h3>
            <div className="divide-y divide-slate-100">
              {myPaymentSlips.map(({ deal, event }) => (
                <div
                  key={event.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {deal.dealNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          event.proofStatus === 'approved' ||
                          event.type === 'payment_approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {event.proofStatus === 'approved' ||
                        event.type === 'payment_approved'
                          ? 'Approved'
                          : 'Pending Review'}
                      </span>
                    </div>
                    <div className="font-bold text-emerald-800 mt-0.5">
                      {formatBdt(event.amountBdt || 0)}
                    </div>
                  </div>

                  {event.proofImageUrl && (
                    <button
                      onClick={() =>
                        setSelectedProofImg({
                          url: event.proofImageUrl!,
                          title: `Payment Slip - ${deal.dealNumber}`,
                          subtitle: `${formatBdt(event.amountBdt || 0)}`,
                        })
                      }
                      className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg flex items-center gap-1 font-bold text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Slip</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activePaymentDeal && (
          <SubmitPaymentProofModal
            deal={activePaymentDeal}
            isOpen={isSubmitModalOpen}
            onClose={() => {
              setIsSubmitModalOpen(false);
              setActivePaymentDeal(null);
            }}
            onSubmit={(id, amount, url, note) => submitPaymentProof(id, amount, url, note)}
          />
        )}

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
  }

  // Owner Mode: Receivables ledger
  const debtors = useMemo(() => {
    return customers
      .map((c) => {
        const summary = calculateCustomerSummary(c, deals);
        const unpaidDeals = deals.filter(
          (d) =>
            d.customerId === c.id &&
            (d.status === 'active_due' || d.status === 'partially_paid') &&
            d.dueAmount > 0 &&
            (!searchQuery.trim() ||
              [c.name, c.phone, c.companyName || '', d.dealNumber]
                .some((value) => value.toLowerCase().includes(searchQuery.toLowerCase())))
        );
        return {
          customer: c,
          summary,
          unpaidDeals,
        };
      })
        .filter(
          (item) =>
            item.summary.currentDue > 0 &&
            (!searchQuery.trim() || item.unpaidDeals.length > 0)
        )
        .sort((a, b) => b.summary.currentDue - a.summary.currentDue);
  }, [customers, deals, searchQuery]);

  const totalOutstanding = debtors.reduce(
    (sum, d) => sum + d.summary.currentDue,
    0
  );
  const { currentPage, totalPages, pageStart, pageEnd, goToPage } =
    useUrlPagination(debtors.length);
  const paginatedDebtors = debtors.slice(pageStart, pageEnd);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Due Ledger
          </h1>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Total Receivables
            </span>
            <span className="text-base font-black text-amber-950 tabular-nums">
              {formatBdt(totalOutstanding)}
            </span>
          </div>
        </div>
      </div>

      {/* Debtors List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <h2 className="text-sm font-black text-slate-900">
            Clients with Unpaid Balances ({debtors.length})
          </h2>
        </div>

        {debtors.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            All client accounts are settled. No outstanding dues.
          </div>
        ) : (
          <div className="space-y-3 bg-slate-50 md:space-y-0 md:bg-white md:divide-y md:divide-slate-100">
            {paginatedDebtors.map((debtor) => (
              <div
                key={debtor.customer.id}
                className="p-4 bg-white border border-slate-100 rounded-xl shadow-xs hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:p-5 md:border-0 md:rounded-none md:shadow-none"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <button
                      onClick={() => onSelectCustomer(debtor.customer.id)}
                      className="font-black text-xs text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {debtor.customer.name}
                    </button>
                    <ClientBadge tier={debtor.summary.lifetimeValue > 300000 ? 'VIP Client' : 'Private Client'} size="sm" variant="gold" />
                  </div>

                  <div className="flex flex-col items-start gap-1 text-xs">
                    <span className="font-black text-amber-700">
                      Due: {formatBdt(debtor.summary.currentDue)}
                    </span>
                    <span className="text-slate-500">
                      {debtor.unpaidDeals.length} active deal(s):{' '}
                      {debtor.unpaidDeals.map((d) => d.dealNumber).join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectCustomer(debtor.customer.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Profile &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={debtors.length}
          onPageChange={goToPage}
        />
      </div>
    </div>
  );
};
