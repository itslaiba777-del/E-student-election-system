'use client';
import { useRouter } from 'next/navigation';
import { useStudentFlow } from '../../../context/StudentFlowContext';
import { Vote, School, LogIn, UserPlus, ArrowRight, ShieldCheck, Lock, Fingerprint, Award } from 'lucide-react';

export default function LoginOrRegisterPage() {
  const router = useRouter();
  const { selectedUniversity } = useStudentFlow();

  const universityName = selectedUniversity
    ? selectedUniversity.university_name
    : 'Quaid-i-Azam University';

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        {/* University Selection Badge */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-[#e9e8e4] border border-[#c0c9bb] px-4 py-2 rounded-full shadow-sm">
            <School className="w-4 h-4 text-[#00450d]" />
            <p className="text-xs text-[#41493e]">
              Selected: <span className="font-bold text-[#1b1c1a]">{universityName}</span>
            </p>
            <div className="w-px h-4 bg-[#c0c9bb] mx-1"></div>
            <button
              onClick={() => router.push('/select-university')}
              className="text-xs text-[#00450d] font-bold hover:underline transition-all"
            >
              Change
            </button>
          </div>
        </div>

        {/* Branding Section */}
        <div className="text-center mb-10">
          <div className="mb-3 flex justify-center">
            <div className="p-3 bg-[#00450d] text-white rounded-2xl shadow-md">
              <Vote className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b1c1a] tracking-tight mb-2">
            Campus Vote
          </h1>
          <p className="text-sm text-[#41493e] max-w-[340px] mx-auto leading-relaxed">
            Empowering the student voice through secure, transparent digital elections.
          </p>
        </div>

        {/* Choice Cards Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[800px]">
          {/* Login Card */}
          <button
            onClick={() => router.push('/student/login')}
            className="group relative bg-[#faf9f5] border border-[#c0c9bb] p-6 rounded-2xl shadow-[0px_4px_12px_rgba(27,94,32,0.05)] hover:shadow-md hover:border-[#00450d] transition-all duration-300 text-left flex flex-col items-start overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00450d] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-12 h-12 rounded-xl bg-[#acf4a4] text-[#002203] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LogIn className="w-6 h-6 text-[#00450d]" />
            </div>

            <h2 className="text-xl font-bold text-[#1b1c1a] mb-2">
              I'm a returning student
            </h2>

            <p className="text-xs text-[#41493e] leading-relaxed mb-6">
              Welcome back. Access your dashboard and view active ballots for your department.
            </p>

            <div className="mt-auto flex items-center gap-2 text-[#00450d] font-bold text-xs">
              <span>Log in</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Decorative Background Pattern */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
              <Fingerprint className="w-32 h-32 text-[#00450d]" />
            </div>
          </button>

          {/* Register Card */}
          <button
            onClick={() => router.push('/student/register/step-1')}
            className="group relative bg-[#faf9f5] border border-[#c0c9bb] p-6 rounded-2xl shadow-[0px_4px_12px_rgba(27,94,32,0.05)] hover:shadow-md hover:border-[#1b6d24] transition-all duration-300 text-left flex flex-col items-start overflow-hidden active:scale-[0.98]"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#1b6d24] opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-12 h-12 rounded-xl bg-[#a3f69c] text-[#002204] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6 text-[#1b6d24]" />
            </div>

            <h2 className="text-xl font-bold text-[#1b1c1a] mb-2">
              I'm new here
            </h2>

            <p className="text-xs text-[#41493e] leading-relaxed mb-6">
              Verify your student identity to participate in upcoming university-wide elections.
            </p>

            <div className="mt-auto flex items-center gap-2 text-[#1b6d24] font-bold text-xs">
              <span>Register</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>

            {/* Decorative Background Pattern */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
              <ShieldCheck className="w-32 h-32 text-[#1b6d24]" />
            </div>
          </button>
        </div>

        {/* Secondary Info & Help */}
        <div className="mt-10 text-center space-y-3">
          <p className="text-xs text-[#41493e]">
            Trouble logging in?{' '}
            <a href="#" className="text-[#00450d] font-bold hover:underline">
              Contact Student Affairs
            </a>
          </p>

          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold uppercase tracking-wider text-[#1b1c1a]">
              <ShieldCheck className="w-4 h-4 text-[#00450d]" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-60 text-xs font-semibold uppercase tracking-wider text-[#1b1c1a]">
              <Lock className="w-4 h-4 text-[#00450d]" />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Identity Banner */}
      <footer className="w-full py-4 px-6 border-t border-[#c0c9bb] bg-[#f4f4f0] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#1b5e20] text-white flex items-center justify-center shadow-sm">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1b1c1a]">Campus Vote Portal</p>
            <p className="text-[11px] text-[#41493e]">Official University Voting Infrastructure</p>
          </div>
        </div>

        <div className="flex gap-6 text-xs text-[#41493e] font-medium">
          <a href="#" className="hover:text-[#00450d] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#00450d] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#00450d] transition-colors">Help</a>
        </div>
      </footer>
    </div>
  );
}
