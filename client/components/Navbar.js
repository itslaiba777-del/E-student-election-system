'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Vote, LogOut } from 'lucide-react';
import { useBranding } from '../context/BrandingContext';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const { universityName, logoUrl } = useBranding();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-[#faf9f5] sticky top-0 z-50 w-full border-b border-[#c0c9bb] shadow-sm">
      <nav className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto h-16">
        {/* Left: Dynamic University Name & Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          {logoUrl ? (
            <img src={logoUrl} alt={universityName} className="h-9 w-9 object-contain rounded-md" />
          ) : (
            <div className="p-2 bg-[#00450d] rounded-lg group-hover:bg-[#1b5e20] transition-colors shadow-sm">
              <Vote className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <span className="font-extrabold text-lg text-[#00450d] tracking-tight block leading-tight">
              {universityName}
            </span>
            <span className="text-[10px] text-[#717a6d] font-bold uppercase tracking-wider block">
              E-Election System
            </span>
          </div>
        </Link>

        {/* Hide all navigation, notification, and profile elements during unauthenticated onboarding & registration */}
        {/* Hide navigation links when not logged in or during registration */}
        {user ? (
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[#2C2C2C] font-semibold">
              {user.name || user.full_name || user.email} ({user.role || user.user_role})
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-xs bg-[#D32F2F]/10 text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-medium text-[#6B6B60]">
            <span>Unified Voting Portal</span>
          </div>
        )}
      </nav>
    </header>
  );
}
