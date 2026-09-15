'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import StudentSidebar from '../../../components/StudentSidebar';
import { electionAPI } from '../../../lib/api';
import {
  Trophy,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Vote,
  Sparkles,
  Users,
  ChevronLeft,
  Crown,
} from 'lucide-react';

export default function ElectionResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get('election_id') || '1';

  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {}
    }
    fetchResults();
  }, [electionId]);

  const fetchResults = async () => {
    try {
      const res = await electionAPI.getResults(electionId);
      setResultsData(res.data);
    } catch (err) {
      console.warn('Fetch results error:', err);
      const errMsg = err.response?.data?.message || 'Results are hidden or voting is still active.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const isUserWinner =
    currentUser &&
    resultsData?.winner &&
    resultsData.winner.candidate_name.toLowerCase().trim() === currentUser.full_name?.toLowerCase().trim();

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <button
              onClick={() => router.push('/student/dashboard')}
              className="inline-flex items-center space-x-1.5 text-xs text-[#00450d] font-bold hover:underline mb-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a]">
              Official Election Results
            </h1>
            <p className="text-xs text-[#717a6d]">
              Verified final vote counts and winner announcements.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-[#00450d] text-white text-xs font-bold rounded-full uppercase tracking-wider flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#a0f399]" />
              <span>ELECTION CLOSED & VERIFIED</span>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#717a6d]">Loading verified election results...</div>
        ) : error ? (
          <div className="bg-[#ffdad6] border border-[#ffb4ab] text-[#410002] p-6 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-[#ba1a1a]" />
              <span>Results Unavailable</span>
            </div>
            <p className="text-xs">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* WINNER CONGRATULATIONS BANNER (Shown if current candidate won!) */}
            {isUserWinner && (
              <div className="bg-gradient-to-r from-[#00450d] via-[#006017] to-[#1b6d24] text-white p-8 rounded-3xl shadow-xl relative overflow-hidden space-y-4 border-2 border-[#a0f399]">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Trophy className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center space-x-2 bg-[#a0f399] text-[#005312] px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>WINNER ANNOUNCEMENT</span>
                  </div>

                  <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                    🎉 Congratulations, {currentUser.full_name}! You Won!
                  </h2>

                  <p className="text-xs md:text-sm text-[#acf4a4] max-w-2xl leading-relaxed">
                    You secured the highest number of votes in the{' '}
                    <span className="font-bold text-white">{resultsData.election.title}</span> with a victory margin of{' '}
                    <span className="font-bold text-white">{resultsData.victory_margin} votes</span>.
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/20 grid grid-cols-3 gap-4 text-center max-w-md">
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                    <span className="text-[10px] text-[#acf4a4] font-bold uppercase">Your Votes</span>
                    <p className="text-xl font-black text-white">{resultsData.winner.vote_count}</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                    <span className="text-[10px] text-[#acf4a4] font-bold uppercase">Vote Share</span>
                    <p className="text-xl font-black text-white">{resultsData.winner.percentage}%</p>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                    <span className="text-[10px] text-[#acf4a4] font-bold uppercase">Lead Margin</span>
                    <p className="text-xl font-black text-white">+{resultsData.victory_margin}</p>
                  </div>
                </div>
              </div>
            )}

            {/* General Winner Highlight Card */}
            {resultsData.winner && !isUserWinner && (
              <div className="bg-white border-2 border-[#a0f399] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-[#a0f399] text-[#005312] flex items-center justify-center shrink-0 shadow-md">
                    <Crown className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-[#005312] bg-[#a0f399] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      ELECTION WINNER
                    </span>
                    <h2 className="text-xl font-black text-[#1b1c1a] mt-1">
                      {resultsData.winner.candidate_name}
                    </h2>
                    <p className="text-xs text-[#717a6d]">
                      {resultsData.winner.party || 'Independent'} • {resultsData.winner.vote_count} Votes ({resultsData.winner.percentage}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-[#faf9f5] p-4 rounded-xl border border-[#c0c9bb]/60 text-center">
                  <div>
                    <span className="text-[10px] text-[#717a6d] font-bold uppercase">Total Cast</span>
                    <p className="text-base font-extrabold text-[#1b1c1a]">{resultsData.total_votes_cast}</p>
                  </div>
                  <div className="w-px h-8 bg-[#c0c9bb]" />
                  <div>
                    <span className="text-[10px] text-[#717a6d] font-bold uppercase">Winning Margin</span>
                    <p className="text-base font-extrabold text-[#005312]">+{resultsData.victory_margin} votes</p>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Standings Breakdown */}
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1b1c1a] uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#00450d]" />
                <span>Candidate Votes & Standings</span>
              </h3>

              <div className="space-y-4">
                {resultsData.results.map((cand, idx) => (
                  <div
                    key={cand.candidate_id}
                    className={`p-4 rounded-xl border transition-all ${
                      cand.is_winner
                        ? 'border-[#a0f399] bg-[#e8f5e9]/40'
                        : 'border-[#c0c9bb]/60 bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#f4f4f0] border border-[#c0c9bb] flex items-center justify-center font-extrabold text-xs text-[#1b1c1a] shrink-0">
                          #{idx + 1}
                        </div>

                        {cand.photo_url ? (
                          <img
                            src={cand.photo_url}
                            alt={cand.candidate_name}
                            className="w-10 h-10 rounded-full object-cover border border-[#c0c9bb]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#e9e8e4] text-[#717a6d] flex items-center justify-center font-bold text-xs">
                            {cand.candidate_name.charAt(0)}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-bold text-[#1b1c1a]">{cand.candidate_name}</h4>
                            {cand.is_winner && (
                              <span className="px-2 py-0.5 bg-[#a0f399] text-[#005312] text-[9px] font-black rounded-full uppercase">
                                WON
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#717a6d]">{cand.party || 'Independent Candidate'}</p>
                        </div>
                      </div>

                      {/* Vote Stats & Progress Bar */}
                      <div className="flex items-center space-x-4 sm:justify-end">
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#1b1c1a]">{cand.vote_count} votes</span>
                          <p className="text-[10px] text-[#717a6d]">{cand.percentage}% share</p>
                        </div>

                        <div className="w-24 h-2 bg-[#e9e8e4] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cand.is_winner ? 'bg-[#00450d]' : 'bg-[#717a6d]'}`}
                            style={{ width: `${cand.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
