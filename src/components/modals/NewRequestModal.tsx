import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles, DollarSign, Wallet, ArrowRight } from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { formatBdt, formatUsd } from '../../utils/calculations';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerName?: string;
  defaultPhone?: string;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerName = '',
  defaultPhone = '',
}) => {
  const { customers, createRequest, activeRole, activeCustomerId } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [customerName, setCustomerName] = useState(
    defaultCustomerName || (activeRole === 'customer' ? currentCustomer?.name : '')
  );
  const [customerPhone, setCustomerPhone] = useState(
    defaultPhone || (activeRole === 'customer' ? currentCustomer?.phone : '')
  );
  const [requestedUsdAmount, setRequestedUsdAmount] = useState<number>(1000);
  const [targetRate, setTargetRate] = useState<number | ''>(122.5);
  const [preferredChannel, setPreferredChannel] = useState('Wise');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (activeRole === 'customer' && currentCustomer) {
      setCustomerName(currentCustomer.name);
      setCustomerPhone(currentCustomer.phone);
    }
  }, [activeRole, currentCustomer, isOpen]);

  if (!isOpen) return null;

  const estimatedBdt =
    requestedUsdAmount * (typeof targetRate === 'number' ? targetRate : 122.5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedUsdAmount <= 0 || !customerName.trim() || !customerPhone.trim()) return;

    createRequest({
      customerId: activeRole === 'customer' ? currentCustomer?.id : undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      requestedUsdAmount,
      targetRate: typeof targetRate === 'number' ? targetRate : undefined,
      preferredChannel,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
              $
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Request Dollar Purchase
              </h3>
              <p className="text-xs text-slate-500">
                Submit an inquiry to purchase USD from the exchange
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Inquirer Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                placeholder="017xxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Amount presets */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Requested Amount (USD)
            </label>
            <div className="relative mb-2">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                $
              </span>
              <input
                type="number"
                min="10"
                step="50"
                required
                value={requestedUsdAmount}
                onChange={(e) => setRequestedUsdAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-base font-black font-mono text-slate-900 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[500, 1000, 2500, 5000].map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setRequestedUsdAmount(amt)}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    requestedUsdAmount === amt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Target Rate & Estimated BDT calculation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Target Rate (BDT/USD)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="122.50"
                value={targetRate}
                onChange={(e) =>
                  setTargetRate(e.target.value ? parseFloat(e.target.value) : '')
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Transfer Channel
              </label>
              <select
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="Wise">Wise Transfer</option>
                <option value="Bank">Direct Bank Wire</option>
                <option value="Payoneer">Payoneer</option>
                <option value="Cash">Cash Handover</option>
              </select>
            </div>
          </div>

          {/* Live Estimate Card */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950">
              Estimated Total Payable:
            </span>
            <span className="text-sm font-black text-blue-950 tabular-nums">
              {formatBdt(estimatedBdt)}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Special Instructions / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Need it by tomorrow noon, sending to Wise account"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Inquiry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
