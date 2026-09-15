'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw, Info, Vote } from 'lucide-react';

export default function ErrorBoundary({ error, reset }) {
  const router = useRouter();
  const [errorCode, setErrorCode] = useState('ERR-503-NETWORK_UNAVAILABLE');

  useEffect(() => {
    // Generate safe short reference code for support (without exposing stack traces or sensitive details)
    const timestampCode = Math.floor(Date.now() / 1000).toString(16).toUpperCase();
    setErrorCode(`ERR-503-${timestampCode}`);
  }, [error]);

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/select-university');
    }
  };

  const handleRetry = () => {
    if (reset) {
      reset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="bg-[#faf9f5] text-[#1b1c1a] min-h-screen flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Atmospheric Background Blurs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-[#acf4a4] opacity-20 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#a3f69c] opacity-20 blur-[120px]" />
      </div>

      {/* Error Content Container */}
      <main className="relative z-10 w-full max-w-[520px] space-y-6">
        <div className="bg-white border border-[#c0c9bb] rounded-2xl shadow-[0px_4px_12px_rgba(27,94,32,0.05)] p-6 sm:p-8 text-center space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#fff3e0] flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-9 h-9 text-[#f57c00]" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b1c1a] tracking-tight">
              Something went wrong
            </h1>
            <p className="text-xs sm:text-sm text-[#41493e] max-w-[340px] mx-auto leading-relaxed">
              We couldn't connect to the server. Check your connection and try again.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleGoBack}
              className="w-full sm:w-auto px-6 h-11 rounded-xl border border-[#00450d] text-[#00450d] font-bold text-xs hover:bg-[#e9e8e4] transition-all flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go back</span>
            </button>

            <button
              onClick={handleRetry}
              className="w-full sm:w-auto px-8 h-11 rounded-xl bg-[#00450d] text-white font-bold text-xs hover:bg-[#006017] transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>

          {/* System Info (Safe reference code without sensitive stack details) */}
          <div className="pt-4 border-t border-[#c0c9bb]">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] font-medium text-[#717a6d]">
              <Info className="w-3.5 h-3.5" />
              <span>Error Code: {errorCode}</span>
            </div>
          </div>
        </div>

        {/* Footer Brand Anchor */}
        <footer className="text-center space-y-1">
          <div className="inline-flex items-center space-x-2 text-[#00450d] font-bold text-xs">
            <Vote className="w-4 h-4" />
            <span>Campus Vote</span>
          </div>
          <p className="text-[11px] text-[#717a6d]">
            © 2026 University Election Committee. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
