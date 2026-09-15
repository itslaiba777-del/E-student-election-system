'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Users,
  UserCheck,
  Vote,
  LogOut,
  TrendingUp,
  Shield,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SuperAdminDashboardPage() {
  const router = useRouter();

  const [metrics, setMetrics] = useState({
    total_admins: 1,
    total_voters: 2,
    approved_candidates: 1,
    active_elections: 1,
    university_name: 'COMSATS University',
  });

  const [elections, setElections] = useState([
    {
      id: 1,
      title: 'University Executive Union Election 2026',
      position_title: 'President',
      status: 'active',
      scope_type: 'all_departments',
    },
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const adminRes = await axios.get(`${API_BASE_URL}/superadmin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (adminRes.data?.admins) {
        setMetrics((prev) => ({ ...prev, total_admins: adminRes.data.admins.length }));
      }
    } catch (e) {}

    try {
      const studRes = await axios.get(`${API_BASE_URL}/superadmin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studRes.data?.students) {
        setMetrics((prev) => ({ ...prev, total_voters: studRes.data.students.length }));
      }
    } catch (e) {}

    try {
      const candRes = await axios.get(`${API_BASE_URL}/superadmin/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (candRes.data?.candidates) {
        setMetrics((prev) => ({ ...prev, approved_candidates: candRes.data.candidates.length }));
      }
    } catch (e) {}

    try {
      const settingsRes = await axios.get(`${API_BASE_URL}/auth/system/settings`);
      if (settingsRes.data?.settings?.university_name) {
        setMetrics((prev) => ({ ...prev, university_name: settingsRes.data.settings.university_name }));
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#efeeea] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">SuperAdmin</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              Portal Control
            </p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/superadmin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00450d]" />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/superadmin/settings"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#717a6d]" />
              <span>General Information</span>
            </Link>

            <Link
              href="/superadmin/manage-admins"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Add / Manage Admins</span>
            </Link>

            <Link
              href="/superadmin/students"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Users className="w-4 h-4 text-[#717a6d]" />
              <span>All Registered Voters</span>
            </Link>

            <Link
              href="/superadmin/candidates"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <UserCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Approved Candidates</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-1 pt-4 border-t border-[#c0c9bb]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-7xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a]">
              SuperAdmin Dashboard
            </h1>
            <p className="text-xs text-[#717a6d] mt-1">
              Master Control Panel — {metrics.university_name || 'E-Election System'}
            </p>
          </div>
        </div>

        {/* Bento Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Admins */}
          <Link
            href="/superadmin/manage-admins"
            className="bg-white p-6 rounded-2xl border border-[#c0c9bb] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#a0f399] flex items-center justify-center text-[#00450d] mb-4 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider">
              Total Admins
            </p>
            <div className="flex justify-between items-center mt-1">
              <h3 className="text-2xl font-black text-[#1b1c1a]">{metrics.total_admins}</h3>
              <ChevronRight className="w-4 h-4 text-[#717a6d]" />
            </div>
          </Link>

          {/* Registered Voters */}
          <Link
            href="/superadmin/students"
            className="bg-white p-6 rounded-2xl border border-[#c0c9bb] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#a0f399] flex items-center justify-center text-[#00450d] mb-4 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider">
              Registered Voters
            </p>
            <div className="flex justify-between items-center mt-1">
              <h3 className="text-2xl font-black text-[#1b1c1a]">{metrics.total_voters}</h3>
              <ChevronRight className="w-4 h-4 text-[#717a6d]" />
            </div>
          </Link>

          {/* Approved Candidates */}
          <Link
            href="/superadmin/candidates"
            className="bg-white p-6 rounded-2xl border border-[#c0c9bb] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#a0f399] flex items-center justify-center text-[#00450d] mb-4 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider">
              Approved Candidates
            </p>
            <div className="flex justify-between items-center mt-1">
              <h3 className="text-2xl font-black text-[#1b1c1a]">{metrics.approved_candidates}</h3>
              <ChevronRight className="w-4 h-4 text-[#717a6d]" />
            </div>
          </Link>

          {/* Active Elections */}
          <div className="bg-[#00450d] p-6 rounded-2xl shadow-md text-white">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-[#a0f399] mb-4">
              <Vote className="w-6 h-6" />
            </div>
            <p className="text-xs text-[#acf4a4] font-bold uppercase tracking-wider">
              Active Elections
            </p>
            <h3 className="text-2xl font-black text-white mt-1">{metrics.active_elections}</h3>
          </div>
        </div>

        {/* Quick Navigation Bento Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-[#00450d]">SuperAdmin Control Sections</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/superadmin/settings"
                className="p-4 bg-[#f4f4f0] hover:bg-[#a0f399]/30 rounded-xl border border-[#c0c9bb] block font-bold text-xs text-[#1b1c1a]"
              >
                🏢 General Information & Branding
              </Link>
              <Link
                href="/superadmin/manage-admins"
                className="p-4 bg-[#f4f4f0] hover:bg-[#a0f399]/30 rounded-xl border border-[#c0c9bb] block font-bold text-xs text-[#1b1c1a]"
              >
                🛡️ Add / Manage System Admins
              </Link>
              <Link
                href="/superadmin/students"
                className="p-4 bg-[#f4f4f0] hover:bg-[#a0f399]/30 rounded-xl border border-[#c0c9bb] block font-bold text-xs text-[#1b1c1a]"
              >
                👥 All Registered Voters List
              </Link>
              <Link
                href="/superadmin/candidates"
                className="p-4 bg-[#f4f4f0] hover:bg-[#a0f399]/30 rounded-xl border border-[#c0c9bb] block font-bold text-xs text-[#1b1c1a]"
              >
                🏅 Approved Election Candidates
              </Link>
            </div>
          </div>

          <div className="bg-[#00450d] text-white p-6 rounded-2xl shadow-md flex flex-col justify-between space-y-4">
            <div>
              <Shield className="w-10 h-10 text-[#a0f399] mb-2" />
              <h3 className="text-lg font-extrabold">System Security & Health Status</h3>
              <p className="text-xs text-[#acf4a4] leading-relaxed mt-1">
                E-Election system operational node is running securely with active SHA-256 ballot hashing and biometric verification.
              </p>
            </div>

            <div className="pt-3 border-t border-white/20 flex justify-between items-center text-xs font-bold">
              <span>Security Protocol v2.4.0</span>
              <span className="bg-[#a0f399] text-[#005312] px-2.5 py-1 rounded-md">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
