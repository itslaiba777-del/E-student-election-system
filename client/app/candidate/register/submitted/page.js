'use client';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowRight, UserCheck, ShieldCheck, Vote } from 'lucide-react';

export default function CandidateRegistrationSubmittedPage() {
  const router = useRouter();

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-[#c0c9bb] rounded-2xl p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 bg-[#a0f399] text-[#005312] rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-[#00450d] text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full">
            <Sparkles className="w-3 h-3 text-[#acf4a4]" />
            <span>Candidate Application Registered</span>
          </div>

          <h1 className="text-2xl font-extrabold text-[#1b1c1a]">
            Candidate Nomination Submitted!
          </h1>
          <p className="text-xs text-[#717a6d] leading-relaxed max-w-sm mx-auto">
            Your candidate profile, face scan, party symbol, and manifesto have been successfully registered into the Campus Voting system database and saved.
          </p>
        </div>

        <div className="bg-[#faf9f5] border border-[#c0c9bb] p-4 rounded-xl text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-[#717a6d]">
            <span>Nomination Status</span>
            <span className="font-bold text-[#005312] bg-[#a0f399] px-2 py-0.5 rounded text-[10px]">
              SUBMITTED / PENDING ADMIN REVIEW
            </span>
          </div>
          <div className="flex justify-between items-center text-[#717a6d]">
            <span>Biometric Security</span>
            <span className="font-bold text-[#1b1c1a]">Face Hashed & Saved to Git</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/student/login')}
            className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-md"
          >
            <span>Go Back to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/candidate/profile')}
            className="flex-1 h-11 bg-[#f4f4f0] hover:bg-[#e9e8e4] text-[#1b1c1a] font-bold text-xs border border-[#c0c9bb] rounded-xl flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-4 h-4 text-[#00450d]" />
            <span>Candidate Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
