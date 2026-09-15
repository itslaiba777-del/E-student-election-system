'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { voteAPI, electionAPI } from '../../../lib/api';
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  GitFork,
  ShieldCheck,
  Users,
  Vote,
  BarChart2,
  Shield,
  LogOut,
  Download,
  Share2,
  Lock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Award,
  AlertTriangle,
} from 'lucide-react';

export default function SuperAdminReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlElectionId = searchParams.get('election_id');

  const [elections, setElections] = useState([
    {
      id: 1,
      title: 'Graduate Student Council 2026',
      status: 'closed',
      university_name: 'COMSATS University Islamabad',
    },
    {
      id: 2,
      title: 'Student Union Presidential 2026',
      status: 'ongoing',
      university_name: 'COMSATS University Islamabad',
    },
    {
      id: 3,
      title: 'Faculty of Engineering Representative',
      status: 'closed',
      university_name: 'NUST Islamabad',
    },
  ]);

  const [selectedElectionId, setSelectedElectionId] = useState(
    urlElectionId ? Number(urlElectionId) : 1
  );
  const [selectedScope, setSelectedScope] = useState('all');

  const currentElection = elections.find((e) => e.id === selectedElectionId) || elections[0];
  const isElectionClosed = currentElection.status === 'closed';

  // Analytics Metrics State
  const [metrics, setMetrics] = useState({
    total_votes: 12480,
    registered_voters: 18250,
    turnout_percentage: '68.4%',
    otp_failures: 42,
    face_id_errors: 18,
  });

  // Departmental Breakdown State
  const [breakdown, setBreakdown] = useState([
    {
      faculty_id: 101,
      faculty_name: 'Faculty of Engineering & Technology',
      status: 'closed',
      expanded: true,
      total_votes: 5200,
      departments: [
        {
          dept_id: 201,
          dept_name: 'Department of Computer Science',
          candidates: [
            {
              id: 1,
              name: 'Maya Rodriguez',
              party: 'Tech Forward Alliance',
              symbol: 'Laptop',
              votes: 1840,
              percentage: '61.3%',
              status: 'winner',
            },
            {
              id: 2,
              name: 'Jordan Smith',
              party: 'Progressive Student Front',
              symbol: 'Book',
              votes: 1160,
              percentage: '38.7%',
              status: 'runner-up',
            },
          ],
        },
        {
          dept_id: 202,
          dept_name: 'Department of Electrical Engineering',
          candidates: [
            {
              id: 3,
              name: 'Sarah Jenkins',
              party: 'United Engineers Panel',
              symbol: 'Gear',
              votes: 1320,
              percentage: '60.0%',
              status: 'winner',
            },
            {
              id: 4,
              name: 'Ali Raza',
              party: 'Innovators Panel',
              symbol: 'Bulb',
              votes: 880,
              percentage: '40.0%',
              status: 'runner-up',
            },
          ],
        },
      ],
    },
    {
      faculty_id: 102,
      faculty_name: 'Faculty of Business Administration',
      status: 'closed',
      expanded: false,
      total_votes: 4100,
      departments: [
        {
          dept_id: 203,
          dept_name: 'Department of Management Sciences',
          candidates: [
            {
              id: 5,
              name: 'Usman Tariq',
              party: 'Corporate Leaders Unity',
              symbol: 'Briefcase',
              votes: 2460,
              percentage: '60.0%',
              status: 'winner',
            },
            {
              id: 6,
              name: 'Ayesha Khan',
              party: 'Business Reformers',
              symbol: 'Graph',
              votes: 1640,
              percentage: '40.0%',
              status: 'runner-up',
            },
          ],
        },
      ],
    },
    {
      faculty_id: 103,
      faculty_name: 'Faculty of Arts & Humanities',
      status: 'ongoing', // Restricted state demonstration
      expanded: false,
      total_votes: null,
      departments: [],
    },
  ]);

  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      fetchReportData(selectedElectionId);
    }
  }, [selectedElectionId, selectedScope]);

  const fetchElections = async () => {
    try {
      const res = await electionAPI.getAll();
      if (res.data.elections && res.data.elections.length > 0) {
        setElections(res.data.elections);
        if (!urlElectionId) setSelectedElectionId(res.data.elections[0].id);
      }
    } catch (err) {
      console.warn('Elections list fallback:', err);
    }
  };

  const fetchReportData = async (electionId) => {
    try {
      const res = await voteAPI.getTally(electionId);
      if (res.data.summary) {
        setMetrics(res.data.summary);
      }
    } catch (err) {
      console.warn('Report tally fetch fallback:', err);
    }
  };

  const toggleFacultyExpand = (facId) => {
    setBreakdown((prev) =>
      prev.map((f) => (f.faculty_id === facId ? { ...f, expanded: !f.expanded } : f))
    );
  };

  const exportReport = () => {
    const exportData = {
      election: currentElection.title,
      university: currentElection.university_name,
      status: currentElection.status,
      exported_at: new Date().toISOString(),
      summary: metrics,
      breakdown: breakdown,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentElection.title.replace(/\s+/g, '_')}_Analytics.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/superadmin/reports?election_id=${selectedElectionId}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/select-university');
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#efeeea] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">Campus Vote</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              SuperAdmin Portal
            </p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/superadmin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#717a6d]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/superadmin/universities"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-[#717a6d]" />
              <span>Universities</span>
            </Link>

            <Link
              href="/superadmin/academic-structure"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <GitFork className="w-4 h-4 text-[#717a6d]" />
              <span>Academic Structure</span>
            </Link>

            <Link
              href="/superadmin/manage-admins"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Manage Admins</span>
            </Link>

            <Link
              href="/superadmin/elections"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Vote className="w-4 h-4 text-[#717a6d]" />
              <span>Elections</span>
            </Link>

            <Link
              href="/superadmin/reports"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <BarChart2 className="w-4 h-4 text-[#00450d]" />
              <span>Reports</span>
            </Link>

            <Link
              href="/superadmin/settings"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Shield className="w-4 h-4 text-[#717a6d]" />
              <span>System Settings</span>
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
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#00450d] tracking-tight">
              Reports & Election Analytics
            </h1>
            <p className="text-xs text-[#41493e] mt-1">
              Audit voter participation, turnout distributions, and final results breakdown.
            </p>
          </div>

          {/* Selectors & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedElectionId}
              onChange={(e) => setSelectedElectionId(Number(e.target.value))}
              className="bg-white border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1c1a] focus:ring-2 focus:ring-[#00450d] outline-none"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.title} ({el.status.toUpperCase()})
                </option>
              ))}
            </select>

            <button
              onClick={exportReport}
              className="bg-[#00450d] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-[#006017] transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>

            <button
              onClick={handleShare}
              className="border border-[#c0c9bb] bg-white px-4 py-2 rounded-xl text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5 hover:bg-[#e9e8e4] transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-[#00450d]" />
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Global Privacy Alert banner if election is ongoing */}
        {!isElectionClosed && (
          <div className="p-4 bg-[#e0f2f1] border border-[#26a69a]/40 rounded-2xl flex items-center space-x-3 text-[#004d40]">
            <Lock className="w-5 h-5 text-[#00450d] shrink-0" />
            <div className="text-xs">
              <p className="font-extrabold">Privacy Protection Active: Voting is In Progress</p>
              <p className="mt-0.5 opacity-90">
                Detailed turnout numbers, vote counts, and candidate standings are strictly hidden
                until the voting window closes.
              </p>
            </div>
          </div>
        )}

        {/* Top Summary Cards (5-Bento Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#c0c9bb] shadow-xs">
            <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-wider">
              Total Votes Cast
            </span>
            <h3 className="text-xl font-black text-[#00450d] mt-1">
              {isElectionClosed ? metrics.total_votes?.toLocaleString() : '••••'}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c0c9bb] shadow-xs">
            <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-wider">
              Registered Voters
            </span>
            <h3 className="text-xl font-black text-[#005312] mt-1">
              {metrics.registered_voters?.toLocaleString()}
            </h3>
          </div>

          <div className="bg-[#00450d] text-white p-5 rounded-2xl shadow-md">
            <span className="text-[10px] font-bold text-[#acf4a4] uppercase tracking-wider">
              Turnout %
            </span>
            <h3 className="text-xl font-black mt-1">
              {isElectionClosed ? metrics.turnout_percentage : 'Restricted'}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c0c9bb] shadow-xs">
            <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-wider">
              OTP Failures
            </span>
            <h3 className="text-xl font-black text-[#ba1a1a] mt-1">
              {metrics.otp_failures}
            </h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#c0c9bb] shadow-xs">
            <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-wider">
              Face ID Errors
            </span>
            <h3 className="text-xl font-black text-[#ba1a1a] mt-1">
              {metrics.face_id_errors}
            </h3>
          </div>
        </div>

        {/* Departmental Breakdown Card */}
        <div className="bg-white rounded-2xl border border-[#c0c9bb] overflow-hidden shadow-xs space-y-4">
          <div className="p-4 border-b border-[#c0c9bb] bg-[#f4f4f0] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1b1c1a] uppercase tracking-wider">
              Departmental Breakdown & Candidate Standings
            </h3>
            <span className="text-xs text-[#717a6d] font-semibold">
              Election: {currentElection.title}
            </span>
          </div>

          <div className="p-6 space-y-4">
            {breakdown.map((fac) => (
              <div key={fac.faculty_id} className="border border-[#c0c9bb]/60 rounded-xl overflow-hidden">
                {/* Faculty Level Row */}
                <div
                  onClick={() => toggleFacultyExpand(fac.faculty_id)}
                  className="p-4 bg-[#f4f4f0] flex items-center justify-between cursor-pointer hover:bg-[#e9e8e4] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {fac.expanded ? (
                      <ChevronDown className="w-4 h-4 text-[#717a6d]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[#717a6d]" />
                    )}
                    <Building2 className="w-4 h-4 text-[#00450d]" />
                    <span className="text-xs font-extrabold text-[#1b1c1a]">{fac.faculty_name}</span>
                  </div>

                  <div>
                    {fac.status === 'ongoing' || !isElectionClosed ? (
                      <span className="px-3 py-1 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold rounded-full flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Restricted / Ongoing</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#00450d]">
                        {fac.total_votes?.toLocaleString()} Votes
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Departments List */}
                {fac.expanded && (
                  <div className="p-4 space-y-4 bg-white">
                    {fac.status === 'ongoing' || !isElectionClosed ? (
                      <div className="p-4 bg-[#f4f4f0] rounded-xl text-center text-xs text-[#717a6d] italic">
                        Live feed restricted while voting is in progress for this faculty branch.
                      </div>
                    ) : (
                      fac.departments.map((dept) => (
                        <div key={dept.dept_id} className="space-y-3">
                          <h4 className="text-xs font-bold text-[#41493e] flex items-center space-x-2">
                            <GitFork className="w-3.5 h-3.5 text-[#005312]" />
                            <span>{dept.dept_name}</span>
                          </h4>

                          <div className="divide-y divide-[#c0c9bb]/40 border border-[#c0c9bb]/40 rounded-xl overflow-hidden">
                            {dept.candidates.map((cand) => (
                              <div
                                key={cand.id}
                                className="p-3 flex items-center justify-between hover:bg-[#faf9f5] transition-colors"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-9 h-9 rounded-full bg-[#a0f399] text-[#00450d] font-black text-xs flex items-center justify-center border border-[#00450d]">
                                    {cand.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#1b1c1a]">{cand.name}</p>
                                    <p className="text-[11px] text-[#717a6d]">
                                      {cand.party} • Symbol: {cand.symbol}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <p className="text-xs font-extrabold text-[#00450d]">
                                      {cand.votes.toLocaleString()} votes
                                    </p>
                                    <p className="text-[11px] text-[#717a6d]">{cand.percentage}</p>
                                  </div>

                                  {cand.status === 'winner' ? (
                                    <span className="px-2.5 py-1 bg-[#a0f399] text-[#002204] font-bold text-[10px] rounded-full flex items-center space-x-1">
                                      <Award className="w-3 h-3 text-[#00450d]" />
                                      <span>WINNER</span>
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 bg-[#e9e8e4] text-[#41493e] font-bold text-[10px] rounded-full">
                                      RUNNER-UP
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
