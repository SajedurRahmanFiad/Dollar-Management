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
import { formatBdt, formatRate, formatUsd } from '../../utils/calculations';
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
  const isActiveDue = deal.status === 'active_due' || deal.status === 'partially_paid';
  const isCompleted = deal.status === 'completed';

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {deal.dealNumber}
              </h1>
              <StatusBadge status={deal.status} size="md" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Customer:</span>
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
              <span>•</span>
              <span className="tabular-nums">
                {new Date(deal.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
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
                Ahmed Sourov has sent transfer proof. Verify your wallet and confirm receipt to activate your {formatBdt(deal.expectedBdtAmount)} due balance.
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
              <span>Confirm Dollar Receipt</span>
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
            <span className="text-xs text-amber-800 font-medium">
              Review customer uploaded transfer slip
            </span>
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

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setDeclineTargetEvent(p)}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => approvePaymentProof(deal.id, p.id)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve &amp; Deduct Due</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Customer: Active Due -> Quick Make Payment Button */}
      {isCustomer && isActiveDue && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Outstanding Balance
            </span>
            <div className="text-2xl font-extrabold text-amber-400 tracking-tight tabular-nums">
              {formatBdt(deal.dueAmount)}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload your payment receipt screenshot to settle this balance.
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
              <span>Transaction Journey &amp; Verified Proof Stream</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological business events and uploaded transaction screenshots
            </p>
          </div>

          {/* Quick Action Buttons in Timeline Header */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <button
                onClick={() => setIsUploadDollarModalOpen(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Proof</span>
              </button>
            )}
            {isCustomer && isActiveDue && (
              <button
                onClick={() => setIsSubmitPaymentModalOpen(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Submit Payment</span>
              </button>
            )}
          </div>
        </div>

        {/* Timeline Message Feed (Chat-style layout tailored for verified proof cards) */}
        <div className="p-6 space-y-6 bg-slate-50/30">
          {deal.timeline.map((event, index) => {
            const isOwnerActor = event.actor === 'owner';
            const isCustomerActor = event.actor === 'customer';
            const isSystemActor = event.actor === 'system';

            return (
              <div
                key={event.id}
                className={`flex gap-3.5 ${
                  isCustomerActor ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Actor Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                    isOwnerActor
                      ? 'bg-slate-900 text-white'
                      : isCustomerActor
                      ? 'bg-blue-600 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isOwnerActor ? '👑' : isCustomerActor ? '👤' : '✓'}
                </div>

                {/* Event Card Content */}
                <div
                  className={`max-w-xl w-full rounded-2xl p-4 shadow-xs border ${
                    isOwnerActor
                      ? 'bg-white border-slate-200/70 text-slate-900 rounded-tl-xs'
                      : isCustomerActor
                      ? 'bg-blue-50/40 border-blue-200/70 text-slate-900 rounded-tr-xs'
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {event.actorName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Event Tag */}
                    {event.proofType && (
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          event.proofType === 'usd_sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {event.proofType === 'usd_sent' ? '$ USD Sent Proof' : '৳ Payment Slip'}
                      </span>
                    )}
                  </div>

                  {/* Event Title & Description */}
                  <h4 className="text-sm font-semibold text-slate-900 mb-1">
                    {event.title}
                  </h4>
                  {event.description && (
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
                            subtitle: `${event.actorName} • ${new Date(
                              event.timestamp
                            ).toLocaleString()}`,
                          })
                        }
                      />
                      <div className="p-2.5 bg-white/95 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          Click screenshot to zoom
                        </span>
                        <button
                          onClick={() =>
                            setSelectedProofImage({
                              url: event.proofImageUrl!,
                              title: event.title,
                              subtitle: `${event.actorName} • ${new Date(
                                event.timestamp
                              ).toLocaleString()}`,
                            })
                          }
                          className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Full View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
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
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Owner Review
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

        {/* Workspace Bottom Action Presets Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>
              {isOwner
                ? 'Owner Controls: Upload USD proofs, review payments, manage customer balance.'
                : 'Customer Controls: Confirm receipt, submit payment slips.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <button
                  onClick={() => setIsUploadDollarModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Dollar Sent Proof</span>
                </button>
              </>
            )}

            {isCustomer && (
              <>
                {isAwaitingConfirmation && (
                  <button
                    onClick={() => confirmDollarReceipt(deal.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Receipt</span>
                  </button>
                )}
                {isActiveDue && (
                  <button
                    onClick={() => setIsSubmitPaymentModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Submit Payment Proof</span>
                  </button>
                )}
              </>
            )}
          </div>
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
