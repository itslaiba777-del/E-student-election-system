'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Vote, History, UserCheck, Settings, LogOut, Shield } from 'lucide-react';

export default function StudentSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/student/profile', icon: UserCheck },
    { name: 'Candidate Portal', href: '/student/candidate-nomination', icon: Vote },
    { name: 'Election Results', href: '/student/results', icon: History },
  ];

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-[#c0c9bb] hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#717a6d]">
            Student Portal Navigation
          </p>

          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#00450d] text-white shadow-sm'
                      : 'text-[#41493e] hover:bg-[#e9e8e4] hover:text-[#1b1c1a]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#717a6d]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Voter Security Badge */}
        <div className="bg-[#a0f399]/20 border border-[#1b6d24]/20 rounded-xl p-3.5 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-[#00450d] font-bold">
            <Shield className="w-4 h-4 text-[#1b6d24]" />
            <span>Biometric Voter ID</span>
          </div>
          <p className="text-[11px] text-[#41493e] leading-snug">
            Verified & Encrypted session active for election participation.
          </p>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-4 border-t border-[#c0c9bb]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
