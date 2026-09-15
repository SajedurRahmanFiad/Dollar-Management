import React, { useState } from 'react';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Upload,
  Eye,
  Check,
  X,
  FileText,
  User,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { StatusBadge } from '../common/StatusBadge';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { UploadDollarProofModal } from '../modals/UploadDollarProofModal';
import { SubmitPaymentProofModal } from '../modals/SubmitPaymentProofModal';
import { formatBdt, formatOrdinalDate, formatRate, formatUsd } from '../../utils/calculations';
import { TimelineEvent } from '../../types';

interface DealWorkspaceViewProps {
  dealId: string;
  onBack: () => void;
}

export const DealWorkspaceView: React.FC<DealWorkspaceViewProps> = ({ dealId, onBack }) => {
  const {
    deals,
    customers,
    activeRole,
    setActiveRole,
    uploadDollarProof,
    confirmDollarReceipt,
    disputeDollarReceipt,
    submitPaymentProof,
    approvePaymentProof,
    declinePaymentProof,
    cancelDeal,
    setSelectedCustomerId,
    setCurrentView,
  } = useExchange();

  const deal = deals.find((d) => d.id === dealId);
  const [selectedProofImage, setSelectedProofImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const [isUploadDollarModalOpen, setIsUploadDollarModalOpen] = useState(false);
  const [isSubmitPaymentModalOpen, setIsSubmitPaymentModalOpen] = useState(false);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);
  const [declineTargetEvent, setDeclineTargetEvent] = useState<TimelineEvent | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  if (!deal) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500">Deal not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
        >
          Back to Deals
        </button>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === deal.customerId);
  const isOwner = activeRole === 'owner';
  const isCustomer = activeRole === 'customer';

  const hasDollarProof = Boolean(deal.dollarProofUrl);
  const isAwaitingConfirmation = deal.status === 'awaiting_confirmation';
  const isCompleted = deal.status === 'completed';
  const hasOutstandingBalance = deal.dueAmount > 0 || deal.expectedBdtAmount > deal.paidAmount;
  const canSubmitPayment =
    isCustomer &&
    hasOutstandingBalance &&
    deal.status !== 'completed' &&
    deal.status !== 'cancelled';

  const pendingPayments = deal.timeline.filter(
    (e) => e.type === 'payment_proof_submitted' && e.proofStatus === 'pending'
  );

  const paymentProgressPercent = Math.min(
    100,
    Math.round((deal.paidAmount / (deal.expectedBdtAmount || 1)) * 100)
  );

  const handleDisputeSubmit = () => {
    if (!disputeReasonInput.trim()) return;
    disputeDollarReceipt(deal.id, disputeReasonInput.trim());
    setIsDisputing(false);
    setDisputeReasonInput('');
  };

  const handleDeclinePayment = () => {
    if (!declineTargetEvent) return;
    declinePaymentProof(
      deal.id,
      declineTargetEvent.id,
      declineReason.trim() || 'Proof image unreadable or amount mismatch'
    );
    setDeclineTargetEvent(null);
    setDeclineReason('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Navigation */}
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-6 sm:flex sm:gap-3">
        <button
          onClick={onBack}
          aria-label="Back to deals"
          className="p-2 shrink-0 self-center bg-transparent hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-600 rounded-xl transition-all flex items-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="contents sm:flex sm:flex-1 sm:min-w-0 sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2.5 min-w-0 self-center">
            <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight whitespace-nowrap">
              {deal.dealNumber}
            </h1>
            <StatusBadge status={deal.status} size="md" />
          </div>
          <div className="col-span-2 row-start-2 text-left sm:col-auto sm:row-auto sm:text-right shrink-0">
            <div className="rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2.5 text-xs text-slate-600 shadow-xs sm:min-w-56">
              {isOwner && (
                <div className="flex items-center gap-2 leading-5">
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span>Client:</span>
                  <button
                    onClick={() => {
                      setSelectedCustomerId(deal.customerId);
                      setCurrentView('customers');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                  >
                    {deal.customerName}
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 leading-5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                <span><b>Created at:</b></span>
                <span className="tabular-nums">
                  {new Date(deal.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Financial Workspace Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Dollar Amount (USD)
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight tabular-nums">
            {formatUsd(deal.dollarAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Sold @ {formatRate(deal.exchangeRate)}/USD
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Expected Payment (BDT)
          </span>
          <div className="text-xl font-extrabold text-slate-900 mt-1 tabular-nums tracking-tight">
            {formatBdt(deal.expectedBdtAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Total settlement value
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Paid (BDT)
          </span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1 tabular-nums tracking-tight">
            {formatBdt(deal.paidAmount)}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-0.5 block font-medium">
            {paymentProgressPercent}% of total settled
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Remaining Due (BDT)
          </span>
          <div
            className={`text-xl font-extrabold mt-1 tabular-nums tracking-tight ${
              deal.dueAmount > 0 ? 'text-amber-600' : 'text-slate-400'
            }`}
          >
            {formatBdt(deal.dueAmount)}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {deal.dueAmount === 0 && isCompleted
              ? '✓ Fully Settled'
              : !deal.confirmedAt
              ? 'Activates upon USD confirmation'
              : 'Outstanding balance'}
          </span>
        </div>
      </div>

      {/* Dynamic Action Callout Banners Depending on Status & Role */}
      {/* 1. Owner: Deal needs USD Sent Proof */}
      {isOwner && (!hasDollarProof || deal.status === 'draft') && (
        <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Action Required: Upload Dollar Transfer Screenshot
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Send {formatUsd(deal.dollarAmount)} to {deal.customerName} and upload the transfer receipt to advance this deal.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUploadDollarModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Dollar Proof</span>
          </button>
        </div>
      )}

      {/* 2. Customer: Awaiting Dollar Receipt Confirmation */}
      {isCustomer && isAwaitingConfirmation && (
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-sky-900">
                Please Confirm Receipt of {formatUsd(deal.dollarAmount)}
              </h4>
              <p className="text-xs text-sky-800/90 mt-0.5">
                Fundify has sent transfer proof. Verify your wallet and confirm receipt.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDisputing(true)}
              className="px-3.5 py-2 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-colors"
            >
              Raise Dispute
            </button>
            <button
              onClick={() => confirmDollarReceipt(deal.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Fund Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Owner: Pending Payment Verification */}
      {isOwner && pendingPayments.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <h4 className="text-sm font-bold text-amber-950">
                Payment Verification Pending ({pendingPayments.length})
              </h4>
            </div>
          </div>

          {pendingPayments.map((p) => (
            <div
              key={p.id}
              className="p-3 bg-white border border-amber-200/70 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {p.proofImageUrl && (
                  <button
                    onClick={() =>
                      setSelectedProofImage({
                        url: p.proofImageUrl!,
                        title: `Payment Receipt: ${formatBdt(p.amountBdt || 0)}`,
                        subtitle: `${deal.customerName} submitted payment`,
                      })
                    }
                    className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative group"
                  >
                    <img
                      src={p.proofImageUrl}
                      alt="Payment Receipt"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </button>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Payment of <span className="text-emerald-600">{formatBdt(p.amountBdt || 0)}</span> submitted
                  </div>
                  <p className="text-xs text-slate-500">{p.description}</p>
                </div>
              </div>

              <div className="flex w-full items-center justify-end sm:w-auto">
                <button
                  onClick={() => approvePaymentProof(deal.id, p.id)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Customer: Submit Payment Proof whenever there is an outstanding balance */}
      {canSubmitPayment && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight tabular-nums">
              {formatBdt(deal.dueAmount)}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload your payment receipt screenshot whenever you make a payment.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitPaymentModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Submit Payment Proof</span>
          </button>
        </div>
      )}

      {/* Dispute Modal dialog */}
      {isDisputing && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <h4 className="text-sm font-bold text-rose-900">Raise Dispute on Dollar Transfer</h4>
          <p className="text-xs text-rose-800">
            Explain what went wrong (e.g. funds not received in wallet, incorrect wallet address, or wrong amount).
          </p>
          <textarea
            rows={2}
            value={disputeReasonInput}
            onChange={(e) => setDisputeReasonInput(e.target.value)}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 bg-white text-xs text-slate-900 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsDisputing(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleDisputeSubmit}
              disabled={!disputeReasonInput.trim()}
              className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700"
            >
              Submit Dispute
            </button>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineTargetEvent && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <h4 className="text-sm font-bold text-rose-900">
            Decline Payment of {formatBdt(declineTargetEvent.amountBdt || 0)}
          </h4>
          <input
            type="text"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (e.g. Unverified screenshot, bank reference not received)"
            className="w-full px-3 py-2 bg-white text-xs border border-rose-200 rounded-lg"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeclineTargetEvent(null)}
              className="px-3 py-1.5 text-xs text-slate-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleDeclinePayment}
              className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      )}

      {/* The Core Workspace: Chat-Style Verified Proof Stream & Timeline */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        {/* Workspace Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Transaction Journey</span>
            </h3>
          </div>

          {/* Quick Action Buttons in Timeline Header */}
          <div className="flex items-center gap-2">
            {canSubmitPayment && (
              <button
                onClick={() => setIsSubmitPaymentModalOpen(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Payment Proof</span>
              </button>
            )}
          </div>
        </div>

        {/* Timeline Message Feed (Chat-style layout tailored for verified proof cards) */}
        <div className="space-y-6 bg-slate-50/30 px-3 py-6 sm:px-4">
          {deal.timeline.map((event, index) => {
            if (event.type === 'receipt_confirmed' || event.type === 'payment_approved') {
              return null;
            }

            const isOwnerActor = event.actor === 'owner';
            const isCustomerActor = event.actor === 'customer';
            const isSystemActor = event.actor === 'system';
            const isViewerActor =
              (isOwner && isOwnerActor) || (isCustomer && isCustomerActor);
            const hasEventDescription = Boolean(event.description?.trim());
            const isNoteLessPaymentProof =
              event.type === 'payment_proof_submitted' && !hasEventDescription;

            return (
              <div
                key={event.id}
                className={`flex gap-2.5 ${
                  isViewerActor ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Actor Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold ${
                    isCustomerActor ? 'rounded-xl bg-slate-500 text-white' : ''
                  }`}
                >
                  {isOwnerActor ? (
                    <img
                      src="/uploads/Avatar.png"
                      alt="Ahmed Sourov"
                      className="h-8 w-8 object-cover"
                    />
                  ) : isCustomerActor ? '👤' : '✓'}
                </div>

                {/* Event Card Content */}
                <div
                  className={`max-w-xl w-full rounded-2xl ${
                    isNoteLessPaymentProof
                      ? ''
                      : 'border p-4 shadow-xs'
                  } ${
                    isOwnerActor
                      ? `${isNoteLessPaymentProof ? '' : 'bg-slate-50 border-slate-200/70'} text-slate-900 ${
                          isViewerActor ? 'rounded-tr-xs' : 'rounded-tl-xs'
                        }`
                      : isCustomerActor
                      ? `${isNoteLessPaymentProof ? '' : 'bg-blue-50/40 border-blue-200/70'} text-slate-900 ${
                          isViewerActor ? 'rounded-tr-xs' : 'rounded-tl-xs'
                        }`
                      : `${isNoteLessPaymentProof ? '' : 'bg-emerald-50/60 border-emerald-200'} text-emerald-950`
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {isOwnerActor ? 'Ahmed Sourov' : event.actorName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                  </div>

                  {/* Event Title & Description */}
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {event.title}
                  </h4>
                  {hasEventDescription && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {event.description}
                    </p>
                  )}

                  {/* Embedded Proof Screenshot Preview Card */}
                  {event.proofImageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-950/5 relative group">
                      <img
                        src={event.proofImageUrl}
                        alt="Proof Screenshot"
                        className="w-full max-h-60 object-contain bg-slate-900/10 cursor-pointer"
                        onClick={() =>
                          setSelectedProofImage({
                            url: event.proofImageUrl!,
                            title: event.title,
                            subtitle: `${event.actorName} • ${formatOrdinalDate(event.timestamp)}`,
                          })
                        }
                      />
                    </div>
                  )}

                  {((event.proofType === 'usd_sent' && Boolean(deal.confirmedAt)) ||
                    (event.proofType === 'bdt_paid' && event.proofStatus === 'approved')) && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Confirmed</span>
                    </div>
                  )}

                  {isOwner && isAwaitingConfirmation && event.proofType === 'usd_sent' && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>Awaiting Confirmation</span>
                    </div>
                  )}

                  {isCustomer && isAwaitingConfirmation && event.proofType === 'usd_sent' && (
                    <button
                      onClick={() => confirmDollarReceipt(deal.id)}
                      className="mt-3 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm Fund Receipt</span>
                    </button>
                  )}

                  {isOwner && event.type === 'payment_proof_submitted' && event.proofStatus === 'pending' && (
                    <button
                      onClick={() => approvePaymentProof(deal.id, event.id)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve Payment</span>
                    </button>
                  )}

                  {/* Status Indicator for Payment Proofs */}
                  {event.proofStatus && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Status:</span>
                      {event.proofStatus === 'approved' && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved &amp; Applied
                        </span>
                      )}
                      {event.proofStatus === 'pending' && (
                        <span className="text-amber-700 font-semibold flex items-center gap-1 animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Review
                        </span>
                      )}
                      {event.proofStatus === 'rejected' && (
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected: {event.rejectionReason || 'Declined'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <UploadDollarProofModal
        isOpen={isUploadDollarModalOpen}
        onClose={() => setIsUploadDollarModalOpen(false)}
        deal={deal}
        onUpload={(id, url, note) => uploadDollarProof(id, url, note)}
      />

      <SubmitPaymentProofModal
        isOpen={isSubmitPaymentModalOpen}
        onClose={() => setIsSubmitPaymentModalOpen(false)}
        deal={deal}
        onSubmit={(id, amount, url, note) => submitPaymentProof(id, amount, url, note)}
      />

      <ImageViewerModal
        isOpen={Boolean(selectedProofImage)}
        onClose={() => setSelectedProofImage(null)}
        imageUrl={selectedProofImage?.url || null}
        title={selectedProofImage?.title}
        subtitle={selectedProofImage?.subtitle}
      />
    </div>
  );
};
