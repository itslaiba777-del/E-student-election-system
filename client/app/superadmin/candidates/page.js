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
  CheckCircle2,
  X,
  Star,
  FileText,
  Award,
  ChevronRight,
} from 'lucide-react';

import { API_BASE_URL, SERVER_BASE_URL } from '../../../lib/api';

export default function SuperAdminCandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/superadmin/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.candidates) {
        setCandidates(res.data.candidates);
      }
    } catch (e) {
      setCandidates([]);
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
    const name = (c.name || c.full_name || '').toLowerCase();
    const party = (c.party || c.party_name || '').toLowerCase();
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
              Approved Candidates Roster
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
              Official list of all admin-approved candidate nominations eligible to contest in university elections.
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

        {/* Approved Candidate Count Card */}
        <div className="p-4 bg-[#e8f5e9] border border-[#a0f399] rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-[#005312]" />
            <div>
              <h3 className="text-xs font-black uppercase text-[#00450d]">Admin-Approved Candidates Roster</h3>
              <p className="text-xs text-[#005312]">
                Candidates approved by Department Admins automatically appear here in SuperAdmin control overview.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-[#00450d] text-white text-xs font-extrabold rounded-full">
            {candidates.length} Approved
          </span>
        </div>

        {/* Candidate Roster Table */}
        <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Candidate Name</th>
                  <th className="px-6 py-3.5">Party & Symbol</th>
                  <th className="px-6 py-3.5">Contesting Seat</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c0c9bb]">
                {filteredCandidates.map((cand) => {
                  const candidateName = cand.name || cand.full_name || 'Candidate';
                  return (
                    <tr
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      className="hover:bg-[#f4f4f0] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-[#00450d] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {candidateName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#1b1c1a]">{candidateName}</p>
                            <p className="text-[11px] text-[#717a6d]">{cand.election_title || 'General Election'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[#00450d]">{cand.party || cand.party_name || 'Independent'}</span>
                          {cand.symbol_image_url && (
                            <img
                              src={cand.symbol_image_url.startsWith('http') ? cand.symbol_image_url : `${SERVER_BASE_URL}${cand.symbol_image_url}`}
                              alt="Symbol"
                              className="w-5 h-5 object-contain rounded border border-[#c0c9bb]"
                            />
                          )}
                        </div>
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
                          <CheckCircle2 className="w-3 h-3" />
                          <span>APPROVED BY ADMIN</span>
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#717a6d] inline" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Candidate Profile Drawer (Read-Only Overview for SuperAdmin) */}
      {selectedCandidate && (
        <>
          <div
            onClick={() => setSelectedCandidate(null)}
            className="fixed inset-0 bg-[#1b1c1a]/30 backdrop-blur-xs z-50 transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-[#c0c9bb] animate-fade-in">
            <div className="p-6 border-b border-[#c0c9bb] flex justify-between items-center bg-[#faf9f5]">
              <h3 className="text-base font-bold text-[#1b1c1a]">Approved Candidate Profile</h3>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 hover:bg-[#e9e8e4] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative w-28 h-28 rounded-full border-4 border-[#00450d] shadow-md overflow-hidden bg-[#e9e8e4] flex items-center justify-center">
                  {selectedCandidate.photo_url ? (
                    <img
                      src={selectedCandidate.photo_url.startsWith('http') ? selectedCandidate.photo_url : `${SERVER_BASE_URL}${selectedCandidate.photo_url}`}
                      alt={selectedCandidate.name || selectedCandidate.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-black text-[#00450d] text-2xl">
                      {(selectedCandidate.name || selectedCandidate.full_name || 'C').charAt(0)}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-[#1b1c1a]">
                    {selectedCandidate.name || selectedCandidate.full_name}
                  </h4>
                  <p className="text-xs text-[#717a6d] font-semibold mt-0.5">
                    Approved Candidate for {selectedCandidate.position_title || 'President'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <span className="px-3 py-1 bg-[#a0f399] text-[#005312] text-xs font-bold rounded-full">
                    {selectedCandidate.party || selectedCandidate.party_name || 'Independent'}
                  </span>

                  {selectedCandidate.symbol_image_url && (
                    <div className="px-3 py-1 bg-white border border-[#c0c9bb] rounded-full flex items-center space-x-1.5 text-xs font-bold text-[#1b1c1a]">
                      <img
                        src={selectedCandidate.symbol_image_url.startsWith('http') ? selectedCandidate.symbol_image_url : `${SERVER_BASE_URL}${selectedCandidate.symbol_image_url}`}
                        alt="Symbol"
                        className="w-5 h-5 object-contain"
                      />
                      <span>GitHub Committed Symbol</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manifesto */}
              <section className="space-y-2">
                <h5 className="text-xs font-bold text-[#00450d] uppercase tracking-wider">
                  Candidate Manifesto
                </h5>
                <div className="bg-[#f4f4f0] p-4 rounded-xl border border-[#c0c9bb]">
                  <p className="text-xs text-[#41493e] leading-relaxed italic">
                    "{selectedCandidate.manifesto || 'No manifesto details provided.'}"
                  </p>
                </div>
              </section>

              {/* Status Banner */}
              <div className="p-4 bg-[#e8f5e9] border border-[#a0f399] rounded-xl flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#005312]" />
                <span className="text-xs font-extrabold text-[#005312]">
                  Status: Approved by Department Admin
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
