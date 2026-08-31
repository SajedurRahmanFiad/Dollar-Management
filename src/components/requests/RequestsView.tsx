import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  ArrowRight,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { formatBdt, formatRate, formatUsd } from '../../utils/calculations';
import { DollarRequest } from '../../types';

interface RequestsViewProps {
  onSelectDeal: (dealId: string) => void;
  onOpenNewRequestModal?: () => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  onSelectDeal,
  onOpenNewRequestModal,
}) => {
  const {
    requests,
    customers,
    activeRole,
    activeCustomerId,
    convertRequestToDeal,
    rejectRequest,
    searchQuery,
    setSearchQuery,
  } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Customer sees their own inquiries, Owner sees all inquiries
  const scopedRequests = useMemo(() => {
    if (activeRole === 'customer') {
      return requests.filter(
        (r) =>
          r.customerId === currentCustomer?.id ||
          r.customerPhone === currentCustomer?.phone
      );
    }
    return requests;
  }, [requests, activeRole, currentCustomer]);

  const filteredRequests = useMemo(() => {
    return scopedRequests.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          r.customerName.toLowerCase().includes(q) ||
          r.customerPhone.toLowerCase().includes(q) ||
          r.requestNumber.toLowerCase().includes(q) ||
          r.requestedUsdAmount.toString().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [scopedRequests, searchQuery, statusFilter]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {activeRole === 'customer' ? 'My Dollar Inquiries' : 'Customer Inquiries & Intent'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeRole === 'customer'
              ? 'Requests you placed for foreign currency exchange'
              : 'Incoming dollar purchase requests placed by customers'}
          </p>
        </div>

        {/* Only customer can create new dollar inquiry */}
        {activeRole === 'customer' && onOpenNewRequestModal && (
          <button
            onClick={onOpenNewRequestModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Dollars</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All Inquiries' },
            { id: 'pending', label: 'Under Review' },
            { id: 'converted', label: 'Converted to Deal' },
            { id: 'rejected', label: 'Declined' },
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

        <div className="text-xs text-slate-500 font-semibold">
          Showing {filteredRequests.length} inquiry/inquiries
        </div>
      </div>

      {/* Inquiries Stream */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No inquiries found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeRole === 'customer'
                ? 'You have not submitted any dollar inquiries yet.'
                : 'No customer inquiries in this filter category.'}
            </p>
            {activeRole === 'customer' && onOpenNewRequestModal && (
              <button
                onClick={onOpenNewRequestModal}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Request Dollars Now
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-black text-slate-900">
                      {req.requestNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'converted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'rejected' || req.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {req.status === 'converted'
                        ? 'Converted to Deal'
                        : req.status === 'rejected'
                        ? 'Declined'
                        : 'Under Review'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1 text-xs">
                    {activeRole === 'owner' && (
                      <span className="font-bold text-slate-900">
                        {req.customerName} ({req.customerPhone})
                      </span>
                    )}
                    <span className="font-black text-blue-900 font-mono">
                      {formatUsd(req.requestedUsdAmount)} USD
                    </span>
                    {req.targetRate && (
                      <span className="text-slate-500 font-mono">
                        Target: ৳{req.targetRate}
                      </span>
                    )}
                    {req.preferredChannel && (
                      <span className="text-slate-400 text-[11px]">
                        via {req.preferredChannel}
                      </span>
                    )}
                  </div>

                  {req.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      &ldquo;{req.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeRole === 'owner' && req.status !== 'converted' && (
                    <>
                      <button
                        onClick={() => {
                          const rateInput = prompt(
                            `Lock in exchange rate for ${req.customerName} ($${req.requestedUsdAmount}):`,
                            req.targetRate ? req.targetRate.toString() : '122.50'
                          );
                          if (rateInput && !isNaN(parseFloat(rateInput))) {
                            const newDeal = convertRequestToDeal(
                              req.id,
                              parseFloat(rateInput)
                            );
                            if (newDeal) onSelectDeal(newDeal.id);
                          }
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <span>Convert to Deal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {req.status !== 'rejected' && (
                        <button
                          onClick={() => rejectRequest(req.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          title="Decline Inquiry"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}

                  {req.convertedDealId && (
                    <button
                      onClick={() => onSelectDeal(req.convertedDealId!)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>View Deal</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
