import React from 'react';
import { DealStatus, RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: DealStatus | RequestStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  let label = status;
  let colorClasses = 'bg-slate-500/10 text-slate-700 border-slate-200/60';
  let dotColor = 'bg-slate-500';

  switch (status) {
    case 'draft':
      label = 'Draft Deal';
      colorClasses = 'bg-slate-500/10 text-slate-700 border-slate-300/40';
      dotColor = 'bg-slate-400';
      break;

    case 'dollar_sent_pending':
      label = 'Proof Not Sent';
      colorClasses = 'bg-amber-500/10 text-amber-700 border-amber-300/40';
      dotColor = 'bg-amber-500';
      break;

    case 'awaiting_confirmation':
      label = 'Awaiting Client Confirmation';
      colorClasses = 'bg-sky-500/10 text-sky-700 border-sky-300/40';
      dotColor = 'bg-sky-500 animate-pulse';
      break;

    case 'fundify_verification_pending':
      label = 'Fundify Verification Pending';
      colorClasses = 'bg-violet-500/10 text-violet-700 border-violet-300/40';
      dotColor = 'bg-violet-600 animate-pulse';
      break;

    case 'active_due':
      label = 'Active Due (Unpaid)';
      colorClasses = 'bg-amber-500/10 text-amber-800 border-amber-300/50';
      dotColor = 'bg-amber-600';
      break;

    case 'partially_paid':
      label = 'Partially Paid';
      colorClasses = 'bg-blue-500/10 text-blue-700 border-blue-300/40';
      dotColor = 'bg-blue-600';
      break;

    case 'completed':
      label = 'Settled & Completed';
      colorClasses = 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40';
      dotColor = 'bg-emerald-600';
      break;

    case 'disputed':
      label = 'Disputed';
      colorClasses = 'bg-rose-500/10 text-rose-700 border-rose-300/40';
      dotColor = 'bg-rose-600';
      break;

    case 'cancelled':
      label = 'Cancelled';
      colorClasses = 'bg-slate-400/10 text-slate-600 border-slate-300/40';
      dotColor = 'bg-slate-400';
      break;

    // Requests
    case 'pending':
      label = 'Inquiry Pending';
      colorClasses = 'bg-purple-500/10 text-purple-700 border-purple-300/40';
      dotColor = 'bg-purple-600 animate-pulse';
      break;

    case 'converted':
      label = 'Converted to Deal';
      colorClasses = 'bg-emerald-500/10 text-emerald-700 border-emerald-300/40';
      dotColor = 'bg-emerald-600';
      break;

    case 'rejected':
      label = 'Declined';
      colorClasses = 'bg-rose-500/10 text-rose-700 border-rose-300/40';
      dotColor = 'bg-rose-600';
      break;

    case 'archived':
      label = 'Archived';
      colorClasses = 'bg-slate-400/10 text-slate-600 border-slate-300/40';
      dotColor = 'bg-slate-400';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium gap-1',
    md: 'text-xs px-2.5 py-1 font-semibold gap-1.5',
    lg: 'text-sm px-3 py-1.5 font-semibold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap transition-all ${colorClasses} ${sizeClasses}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}
      <span>{label}</span>
    </span>
  );
};
