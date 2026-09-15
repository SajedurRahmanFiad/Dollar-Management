import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Deal } from '../../types';
import { generateReceiptDataUrl } from '../../utils/receiptGenerator';
import { formatBdt } from '../../utils/calculations';
import { uploadService } from '../../services/uploadService';

interface SubmitPaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  onSubmit: (dealId: string, amountBdt: number, proofUrl: string, note?: string) => void;
}

export const SubmitPaymentProofModal: React.FC<SubmitPaymentProofModalProps> = ({
  isOpen,
  onClose,
  deal,
  onSubmit,
}) => {
  const currentRemaining = deal.dueAmount || deal.expectedBdtAmount - deal.paidAmount;
  const [amountBdt, setAmountBdt] = useState<number | ''>(currentRemaining);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [note, setNote] = useState('');
  const [paymentChannel, setPaymentChannel] = useState('bKash');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const numAmount = typeof amountBdt === 'number' ? amountBdt : 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const generateQuickReceipt = async (channel: string) => {
    setPaymentChannel(channel);
    const generated = generateReceiptDataUrl('bdt_paid', {
      amount: numAmount || currentRemaining,
      sender: deal.customerName,
      recipient: 'FastFx Settlement Account',
      channel: `${channel} Transfer`,
      ref: `${channel.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    // Convert SVG data URL to a File for upload
    const blob = await fetch(generated).then(r => r.blob());
    const file = new File([blob], `receipt_${channel.toLowerCase()}.svg`, { type: 'image/svg+xml' });
    setSelectedFile(file);
    setPreviewUrl(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    setIsUploading(true);

    try {
      let proofUrl: string;

      if (selectedFile) {
        const result = await uploadService.uploadProof(selectedFile, deal.id);
        proofUrl = result.url;
      } else {
        // Generate fallback receipt and upload it
        const generated = generateReceiptDataUrl('bdt_paid', {
          amount: numAmount,
          sender: deal.customerName,
          recipient: 'FastFx Settlement Desk',
          channel: `${paymentChannel} Transfer`,
        });
        const blob = await fetch(generated).then(r => r.blob());
        const file = new File([blob], 'receipt_fallback.svg', { type: 'image/svg+xml' });
        const result = await uploadService.uploadProof(file, deal.id);
        proofUrl = result.url;
      }

      onSubmit(deal.id, numAmount, proofUrl, note.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[90vh] sm:max-h-[85vh] flex flex-col my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              Submit Payment Proof ({deal.dealNumber})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Outstanding Balance Context */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Outstanding Balance Due</span>
              <span className="text-xl font-bold text-amber-400 tabular-nums">
                {formatBdt(currentRemaining)}
              </span>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>Total Expected: {formatBdt(deal.expectedBdtAmount)}</span>
              <div className="text-emerald-400 font-medium">
                Already Paid: {formatBdt(deal.paidAmount)}
              </div>
            </div>
          </div>

          {/* Amount Being Paid */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Payment Amount (BDT) <span className="text-rose-500">*</span>
              </label>
              {currentRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountBdt(currentRemaining)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Pay Full Balance ({formatBdt(currentRemaining)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                ৳
              </span>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder="50,000"
                value={amountBdt}
                onChange={(e) =>
                  setAmountBdt(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full pl-8 pr-3.5 py-2.5 bg-white text-base font-bold text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tabular-nums"
              />
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Payment Screenshot / Receipt <span className="text-rose-500">*</span>
            </label>

            {previewUrl ? (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5 group">
                <img
                  src={previewUrl}
                  alt="Proof Preview"
                  className="w-full h-44 object-contain bg-slate-950/40"
                />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white text-slate-900 text-xs font-semibold rounded-lg shadow-md cursor-pointer hover:bg-slate-100">
                    Change Receipt
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-slate-400 transition-colors bg-slate-50/40">
                <ImageIcon className="w-7 h-7 mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-700">
                  Upload screenshot of your bKash, Nagad or Bank transfer slip
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer hover:bg-slate-50 inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Screenshot</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
              Payment Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via bKash personal account"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-white text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-xl text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold">Verification Step:</span> Once submitted, Fundify will review your payment screenshot. Upon approval, ৳{numAmount ? numAmount.toLocaleString() : '0'} will be instantly deducted from your due balance.
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={numAmount <= 0 || isUploading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>Submit Payment Proof</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
