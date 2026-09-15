'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Vote, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [dashboardUrl, setDashboardUrl] = useState('/select-university');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const role = user.role?.toLowerCase();

          if (role === 'student') {
            setDashboardUrl('/student/dashboard');
          } else if (role === 'superadmin') {
            setDashboardUrl('/superadmin/dashboard');
          } else if (role === 'admin' || role?.includes('admin')) {
            setDashboardUrl('/admin/dashboard');
          } else {
            setDashboardUrl('/select-university');
          }
        } catch (e) {
          setDashboardUrl('/select-university');
        }
      } else {
        setDashboardUrl('/select-university');
      }
    }
  }, []);

  const handleReturnDashboard = () => {
    router.push(dashboardUrl);
  };

  return (
    <div className="bg-[#faf9f5] text-[#1b1c1a] min-h-screen flex flex-col justify-between font-sans overflow-x-hidden relative">
      {/* Top Header Branding */}
      <header className="w-full flex justify-center py-6 px-6 z-10">
        <div className="flex items-center space-x-2 select-none">
          <div className="p-2 bg-[#00450d] rounded-lg text-white">
            <Vote className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl text-[#00450d] tracking-tight">Campus Vote</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 z-10">
        <div className="max-w-xl w-full text-center space-y-6 relative">
          {/* Abstract Background Blur Decoration */}
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#a0f399]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Search Icon Assembly */}
          <div className="flex justify-center mb-4">
            <div className="p-6 rounded-full bg-[#f4f4f0] border border-[#c0c9bb] shadow-sm flex items-center justify-center animate-bounce">
              <Search className="w-12 h-12 text-[#00450d] opacity-80" />
            </div>
          </div>

          {/* Error Message Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b1c1a] tracking-tight">
              Page not found
            </h1>
            <p className="text-sm md:text-base text-[#41493e] max-w-md mx-auto leading-relaxed">
              The page you're looking for doesn't exist or has moved.
            </p>
          </div>

          {/* Action Section */}
          <div className="pt-4">
            <button
              onClick={handleReturnDashboard}
              className="inline-flex items-center justify-center space-x-2 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs px-8 h-12 rounded-xl transition-all duration-300 shadow-md active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to dashboard</span>
            </button>
          </div>

          {/* Decorative Academic Texture Footer Grid */}
          <div className="grid grid-cols-3 gap-4 pt-10 opacity-30 pointer-events-none text-center">
            <div className="border-t border-[#717a6d] pt-2">
              <span className="text-[10px] uppercase tracking-widest block font-bold text-[#717a6d]">
                Error 404
              </span>
            </div>
            <div className="border-t border-[#717a6d] pt-2">
              <span className="text-[10px] uppercase tracking-widest block font-bold text-[#717a6d]">
                Campus Auth
              </span>
            </div>
            <div className="border-t border-[#717a6d] pt-2">
              <span className="text-[10px] uppercase tracking-widest block font-bold text-[#717a6d]">
                Ecosystem
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Identity */}
      <footer className="w-full text-center py-6 opacity-60 text-xs text-[#717a6d]">
        <p>© 2026 Institutional Voting Services. All rights reserved.</p>
      </footer>
    </div>
  );
}
