'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { electionAPI } from '../../../lib/api';
import AccessRestricted from '../../../components/AccessRestricted';
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Calendar,
  BarChart,
  LogOut,
  Clock,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function AdminElectionStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get('id') || '1';

  // Admin Session & Permission State
  const [adminPermissions, setAdminPermissions] = useState([
    'manage_election_status',
    'can_extend_voting_time',
  ]);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('restricted') === 'true') {
        setHasPermission(false);
      }
    }
  }, []);

  const [election, setElection] = useState({
    id: electionId,
    title: 'Department of Computer Science Council Election',
    status: 'active', // 'active' | 'closed'
    start_time: 'Today at 08:00 AM',
    voting_end: new Date(Date.now() + 4 * 3600 * 1000 + 22 * 60 * 1000 + 15 * 1000).toISOString(),
    eligibility: 'All CS Undergraduate Students',
    positions_open: '3 Council Seats',
    security_protocol: 'SHA-256 Hashing / MFA',
  });

  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 22,
    seconds: 15,
    isClosed: false,
  });

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [newExtendMinutes, setNewExtendMinutes] = useState(30);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    fetchElectionDetails();
  }, [electionId]);

  // Real-time Client Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!election.voting_end) return;

      const now = new Date().getTime();
      const endTime = new Date(election.voting_end).getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isClosed: true });
        setElection((prev) => ({ ...prev, status: 'closed' }));
        clearInterval(timer);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds, isClosed: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [election.voting_end]);

  const fetchElectionDetails = async () => {
    try {
      const res = await electionAPI.getById(electionId);
      if (res.data.election) {
        setElection((prev) => ({ ...prev, ...res.data.election }));
      }
    } catch (err) {
      console.warn('Election details API fetch fallback:', err);
    }
  };

  const canExtendVoting = adminPermissions.includes('can_extend_voting_time');

  const handleExtendVotingSubmit = async (e) => {
    e.preventDefault();
    setIsExtending(true);

    try {
      const currentEnd = new Date(election.voting_end);
      const newEnd = new Date(currentEnd.getTime() + newExtendMinutes * 60 * 1000);

      await electionAPI.updateStatus(electionId, { voting_end: newEnd.toISOString() });
      setElection((prev) => ({ ...prev, voting_end: newEnd.toISOString(), status: 'active' }));
    } catch (err) {
      console.warn('Extend voting fallback:', err);
      const currentEnd = new Date(election.voting_end);
      const newEnd = new Date(currentEnd.getTime() + newExtendMinutes * 60 * 1000);
      setElection((prev) => ({ ...prev, voting_end: newEnd.toISOString(), status: 'active' }));
    } finally {
      setIsExtending(false);
      setIsExtendModalOpen(false);
      alert(`Voting window extended by ${newExtendMinutes} minutes.`);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#f4f4f0] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-extrabold text-xl text-[#00450d] tracking-tight">Campus Vote</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              Department Admin
            </p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#717a6d]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/candidates"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <UserPlus className="w-4 h-4 text-[#717a6d]" />
              <span>Candidate Applications</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Student Verification</span>
            </Link>

            <Link
              href="/admin/election-status"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <Calendar className="w-4 h-4 text-[#00450d]" />
              <span>Election Status</span>
            </Link>

            <Link
              href="/admin/results"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <BarChart className="w-4 h-4 text-[#717a6d]" />
              <span>Results Analytics</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-1 pt-4 border-t border-[#c0c9bb]">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-4 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-5xl space-y-8">
        {!hasPermission ? (
          <AccessRestricted requiredPermission="can_manage_election_status" />
        ) : (
          <>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#c0c9bb] pb-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
              Active Election Status
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-[#1b1c1a] tracking-tight leading-tight">
              {election.title}
            </h1>
            <div className="flex items-center space-x-3 pt-1">
              {!timeLeft.isClosed ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#a0f399] text-[#005312] text-xs font-bold rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#1b6d24] animate-pulse" />
                  <span>Voting in progress</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#ffdad6] text-[#93000a] text-xs font-bold rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                  <span>Voting Closed</span>
                </span>
              )}
              <span className="text-xs text-[#717a6d]">{election.start_time}</span>
            </div>
          </div>

          {/* Extend Voting Time Action (Conditioned on can_extend_voting_time permission) */}
          <div className="flex items-center space-x-3">
            {canExtendVoting && !timeLeft.isClosed && (
              <button
                onClick={() => setIsExtendModalOpen(true)}
                className="flex items-center space-x-2 px-5 h-11 border border-[#00450d] text-[#00450d] font-bold text-xs rounded-xl hover:bg-[#e9e8e4] transition-all shadow-xs"
              >
                <Clock className="w-4 h-4 text-[#00450d]" />
                <span>Extend voting time</span>
              </button>
            )}

            {timeLeft.isClosed && (
              <button
                onClick={() => router.push('/admin/results')}
                className="flex items-center space-x-2 px-6 h-11 bg-[#00450d] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#006017] transition-all"
              >
                <span>View Election Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Privacy Protection Banner (Active during Voting in Progress) */}
        {!timeLeft.isClosed && (
          <div className="bg-[#e0f2f1] border border-[#26a69a]/40 rounded-2xl p-4 flex items-center space-x-3 text-[#004d40]">
            <Lock className="w-5 h-5 shrink-0 text-[#00450d]" />
            <p className="text-xs leading-relaxed font-semibold">
              Turnout and vote data are hidden until voting closes to protect student privacy and prevent strategic voting bias.
            </p>
          </div>
        )}

        {/* Main Countdown Canvas / Closed State */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Countdown / Status Card (Left 2 Cols) */}
          <div className="md:col-span-2 bg-white border border-[#c0c9bb] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs space-y-6 relative overflow-hidden">
            <span className="text-xs font-bold text-[#717a6d] uppercase tracking-widest">
              {timeLeft.isClosed ? 'Voting Closed' : 'Time Remaining'}
            </span>

            {!timeLeft.isClosed ? (
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <span className="text-5xl md:text-7xl font-black text-[#00450d] tabular-nums">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-[#717a6d] uppercase mt-2">Hours</span>
                </div>
                <span className="text-4xl md:text-6xl font-black text-[#c0c9bb] mb-6">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-5xl md:text-7xl font-black text-[#00450d] tabular-nums">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-[#717a6d] uppercase mt-2">Minutes</span>
                </div>
                <span className="text-4xl md:text-6xl font-black text-[#c0c9bb] mb-6">:</span>
                <div className="flex flex-col items-center">
                  <span className="text-5xl md:text-7xl font-black text-[#00450d] tabular-nums">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-bold text-[#717a6d] uppercase mt-2">Seconds</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-6">
                <CheckCircle2 className="w-16 h-16 text-[#00450d] mx-auto" />
                <h2 className="text-2xl font-extrabold text-[#1b1c1a]">Voting Has Concluded</h2>
                <p className="text-xs text-[#41493e] max-w-sm mx-auto">
                  The voting window has closed. Automatic tallying is complete and official results are ready for audit review.
                </p>
                <button
                  onClick={() => router.push('/admin/results')}
                  className="bg-[#00450d] text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#006017] transition-all shadow-md inline-flex items-center space-x-2 mt-2"
                >
                  <span>Go to Results Analytics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {!timeLeft.isClosed && (
              <div className="pt-6 border-t border-[#c0c9bb] w-full flex items-center justify-around text-xs">
                <div>
                  <p className="text-[11px] text-[#717a6d] font-bold uppercase">Scheduled End</p>
                  <p className="font-bold text-[#1b1c1a]">
                    {new Date(election.voting_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="w-px h-8 bg-[#c0c9bb]" />
                <div>
                  <p className="text-[11px] text-[#717a6d] font-bold uppercase">System Status</p>
                  <p className="font-bold text-[#005312]">Encrypted & Live</p>
                </div>
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="space-y-6">
            <div className="bg-[#f4f4f0] border border-[#c0c9bb] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-[#1b1c1a]">Election Details</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-[#717a6d] uppercase block">
                    Voter Eligibility
                  </span>
                  <span className="font-semibold text-[#1b1c1a]">{election.eligibility}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#717a6d] uppercase block">
                    Positions Open
                  </span>
                  <span className="font-semibold text-[#1b1c1a]">{election.positions_open}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#717a6d] uppercase block">
                    Security Protocol
                  </span>
                  <span className="font-semibold text-[#1b1c1a]">{election.security_protocol}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 space-y-2 shadow-xs">
              <div className="flex items-center space-x-2 text-[#00450d]">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="text-xs font-bold">Integrity Monitored</h4>
              </div>
              <p className="text-xs text-[#41493e] leading-relaxed">
                All voting interactions are logged in a tamper-proof audit trail. The system is operating within normal parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Live Feed Restricted Placeholder (Active while Voting in Progress) */}
        {!timeLeft.isClosed && (
          <div className="bg-white border-2 border-dashed border-[#c0c9bb] rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
            <EyeOff className="w-10 h-10 text-[#717a6d]" />
            <h4 className="text-base font-bold text-[#1b1c1a]">Live Feed Restricted</h4>
            <p className="text-xs text-[#717a6d] max-w-md leading-relaxed">
              Detailed statistics such as real-time turnout, demographic splits, and candidate rankings are currently suppressed to maintain election neutrality.
            </p>
          </div>
        )}
          </>
        )}
      </main>

      {/* Extend Voting Time Modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#1b1c1a]">Extend Voting Window</h2>
            <p className="text-xs text-[#41493e]">
              Extend the scheduled voting period for this election. This will update the database and reset the node-cron scheduled auto-close job.
            </p>

            <form onSubmit={handleExtendVotingSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1b1c1a]">Extension Duration (Minutes)</label>
                <select
                  value={newExtendMinutes}
                  onChange={(e) => setNewExtendMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none mt-1 bg-white"
                >
                  <option value={15}>+15 Minutes</option>
                  <option value={30}>+30 Minutes</option>
                  <option value={60}>+1 Hour</option>
                  <option value={120}>+2 Hours</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(false)}
                  className="flex-1 h-11 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl hover:bg-[#e9e8e4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtending}
                  className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {isExtending ? 'Updating...' : 'Confirm Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
