'use client';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Hourglass, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegistrationSubmittedPage() {
  const router = useRouter();

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c0c9bb] text-center space-y-6 animate-fade-in">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-[#a0f399] text-[#005312] flex items-center justify-center mx-auto shadow-md ring-8 ring-[#a0f399]/30">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] tracking-tight">
            Registration Received!
          </h1>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center space-x-2 bg-[#e9e8e4] px-4 py-2 rounded-lg border border-[#c0c9bb]">
          <Hourglass className="w-4 h-4 text-[#1b6d24] animate-spin" />
          <span className="text-xs font-bold text-[#41493e]">Pending Admin Approval</span>
        </div>

        {/* Description */}
        <p className="text-xs text-[#41493e] leading-relaxed max-w-sm mx-auto">
          Your documents have been successfully queued for verification. This process typically takes 24-48 hours. You will receive a notification once your digital voter ID is ready.
        </p>

        {/* Go to Login Portal Action */}
        <div className="pt-2">
          <button
            onClick={() => router.push('/student/login')}
            className="w-full h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>Go to Student Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
