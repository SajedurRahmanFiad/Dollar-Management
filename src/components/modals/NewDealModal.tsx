import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowRight, UserPlus, Sparkles, Check } from 'lucide-react';
import { useExchange } from '../../context/ExchangeContext';
import { formatBdt } from '../../utils/calculations';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
  initialUsdAmount?: number;
  initialRate?: number;
  initialRequestId?: string;
}

export const NewDealModal: React.FC<NewDealModalProps> = ({
  isOpen,
  onClose,
  initialCustomerId,
  initialUsdAmount,
  initialRate,
  initialRequestId,
}) => {
  const { customers, requests, createDeal, createCustomer, setSelectedDealId } = useExchange();

  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [dollarAmount, setDollarAmount] = useState<number | ''>(initialUsdAmount || 1000);
  const [exchangeRate, setExchangeRate] = useState<number | ''>(initialRate || 123.00);
  const [linkedRequestId, setLinkedRequestId] = useState(initialRequestId || '');
  const [notes, setNotes] = useState('');

  // Default select first customer if none selected
  useEffect(() => {
    if (isOpen) {
      if (initialCustomerId) {
        setCustomerId(initialCustomerId);
      } else if (customers.length > 0 && !customerId) {
        setCustomerId(customers[0].id);
      }
      if (initialUsdAmount) setDollarAmount(initialUsdAmount);
      if (initialRate) setExchangeRate(initialRate);
      if (initialRequestId) setLinkedRequestId(initialRequestId);
    }
  }, [isOpen, initialCustomerId, initialUsdAmount, initialRate, initialRequestId, customers]);

  if (!isOpen) return null;

  const numUsd = typeof dollarAmount === 'number' ? dollarAmount : 0;
  const numRate = typeof exchangeRate === 'number' ? exchangeRate : 0;
  const calculatedBdt = Math.round(numUsd * numRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numUsd <= 0 || numRate <= 0) return;

    let targetCustomerId = customerId;

    if (isCreatingNewCustomer) {
      if (!newCustomerName.trim() || !newCustomerPhone.trim()) return;
      const created = await createCustomer({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
      });
      targetCustomerId = created.id;
    }

    if (!targetCustomerId) return;

    const deal = await createDeal({
      customerId: targetCustomerId,
      dollarAmount: numUsd,
      exchangeRate: numRate,
      notes: notes.trim() || undefined,
      linkedRequestId: linkedRequestId || undefined,
    });

    onClose();
    // Open deal workspace immediately for seamless experience
    setSelectedDealId(deal.id);
  };

  const commonRates = [122.00, 122.50, 123.00, 123.50];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] sm:max-h-[85vh] flex flex-col my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Create New Deal</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Record a new dollar sale agreement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Client <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewCustomer(!isCreatingNewCustomer)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {isCreatingNewCustomer ? 'Select Existing Client' : '+ New Client'}
              </button>
            </div>

            {isCreatingNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahfuz Rahman"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="017xxxxxxxx"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-xs font-bold font-mono text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-xs sm:text-sm font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.phone} {c.preferredChannel ? `(${c.preferredChannel})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount & Rate Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Dollar Amount (USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="1,000"
                  value={dollarAmount}
                  onChange={(e) => setDollarAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white text-sm font-black text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Exchange Rate (BDT/USD) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">৳</span>
                <input
                  type="number"
                  min="1"
                  step="0.05"
                  required
                  placeholder="123.00"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white text-sm font-black text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
                />
              </div>
              {/* Quick rate presets */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">Presets:</span>
                {commonRates.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setExchangeRate(r)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                      exchangeRate === r
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ৳{r.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto Calculation Preview Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-sm">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Expected Payment in BDT
              </div>
              <div className="text-xl font-black text-emerald-400 tracking-tight tabular-nums mt-0.5">
                {formatBdt(calculatedBdt)}
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-0.5">
              <div>
                <span className="text-slate-300 font-medium">${numUsd.toLocaleString()}</span> × ৳{numRate.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-300/80">
                Auto-calculated settlement amount
              </div>
            </div>
          </div>

          {/* Optional Request Link */}
          {requests.filter((r) => r.status === 'pending').length > 0 && !linkedRequestId && (
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Link to Inquiry / Request (Optional)
              </label>
              <select
                value={linkedRequestId}
                onChange={(e) => setLinkedRequestId(e.target.value)}
                className="w-full px-3 py-2 bg-white text-xs text-slate-700 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- No linked request (Independent Deal) --</option>
                {requests
                  .filter((r) => r.status === 'pending')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestNumber}: {r.customerName} (${r.requestedUsdAmount.toLocaleString()})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Internal Note / Context (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. WhatsApp agreed, client will pay within 3 days via City Bank"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numUsd <= 0 || numRate <= 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Create Deal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
