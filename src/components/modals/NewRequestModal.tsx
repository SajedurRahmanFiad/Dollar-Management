import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customers, createRequest, activeCustomerId } = useExchange();

  const currentCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  const [requestedUsdAmount, setRequestedUsdAmount] = useState<number>(1000);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedUsdAmount <= 0) return;

    createRequest({
      customerId: currentCustomer?.id,
      customerName: currentCustomer?.name || 'Client',
      customerPhone: currentCustomer?.phone || '',
      requestedUsdAmount,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] sm:max-h-[85vh] flex flex-col my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Request Fund
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">

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
                min="0.01"
                step="any"
                required
                value={requestedUsdAmount}
                onChange={(e) => setRequestedUsdAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-base font-black font-mono text-slate-900 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 300, 500].map((amt) => (
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

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Special Instructions / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Need funds urgently by tomorrow morning..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
