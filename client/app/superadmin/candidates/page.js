'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  LayoutDashboard,
  UserCheck,
  Search,
  Building2,
  ShieldCheck,
  Users,
  LogOut,
  Award,
  CheckCircle2,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SuperAdminCandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([
    {
      id: 1,
      name: 'Ali Raza',
      party: 'Techno Alliance',
      manifesto: 'Digital campus Wi-Fi expansion & smart labs',
      position_title: 'President',
      department_name: 'Computer Science',
      status: 'approved',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/superadmin/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.candidates && res.data.candidates.length > 0) {
        setCandidates(res.data.candidates);
      }
    } catch (e) {
      console.warn('Superadmin fetch candidates fallback:', e);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const term = searchQuery.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const party = (c.party || '').toLowerCase();
    const pos = (c.position_title || '').toLowerCase();
    return name.includes(term) || party.includes(term) || pos.includes(term);
  });

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#efeeea] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">SuperAdmin</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              Candidate Roster Control
            </p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/superadmin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#717a6d]" />
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
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-[#00450d]" />
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

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a]">
              Approved Election Candidates
            </h1>
            <p className="text-xs text-[#717a6d] mt-1">
              Official list of all admin-approved candidate nominations eligible to contest.
            </p>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#717a6d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approved candidates..."
              className="w-full bg-white border border-[#c0c9bb] rounded-full pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
            />
          </div>
        </div>

        {/* Candidate Roster Table */}
        <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Candidate Name</th>
                  <th className="px-6 py-3.5">Party & Manifesto</th>
                  <th className="px-6 py-3.5">Contesting Seat</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c0c9bb]">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-[#f4f4f0] transition-colors">
                    <td className="px-6 py-4 font-bold text-xs text-[#1b1c1a]">{cand.name}</td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-[#00450d]">{cand.party || 'Independent'}</p>
                      <p className="text-[11px] text-[#717a6d] truncate max-w-xs">{cand.manifesto}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-[#a0f399] text-[#005312] rounded-md font-bold text-xs">
                        {cand.position_title || 'President'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-[#41493e]">
                      {cand.department_name || 'Computer Science'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-[#a0f399] text-[#005312] rounded-full text-[10px] font-extrabold uppercase flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-[#005312]" />
                        <span>APPROVED</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
