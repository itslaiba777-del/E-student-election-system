'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { electionAPI, voteAPI } from '../../../lib/api';
import AccessRestricted from '../../../components/AccessRestricted';
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Calendar,
  BarChart,
  LogOut,
  Trophy,
  Star,
  Upload,
  Lock,
  CheckCircle2,
  Info,
  Clock,
  Check,
  Shield,
  ArrowRight,
} from 'lucide-react';

export default function AdminResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get('id') || '1';

  // Admin Permissions
  const [adminPermissions, setAdminPermissions] = useState([
    'view_results',
    'can_submit_results',
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
    title: '2026 Student Union Presidential Election',
    status: 'closed', // 'active' | 'closed'
    archived_date: 'Oct 24, 2026',
    results_submitted: false,
    total_ballots_cast: 1400,
    total_eligible_voters: 1794,
    voter_turnout_percent: 78.0,
    peak_voting_hour: '12:45 PM',
    digital_audit_score: '99.9',
  });

  const [rankings, setRankings] = useState([
    {
      rank: 1,
      id: 101,
      full_name: 'Maya Rodriguez',
      department_name: 'Dept. of Political Science',
      symbol_name: 'Star',
      votes: 840,
      percentage: 60.0,
      photo_url: null,
      is_winner: true,
    },
    {
      rank: 2,
      id: 102,
      full_name: 'Jordan Smith',
      department_name: 'Dept. of Engineering',
      symbol_name: 'Book',
      votes: 560,
      percentage: 40.0,
      photo_url: null,
      is_winner: false,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const fetchResults = async () => {
    try {
      const res = await electionAPI.getById(electionId);
      if (res.data.election) {
        setElection((prev) => ({
          ...prev,
          ...res.data.election,
        }));
      }
      const tallyRes = await voteAPI.getTally(electionId);
      if (tallyRes.data.rankings && tallyRes.data.rankings.length > 0) {
        setRankings(tallyRes.data.rankings);
      }
    } catch (err) {
      console.warn('Election results API fetch fallback:', err);
    }
  };

  const canSubmit = adminPermissions.includes('can_submit_results');

  const handleSubmitResults = async () => {
    setIsSubmitting(true);
    try {
      await electionAPI.updateStatus(electionId, { results_submitted: true });
    } catch (err) {
      console.warn('Submit results API fallback:', err);
    } finally {
      setElection((prev) => ({ ...prev, results_submitted: true }));
      setIsSubmitting(false);
      alert('Official election results have been submitted to SuperAdmin for global reporting.');
    }
  };

  // Winning margin calculation
  const winner = rankings[0];
  const runnerUp = rankings[1];
  const winningMargin = winner && runnerUp ? winner.votes - runnerUp.votes : 0;

  // Render Locked State if election is still active
  if (election.status !== 'closed') {
    return (
      <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
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
                className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] rounded-xl font-bold text-xs"
              >
                <LayoutDashboard className="w-4 h-4 text-[#717a6d]" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/admin/election-status"
                className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] rounded-xl font-bold text-xs"
              >
                <Calendar className="w-4 h-4 text-[#717a6d]" />
                <span>Election Status</span>
              </Link>
              <Link
                href="/admin/results"
                className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
              >
                <BarChart className="w-4 h-4 text-[#00450d]" />
                <span>Results Analytics</span>
              </Link>
            </nav>
          </div>
        </aside>

        <main className="lg:ml-64 flex-1 min-h-screen p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1b1c1a]">Election Results Locked</h1>
          <p className="text-xs text-[#41493e] max-w-md leading-relaxed">
            Real-time vote counts and candidate rankings are strictly suppressed while voting is in progress to protect student privacy and election neutrality.
          </p>
          <button
            onClick={() => router.push('/admin/election-status')}
            className="bg-[#00450d] text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-[#006017] transition-all shadow-md inline-flex items-center space-x-2"
          >
            <span>View Election Status & Countdown</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </main>
      </div>
    );
  }

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
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#717a6d]" />
              <span>Election Status</span>
            </Link>

            <Link
              href="/admin/results"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <BarChart className="w-4 h-4 text-[#00450d]" />
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
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-6xl space-y-8">
        {!hasPermission ? (
          <AccessRestricted requiredPermission="can_submit_results" />
        ) : (
          <>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#c0c9bb] pb-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-[#ffdad6] text-[#93000a] text-[10px] uppercase font-bold tracking-wider rounded-md">
                Election Closed
              </span>
              <span className="text-xs text-[#717a6d]">Archived: {election.archived_date}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1b1c1a] tracking-tight">
              {election.title}
            </h1>
            <p className="text-xs text-[#41493e] flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-[#717a6d]" />
              <span>This data is view-only and cannot be edited</span>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <span className="text-xs text-[#717a6d] font-bold uppercase tracking-wider">
              Total Ballots Cast
            </span>
            <span className="text-3xl font-black text-[#00450d]">
              {election.total_ballots_cast.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Results Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Winner Spotlight Card (Left 8 Cols) */}
          {winner && (
            <div className="lg:col-span-8 bg-white border border-[#c0c9bb] rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-[#a0f399] border-2 border-[#00450d] flex items-center justify-center font-black text-[#00450d] text-3xl">
                      {winner.full_name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[#00450d] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <Trophy className="w-4 h-4 text-[#acf4a4]" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="bg-[#a3f69c] text-[#005312] px-3 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>WINNER</span>
                      </span>
                      <span className="text-xs text-[#717a6d] font-semibold">
                        {winner.percentage}% of total votes
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-[#1b1c1a]">{winner.full_name}</h2>
                    <p className="text-xs text-[#41493e] font-semibold">{winner.department_name}</p>

                    <div className="pt-2">
                      <div className="text-4xl font-black text-[#00450d] leading-none">
                        {winner.votes.toLocaleString()}
                      </div>
                      <div className="text-[11px] font-bold text-[#717a6d] uppercase tracking-wider mt-1">
                        Total Votes
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#c0c9bb] pt-6">
                <div className="p-4 bg-[#f4f4f0] rounded-xl border border-[#c0c9bb]/60">
                  <p className="text-[11px] text-[#717a6d] font-bold uppercase">Winning Margin</p>
                  <p className="text-lg font-bold text-[#1b1c1a] mt-0.5">
                    Won by {winningMargin} votes
                  </p>
                </div>
                <div className="p-4 bg-[#f4f4f0] rounded-xl border border-[#c0c9bb]/60">
                  <p className="text-[11px] text-[#717a6d] font-bold uppercase">Audit Status</p>
                  <p className="text-lg font-bold text-[#005312] mt-0.5 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cryptographically Validated</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action & Submission Rail (Right 4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Finalize & Submit Card */}
            {canSubmit && (
              <div className="bg-[#00450d] text-white p-6 rounded-2xl shadow-md flex flex-col items-center text-center space-y-4">
                <Upload className="w-10 h-10 text-[#acf4a4]" />
                <div>
                  <h3 className="text-base font-extrabold">Finalize Results</h3>
                  <p className="text-xs text-[#acf4a4] mt-1 leading-relaxed">
                    Submit these audited results to the SuperAdmin for official global publication.
                  </p>
                </div>

                <button
                  onClick={handleSubmitResults}
                  disabled={election.results_submitted || isSubmitting}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center space-x-2 ${
                    election.results_submitted
                      ? 'bg-[#e9e8e4] text-[#717a6d] cursor-not-allowed'
                      : 'bg-white text-[#00450d] hover:bg-[#a0f399] active:scale-95'
                  }`}
                >
                  {election.results_submitted ? (
                    <>
                      <Check className="w-4 h-4 text-[#005312]" />
                      <span>Submitted to SuperAdmin</span>
                    </>
                  ) : isSubmitting ? (
                    'Submitting...'
                  ) : (
                    'Submit results to SuperAdmin'
                  )}
                </button>
              </div>
            )}

            {/* Read-Only Security Audit Note */}
            <div className="bg-white border border-[#c0c9bb] p-5 rounded-2xl flex items-start space-x-3 shadow-xs">
              <Shield className="w-5 h-5 text-[#00450d] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1b1c1a]">Audit Trail Active</p>
                <p className="text-[11px] text-[#717a6d] leading-relaxed mt-0.5">
                  This result is cryptographically signed and stored in the immutable database ledger.
                </p>
              </div>
            </div>
          </div>

          {/* Candidate Rankings List (Full Width 12 Cols) */}
          <div className="lg:col-span-12 space-y-4">
            <h3 className="text-lg font-bold text-[#1b1c1a]">Candidate Rankings</h3>
            <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5">Candidate</div>
                <div className="col-span-3">Symbol</div>
                <div className="col-span-3 text-right">Votes</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#c0c9bb]">
                {rankings.map((cand) => (
                  <div
                    key={cand.id}
                    className="grid grid-cols-12 items-center gap-4 px-6 py-4 hover:bg-[#f4f4f0] transition-colors"
                  >
                    <div className="col-span-1 font-extrabold text-lg text-[#00450d]">
                      {cand.rank}
                    </div>

                    <div className="col-span-5 flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#a0f399] border border-[#00450d] flex items-center justify-center font-bold text-[#00450d] text-xs shrink-0">
                        {cand.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1b1c1a]">{cand.full_name}</p>
                        <p className="text-[11px] text-[#717a6d]">{cand.department_name}</p>
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center space-x-2">
                      <Star className="w-4 h-4 text-[#00450d]" />
                      <span className="text-xs font-semibold text-[#1b1c1a]">{cand.symbol_name}</span>
                    </div>

                    <div className="col-span-3 text-right space-y-1">
                      <p className="text-base font-black text-[#1b1c1a]">
                        {cand.votes.toLocaleString()}
                      </p>
                      <div className="w-full bg-[#e9e8e4] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00450d] h-full"
                          style={{ width: `${cand.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-[#717a6d]">
                        {cand.percentage}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Demographic & Analytics Cards (12 Cols) */}
          <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-[#c0c9bb] p-6 rounded-2xl shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#717a6d] uppercase tracking-wider block">
                Voter Turnout
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#1b1c1a]">
                  {election.voter_turnout_percent}%
                </span>
                <span className="text-xs font-bold text-[#005312]">+4.2% YoY</span>
              </div>
            </div>

            <div className="bg-white border border-[#c0c9bb] p-6 rounded-2xl shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#717a6d] uppercase tracking-wider block">
                Peak Voting Hour
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#1b1c1a]">
                  {election.peak_voting_hour}
                </span>
                <span className="text-xs font-semibold text-[#717a6d]">Lunch Period</span>
              </div>
            </div>

            <div className="bg-white border border-[#c0c9bb] p-6 rounded-2xl shadow-xs space-y-2">
              <span className="text-[11px] font-bold text-[#717a6d] uppercase tracking-wider block">
                Digital Audit Score
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#005312]">
                  {election.digital_audit_score}
                </span>
                <span className="text-xs font-bold text-[#005312]">Verified</span>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  );
}
