'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TerminalScreenNavbar from '../../../../components/TerminalScreenNavbar';
import { voteAPI } from '../../../../lib/api';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function FaceFailedLockoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get('election_id') || '1';

  useEffect(() => {
    // Log failed face verification attempt to backend voting_status record
    logFailedFaceLockout();
  }, [electionId]);

  const logFailedFaceLockout = async () => {
    console.log('Logging failed face verification attempt to backend voting_status:', {
      election_id: electionId,
      final_status: 'locked_face_fail',
    });

    try {
      await voteAPI.logLockout({
        election_id: electionId,
        reason: 'locked_face_fail',
      });
    } catch (err) {
      console.warn('Backend face lockout logging fallback:', err);
    }
  };

  return (
    <div className="bg-[#fbfaf6] min-h-screen text-[#1b1c1a] font-sans flex flex-col justify-between">
      {/* Shared Terminal Screen Navbar */}
      <TerminalScreenNavbar />

      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center p-6 mt-16">
        <div className="max-w-[560px] w-full text-center flex flex-col items-center space-y-5 animate-fade-in">
          {/* Large Red Lock Icon */}
          <div className="w-24 h-24 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#d32f2f] shadow-sm ring-8 ring-[#ffdad6]/40">
            <ShieldAlert className="w-12 h-12" />
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-[#1b1c1a] tracking-tight">
            Face verification failed
          </h1>

          {/* Supporting Text */}
          <p className="text-sm md:text-base text-[#41493e] leading-relaxed max-w-md">
            We couldn't verify your identity. Since only one attempt is allowed, you will not be able to vote in this election.
          </p>

          {/* Muted Secondary Text */}
          <p className="text-xs text-[#717a6d] leading-relaxed max-w-sm">
            Your attempt has been recorded. If you believe this is an error, contact your department admin.
          </p>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="px-8 h-11 rounded-xl border border-[#717a6d] text-[#41493e] font-bold text-xs hover:bg-[#e3e2df] hover:text-[#1b1c1a] transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to dashboard</span>
            </button>
          </div>
        </div>
      </main>

      {/* Discrete Footer */}
      <footer className="p-4 text-center text-[11px] text-[#717a6d] opacity-75">
        © 2026 Campus Vote System. Permanent Facial Biometric Audit Protocol Enabled.
      </footer>
    </div>
  );
}
