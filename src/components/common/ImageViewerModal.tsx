import React from 'react';
import { X, ZoomIn, Download, ExternalLink } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Proof Screenshot',
  subtitle,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-emerald-400" />
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="proof-receipt.png"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Download Image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="p-4 sm:p-6 overflow-auto flex items-center justify-center bg-slate-950/50 min-h-[250px] sm:min-h-[400px]">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[60vh] sm:max-h-[70vh] w-auto max-w-full rounded-lg shadow-lg border border-slate-800 object-contain"
          />
        </div>
      </div>
    </div>
  );
};
