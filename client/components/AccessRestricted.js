'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, Mail, UserCheck, ShieldAlert } from 'lucide-react';

export default function AccessRestricted({
  requiredPermission = 'Permission Granted',
  supportEmail = 'support@campusvote.edu',
}) {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setAdminUser(JSON.parse(stored));
        } catch (e) {
          console.warn('Error parsing admin user for AccessRestricted:', e);
        }
      }
    }
  }, []);

  const adminRole = adminUser?.admin_level
    ? `${adminUser.admin_level.charAt(0).toUpperCase() + adminUser.admin_level.slice(1)} Admin`
    : 'Departmental Admin';

  const adminCode = adminUser?.id ? `ADM-${adminUser.id}` : 'CV-403-PRM';

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center p-6 relative overflow-hidden font-sans text-[#1b1c1a]">
      {/* Abstract Background Shader */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00450d] opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-64 h-64 bg-[#1b6d24] opacity-10 rounded-full blur-3xl" />
      </div>

      {/* Restriction Card Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-[#c0c9bb] shadow-sm p-8 md:p-12 flex flex-col items-center text-center space-y-6">
        {/* Animated Neutral Lock Icon */}
        <div className="w-20 h-20 rounded-full bg-[#efeeea] flex items-center justify-center text-[#717a6d] shadow-inner">
          <Lock className="w-10 h-10 text-[#717a6d]" />
        </div>

        {/* Content Header */}
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#00450d] tracking-tight">
            You don&apos;t have access to this section
          </h2>
          <p className="text-xs md:text-sm text-[#41493e] leading-relaxed">
            Your current administrative permissions do not allow you to view or manage this area.
            Contact your <span className="font-bold text-[#00450d]">SuperAdmin</span> if you believe
            this is incorrect.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full pt-2">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="w-full sm:w-auto px-6 h-11 flex items-center justify-center space-x-2 border border-[#00450d] text-[#00450d] font-bold text-xs rounded-xl hover:bg-[#f4f4f0] transition-colors active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to dashboard</span>
          </button>

          <a
            href={`mailto:${supportEmail}?subject=Permission%20Access%20Request%20(${adminCode})`}
            className="w-full sm:w-auto px-6 h-11 flex items-center justify-center space-x-2 bg-[#f4f4f0] text-[#41493e] hover:bg-[#e9e8e4] font-bold text-xs rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4 text-[#00450d]" />
            <span>Email Admin Support</span>
          </a>
        </div>

        {/* Bottom Contextual Info */}
        <div className="pt-6 border-t border-[#c0c9bb] w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="p-3.5 rounded-xl bg-[#f4f4f0] space-y-1">
            <span className="text-[10px] font-extrabold text-[#00450d] uppercase tracking-wider block">
              Current Role
            </span>
            <p className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#005312]" />
              <span>{adminRole}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#f4f4f0] space-y-1">
            <span className="text-[10px] font-extrabold text-[#00450d] uppercase tracking-wider block">
              Admin Code / ID
            </span>
            <p className="text-xs font-mono font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#717a6d]" />
              <span>{adminCode}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
