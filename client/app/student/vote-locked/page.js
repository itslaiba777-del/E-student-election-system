'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

export default function VoteLockedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getReasonDetails = () => {
    switch (reason) {
      case 'OTP_LOCKED_MAX_ATTEMPTS':
        return 'Maximum OTP verification attempts exceeded (2/2). Access to this election has been permanently locked for security.';
      case 'FACE_VERIFICATION_FAILED':
        return 'Facial biometrics failed to match your registered face profile. Access to this election has been permanently locked.';
      default:
        return 'Your voting access for this election has been locked due to security policy violations or verification failure.';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-red-200 shadow-md text-center space-y-5">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-extrabold text-slate-900">Election Voting Locked</h1>
        <p className="text-xs text-red-600 font-semibold">{getReasonDetails()}</p>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1 font-mono">
        <p><strong>Security Event:</strong> AUDIT_LOCKOUT</p>
        <p><strong>Status:</strong> PERMANENT_ELECTION_LOCK</p>
        <p><strong>Action:</strong> Vote Not Counted</p>
      </div>

      <div className="pt-2">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Student Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
