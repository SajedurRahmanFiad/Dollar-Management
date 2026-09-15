import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Image as ImageIcon, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Deal } from '../../types';
import { generateReceiptDataUrl } from '../../utils/receiptGenerator';
import { formatUsd } from '../../utils/calculations';
import { uploadService } from '../../services/uploadService';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [note, setNote] = useState('');
  const [previewChannel, setPreviewChannel] = useState('Binance Pay');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const generateQuickProof = async (channel: string) => {
    setPreviewChannel(channel);
    const generated = generateReceiptDataUrl('usd_sent', {
      amount: deal.dollarAmount,
      recipient: `${deal.customerName} (${channel})`,
      sender: 'FastFx Trading Desk',
      channel: `${channel} USD Transfer`,
      ref: `USD-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    // Convert SVG data URL to a File for upload
    const blob = await fetch(generated).then(r => r.blob());
    const file = new File([blob], `receipt_${channel.toLowerCase().replace(/\s+/g, '_')}.svg`, { type: 'image/svg+xml' });
    setSelectedFile(file);
    setPreviewUrl(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let proofUrl: string;

      if (selectedFile) {
        // Upload file to server, get back webp URL
        const result = await uploadService.uploadProof(selectedFile, deal.id);
        proofUrl = result.url;
      } else {
        // Generate fallback receipt and upload it
        const generated = generateReceiptDataUrl('usd_sent', {
          amount: deal.dollarAmount,
          recipient: deal.customerName,
          sender: 'FastFx Trading Desk',
          channel: `${previewChannel} USD`,
        });
        const blob = await fetch(generated).then(r => r.blob());
        const file = new File([blob], 'receipt_fallback.svg', { type: 'image/svg+xml' });
        const result = await uploadService.uploadProof(file, deal.id);
        proofUrl = result.url;
      }

      onUpload(deal.id, proofUrl, note.trim() || undefined);
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
            <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Fundify Action
            </span>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
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

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Deal Summary Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between text-sm">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient Client</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{deal.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount to Dispatch</span>
              <span className="font-black text-sm sm:text-base text-emerald-600 font-mono">
                {formatUsd(deal.dollarAmount)}
              </span>
            </div>
          </div>

          {/* Screenshot Upload Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
              Transfer Screenshot / Proof <span className="text-rose-500">*</span>
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
                    Change Screenshot
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
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 sm:p-5 text-center hover:border-slate-400 transition-colors bg-slate-50/40">
                <ImageIcon className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
                <p className="text-xs sm:text-sm font-medium text-slate-700">
                  Upload screenshot showing transfer of {formatUsd(deal.dollarAmount)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-2.5">
                  PNG, JPG or WebP image
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs cursor-pointer hover:bg-slate-50 inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse File</span>
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
            <span className="font-bold">Awaiting Client Confirmation</span>. The client will review this screenshot before the due balance activates.
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
              disabled={isUploading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>Send Dollar Proof</span>
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
