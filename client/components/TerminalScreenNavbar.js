'use client';
import Link from 'next/link';
import { Vote, Bell, User } from 'lucide-react';

export default function TerminalScreenNavbar() {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-white border-b border-[#c0c9bb] shadow-sm">
      {/* Brand Identity */}
      <div className="flex items-center space-x-2">
        <div className="p-1.5 bg-[#00450d] rounded-lg text-white">
          <Vote className="w-5 h-5" />
        </div>
        <span className="font-extrabold text-xl text-[#00450d] tracking-tight">Campus Vote</span>
      </div>

      {/* Simplified Right Actions (No nav links) */}
      <div className="flex items-center space-x-4">
        <Link
          href="/student/dashboard"
          className="text-xs font-bold text-[#00450d] hover:underline hidden sm:inline-block"
        >
          Student Dashboard
        </Link>
        <div className="flex items-center space-x-2 text-[#717a6d]">
          <Bell className="w-4 h-4 cursor-pointer hover:text-[#1b1c1a]" />
          <User className="w-4 h-4 cursor-pointer hover:text-[#1b1c1a]" />
        </div>
      </div>
    </header>
  );
}
