'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Vote, ArrowRight } from 'lucide-react';

export default function SessionExpiredPage() {
  const router = useRouter();
  const [loginUrl, setLoginUrl] = useState('/');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let targetRole = sessionStorage.getItem('last_expired_role');

      if (!targetRole) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            targetRole = user.role;
          } catch (e) {}
        }
      }

      setLoginUrl('/');

      // Fully clear stored client authentication tokens & session data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('last_expired_role');
      sessionStorage.removeItem('captured_face_image');
      sessionStorage.removeItem('registration_step_1');
      sessionStorage.removeItem('registration_step_2');
      sessionStorage.removeItem('registration_step_3');
    }
  }, []);

  const handleLoginAgain = () => {
    setRedirecting(true);
    setTimeout(() => {
      router.push(loginUrl);
    }, 400);
  };

  return (
    <div className="bg-[#faf9f5] text-[#1b1c1a] min-h-screen flex items-center justify-center p-6 font-sans">
      <main className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Session Expired Card */}
        <div className="bg-white border border-[#c0c9bb] rounded-2xl p-8 text-center space-y-6 shadow-[0px_4px_12px_rgba(27,94,32,0.05)]">
          {/* Lock Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f4f4f0] border border-[#c0c9bb] flex items-center justify-center text-[#717a6d]">
              <Lock className="w-8 h-8" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl font-extrabold text-[#1b1c1a] tracking-tight">
              Your session expired
            </h1>
            <p className="text-xs text-[#41493e] mt-2 leading-relaxed px-2">
              For your security, you've been logged out due to inactivity or session timeout.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-2">
            <button
              onClick={handleLoginAgain}
              disabled={redirecting}
              className="w-full bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs h-11 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <span>{redirecting ? 'Redirecting...' : 'Log in again'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/"
              className="text-xs text-[#41493e] font-semibold hover:text-[#00450d] py-1 transition-colors block"
            >
              Back to Homepage
            </Link>
          </div>
        </div>

        {/* System Branding / Footer */}
        <footer className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 text-[#00450d]">
            <div className="p-1 bg-[#00450d] rounded text-white">
              <Vote className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm tracking-tight">Campus Vote</span>
          </div>
          <p className="text-[11px] text-[#717a6d]">
            Institutional Security Protocol v2.4.0
          </p>
        </footer>
      </main>
    </div>
  );
}
