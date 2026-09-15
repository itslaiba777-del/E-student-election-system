'use client';
import { useEffect } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export default function ConfirmationModal({
  isOpen = false,
  iconType = 'warning', // 'warning' | 'question'
  heading = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  confirmButtonStyle = 'destructive', // 'destructive' | 'primary'
  onConfirm = () => {},
  onCancel = () => {},
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
      className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4 transition-opacity duration-200"
    >
      <div className="bg-white w-full max-w-[400px] rounded-xl shadow-2xl border border-[#c0c9bb] p-6 text-center space-y-4 transform transition-all duration-200 scale-100 animate-fade-in relative">
        {/* Contextual Icon Header */}
        <div className="flex justify-center">
          {iconType === 'warning' ? (
            <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#d32f2f]">
              <AlertTriangle className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#e9e8e4] flex items-center justify-center text-[#00450d]">
              <HelpCircle className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Heading & Description */}
        <div>
          <h2 className="text-lg font-bold text-[#1b1c1a]">{heading}</h2>
          <p className="text-xs text-[#41493e] mt-1 leading-relaxed px-2">
            {description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 border border-[#717a6d] text-[#1b6d24] font-bold text-xs rounded-lg hover:bg-[#e9e8e4] transition-all active:scale-[0.98] outline-none"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-11 text-white font-bold text-xs rounded-lg transition-all shadow-sm active:scale-[0.98] outline-none ${
              confirmButtonStyle === 'destructive'
                ? 'bg-[#d32f2f] hover:bg-[#ba1a1a]'
                : 'bg-[#00450d] hover:bg-[#006017]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
