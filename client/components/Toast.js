'use client';
import { useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({
  id,
  type = 'success', // 'success' | 'error' | 'warning' | 'info'
  title,
  message = '',
  onDismiss = () => {},
  duration = 4500,
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const variantStyles = {
    success: {
      container: 'bg-[#a0f399] text-[#005312] border-[#1b6d24]/30',
      iconBadge: 'bg-[#00450d] text-white',
      icon: CheckCircle2,
      defaultTitle: 'Success',
      closeBtn: 'text-[#005312] hover:opacity-100 opacity-60',
    },
    error: {
      container: 'bg-[#ffdad6] text-[#93000a] border-[#ba1a1a]/30',
      iconBadge: 'bg-[#ba1a1a] text-white',
      icon: XCircle,
      defaultTitle: 'Error',
      closeBtn: 'text-[#93000a] hover:opacity-100 opacity-60',
    },
    warning: {
      container: 'bg-[#ffecb3] text-[#7f5f01] border-[#ffb300]/40',
      iconBadge: 'bg-[#ffb300] text-white',
      icon: AlertTriangle,
      defaultTitle: 'Warning',
      closeBtn: 'text-[#7f5f01] hover:opacity-100 opacity-60',
    },
    info: {
      container: 'bg-[#e0f2f1] text-[#004d40] border-[#26a69a]/40',
      iconBadge: 'bg-[#26a69a] text-white',
      icon: Info,
      defaultTitle: 'Info',
      closeBtn: 'text-[#004d40] hover:opacity-100 opacity-60',
    },
  };

  const style = variantStyles[type] || variantStyles.info;
  const IconComponent = style.icon;
  const displayTitle = title || style.defaultTitle;

  return (
    <div
      className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start space-x-3 transition-all duration-300 transform translate-x-0 animate-fade-in ${style.container}`}
    >
      <div className={`p-1 rounded-full flex items-center justify-center shrink-0 ${style.iconBadge}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      <div className="flex-1 text-left">
        <p className="text-xs font-bold leading-tight">{displayTitle}</p>
        <p className="text-xs font-medium opacity-90 mt-0.5 leading-snug">{message}</p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        className={`p-0.5 rounded transition-opacity ${style.closeBtn}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
