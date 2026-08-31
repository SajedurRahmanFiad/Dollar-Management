import React, { useState } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, CheckCircle, ArrowRight } from 'lucide-react';
import { Deal } from '../../types';
import { generateReceiptDataUrl } from '../../utils/receiptGenerator';
import { formatUsd } from '../../utils/calculations';

interface UploadDollarProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  onUpload: (dealId: string, proofUrl: string, note?: string) => void;
}

export const UploadDollarProofModal: React.FC<UploadDollarProofModalProps> = ({
  isOpen,
  onClose,
  deal,
  onUpload,
}) => {
  const [proofUrl, setProofUrl] = useState<string>('');
  const [note, setNote] = useState('');
  const [previewChannel, setPreviewChannel] = useState('Binance Pay');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProofUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generateQuickProof = (channel: string) => {
    setPreviewChannel(channel);
    const generated = generateReceiptDataUrl('usd_sent', {
      amount: deal.dollarAmount,
      recipient: `${deal.customerName} (${channel})`,
      sender: 'FastFx Trading Desk',
      channel: `${channel} USD Transfer`,
      ref: `USD-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setProofUrl(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProof = proofUrl || generateReceiptDataUrl('usd_sent', {
      amount: deal.dollarAmount,
      recipient: deal.customerName,
      sender: 'FastFx Trading Desk',
      channel: `${previewChannel} USD`,
    });

    onUpload(deal.id, finalProof, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Business Owner Action
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Upload Dollar Transfer Proof ({deal.dealNumber})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Deal Summary Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Recipient</span>
              <span className="font-semibold text-slate-900">{deal.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Amount to Dispatch</span>
              <span className="font-bold text-base text-emerald-600 font-mono">
                {formatUsd(deal.dollarAmount)}
              </span>
            </div>
          </div>

          {/* Screenshot Upload Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Transfer Screenshot / Proof <span className="text-rose-500">*</span>
            </label>

            {proofUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5 group">
                <img
                  src={proofUrl}
                  alt="Proof Preview"
                  className="w-full h-48 object-contain bg-slate-950/40"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white text-slate-900 text-xs font-semibold rounded-lg shadow-md cursor-pointer hover:bg-slate-100">
                    Change Screenshot
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setProofUrl('')}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-slate-400 transition-colors bg-slate-50/40">
                <ImageIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Upload screenshot showing transfer of {formatUsd(deal.dollarAmount)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 mb-3">
                  PNG, JPG or WebP image
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer hover:bg-slate-50 inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  
                  <span className="text-xs text-slate-400">or use template:</span>
                  
                  <button
                    type="button"
                    onClick={() => generateQuickProof('Binance Pay')}
                    className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    ⚡ Binance Pay Proof
                  </button>
                  <button
                    type="button"
                    onClick={() => generateQuickProof('Wise USD')}
                    className="px-2.5 py-1.5 bg-sky-50 text-sky-800 border border-sky-200 text-xs font-medium rounded-lg hover:bg-sky-100 transition-colors"
                  >
                    ⚡ Wise USD Proof
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Transfer Note / Memo (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Sent via Payoneer internal transfer. TX ID attached."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Next Lifecycle Step:</span> Uploading this proof will move the deal into{' '}
            <span className="font-bold">Awaiting Customer Confirmation</span>. The customer will review this screenshot before the due balance activates.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>Send Dollar Proof</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
