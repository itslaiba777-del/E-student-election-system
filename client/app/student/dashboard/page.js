'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import StudentSidebar from '../../../components/StudentSidebar';
import FaceCapture from '../../../components/FaceCapture';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Mail,
  X,
  Award,
  User,
  Building2,
  CreditCard,
  FileCheck,
  Check,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function StudentDashboardPage() {
  const router = useRouter();

  // Student Profile State
  const [student, setStudent] = useState({
    id: 1,
    full_name: 'Hamza Ahmed',
    email: 'hamza@student.edu.pk',
    cnic: '35202-1234567-1',
    registration_number: 'FA21-BCS-042',
    department_name: 'Computer Science',
    university_name: 'COMSATS University',
    photo_url: '',
    has_voted: false,
  });

  // Active Election & Candidate States
  const [activeElection, setActiveElection] = useState(null);
  const [approvedCandidates, setApprovedCandidates] = useState([]);

  const [hasVoted, setHasVoted] = useState(false);

  // Voting 2FA Step Modals: null | 'otp' | 'face' | 'ballot'
  const [votingStep, setVotingStep] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setStudent((prev) => ({
          ...prev,
          ...parsed,
          id: parsed.id || prev.id,
          full_name: parsed.full_name || parsed.name || prev.full_name,
          father_name: parsed.father_name || prev.father_name || 'Muhammad Akram',
          mobile_number: parsed.mobile_number || prev.mobile_number || '03096932637',
          email: parsed.email || prev.email,
          profile_image_url: parsed.profile_image_url || parsed.photo_url || prev.profile_image_url,
          photo_url: parsed.profile_image_url || parsed.photo_url || prev.photo_url,
        }));
      } catch (e) {}
    }

    try {
      // Fetch profile from backend
      const res = await axios.get(`${API_BASE_URL}/students/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.student) {
        const fetched = res.data.student;
        setStudent((prev) => ({
          ...prev,
          ...fetched,
          father_name: fetched.father_name || prev.father_name || 'Muhammad Akram',
          mobile_number: fetched.mobile_number || prev.mobile_number || '03096932637',
          profile_image_url: fetched.profile_image_url || fetched.photo_url || prev.profile_image_url,
          photo_url: fetched.profile_image_url || fetched.photo_url || prev.photo_url,
        }));
        if (fetched.has_voted) {
          setHasVoted(true);
        }
      }
    } catch (e) {}

    try {
      // Fetch active elections
      const elecRes = await axios.get(`${API_BASE_URL}/elections`);
      if (elecRes.data?.elections) {
        if (elecRes.data.elections.length > 0) {
          const active = elecRes.data.elections[0];
          setActiveElection(active);
          fetchApprovedCandidates(active.id);
          checkVoterStatus(active.id, token);
        } else {
          setActiveElection(null);
          setApprovedCandidates([]);
        }
      }
    } catch (e) {
      setActiveElection(null);
      setApprovedCandidates([]);
    }
  };

  const fetchApprovedCandidates = async (electionId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/candidates/election/${electionId}?status=approved`);
      if (res.data?.candidates) {
        setApprovedCandidates(res.data.candidates);
      }
    } catch (e) {
      setApprovedCandidates([]);
    }
  };

  const checkVoterStatus = async (electionId, token) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/votes/status/${electionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.has_voted) {
        setHasVoted(true);
      }
    } catch (e) {}
  };

  const isElectionLive = (elec) => {
    if (!elec) return false;
    const now = new Date();
    const statusStr = (elec.calculated_status || elec.status || '').toLowerCase();
    if (statusStr === 'active' || statusStr === 'live' || statusStr === 'ongoing') {
      return true;
    }
    if (elec.voting_start && elec.voting_end) {
      const start = new Date(elec.voting_start);
      const end = new Date(elec.voting_end);
      if (now >= start && now <= end) return true;
    }
    return false;
  };

  // Step 1: Trigger Real 2FA Voting Flow
  const handleStartVotingFlow = () => {
    if (hasVoted || !activeElection) return;
    router.push(`/student/verify-otp?election_id=${activeElection.id}`);
  };

  // Step 2: Verify OTP -> Proceed to Face Scan
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode.length < 6) return;
    setVotingStep('face');
  };

  // Step 3: Face Scan Captured -> Open Approved Candidates Ballot
  const handleFaceCaptured = (imageSrc) => {
    setVotingStep('ballot');
  };

  // Step 4: Cast Vote
  const handleCastVote = async (candidateId) => {
    setSelectedCandidate(candidateId);
    setSubmittingVote(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/votes/cast`,
        { election_id: activeElection.id, candidate_id: candidateId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHasVoted(true);
      setVotingStep(null);
      alert('Vote Cast Successfully! Your vote has been officially recorded in the database.');
    } catch (err) {
      console.error('Cast vote error:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit vote. Please try again.';
      alert(`Vote Error: ${errMsg}`);
    } finally {
      setSubmittingVote(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-5xl overflow-x-hidden">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] tracking-tight">
              Student Profile & Voting Portal
            </h1>
            <p className="text-xs text-[#717a6d] mt-1">
              {student.university_name || 'E-Election System'} — {student.department_name}
            </p>
          </div>

          <div>
            {hasVoted ? (
              <span className="px-4 py-2 bg-[#e8f5e9] text-[#005312] border border-[#a0f399] rounded-xl font-extrabold text-xs flex items-center space-x-1.5 shadow-2xs">
                <Lock className="w-4 h-4 text-[#005312]" />
                <span>VOTE CAST — BALLOT LOCKED</span>
              </span>
            ) : (
              <span className="px-4 py-2 bg-[#a0f399] text-[#005312] rounded-xl font-extrabold text-xs flex items-center space-x-1.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#005312]" />
                <span>ACTIVE VOTER</span>
              </span>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------
            SECTION 1: COMPREHENSIVE STUDENT / VOTER PROFILE CARD
        ------------------------------------------------------------- */}
        <div className="bg-white border border-[#c0c9bb] rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-[#c0c9bb] pb-6">
            {/* Captured Profile Picture */}
            <div className="relative shrink-0 text-center">
              {student.profile_image_url || student.photo_url ? (
                <img
                  src={
                    (student.profile_image_url || student.photo_url).startsWith('http') ||
                    (student.profile_image_url || student.photo_url).startsWith('data:')
                      ? (student.profile_image_url || student.photo_url)
                      : `http://localhost:5000${student.profile_image_url || student.photo_url}`
                  }
                  alt={student.full_name}
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-[#00450d] shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-[#00450d] text-white flex flex-col items-center justify-center font-bold shadow-md">
                  <User className="w-12 h-12 mb-1 text-[#a0f399]" />
                  <span className="text-[11px]">No Photo</span>
                </div>
              )}
              <span className="mt-2 inline-flex items-center space-x-1 bg-[#00450d] text-white text-[10px] font-black px-3 py-1 rounded-full shadow">
                <ShieldCheck className="w-3.5 h-3.5 text-[#a0f399]" />
                <span className="uppercase">{student.user_role || student.role || 'VOTER'}</span>
              </span>
            </div>

            {/* General Header Details */}
            <div className="flex-1 text-center md:text-left space-y-2 w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-black text-[#00450d]">{student.full_name || 'Student Profile'}</h2>
                  <p className="text-xs font-semibold text-[#717a6d] mt-0.5">{student.email || 'N/A'}</p>
                </div>
                <span className="self-center md:self-start px-3.5 py-1 bg-[#e8f5e9] text-[#005312] border border-[#a0f399] text-xs font-extrabold rounded-full uppercase">
                  {student.status || 'VERIFIED ACTIVE'}
                </span>
              </div>

              <p className="text-xs text-[#41493e] font-bold pt-1">
                {student.university_name || 'COMSATS University Islamabad'}
              </p>
            </div>
          </div>

          {/* Detailed Student Information Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#00450d] mb-4 flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-[#005312]" />
              <span>Personal & Academic Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Father Name</span>
                <p className="text-xs font-bold text-[#1b1c1a]">{student.father_name || 'N/A'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Registration Number</span>
                <p className="text-xs font-mono font-black text-[#00450d]">{student.registration_number || 'N/A'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">CNIC Number</span>
                <p className="text-xs font-mono font-bold text-[#1b1c1a]">{student.cnic || 'N/A'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Email Address</span>
                <p className="text-xs font-semibold text-[#1b1c1a] truncate">{student.email || 'N/A'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Mobile Number</span>
                <p className="text-xs font-bold text-[#1b1c1a]">{student.mobile_number || 'N/A'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Department</span>
                <p className="text-xs font-bold text-[#1b1c1a]">{student.department_name || 'Computer Science Department'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Degree / Program</span>
                <p className="text-xs font-bold text-[#1b1c1a]">{student.program_name || student.department_name || 'BS Computer Science'}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Batch & Semester</span>
                <p className="text-xs font-bold text-[#1b1c1a]">
                  {student.batch || '2022-2026'} ({student.semester || '6th Semester'})
                </p>
              </div>

              <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Voting Eligibility Status</span>
                <p className="text-xs font-extrabold text-[#005312]">
                  {hasVoted ? 'Vote Cast Successfully' : 'Eligible Voter'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            SECTION 2: LIVE ELECTION BANNER & VOTING ACTION
        ------------------------------------------------------------- */}
        {activeElection && isElectionLive(activeElection) ? (
          <section className="space-y-4">
            <div className="bg-[#00450d] text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="bg-[#a0f399] text-[#005312] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    LIVE ELECTION BALLOT
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold tracking-tight mt-2">
                    {activeElection.title}
                  </h3>
                  <p className="text-xs text-[#acf4a4] mt-1">
                    Contesting Seat: <strong className="text-white">{activeElection.position_title || 'President'}</strong>
                  </p>
                </div>

                {hasVoted ? (
                  <div className="bg-white/10 backdrop-blur-xs border border-[#a0f399] px-6 py-3 rounded-2xl text-center shrink-0">
                    <Lock className="w-6 h-6 text-[#a0f399] mx-auto mb-1" />
                    <span className="text-xs font-extrabold text-[#a0f399] block">BALLOT LOCKED</span>
                    <span className="text-[10px] text-white/80">Vote Cast</span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartVotingFlow}
                    className="bg-[#a0f399] hover:bg-[#86e87f] text-[#00450d] px-6 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 shrink-0"
                  >
                    <Vote className="w-5 h-5" />
                    <span>Cast Vote / Open Ballot</span>
                  </button>
                )}
              </div>

              {hasVoted && (
                <div className="p-4 bg-white/10 rounded-xl text-xs text-white border border-white/20">
                  ✅ Your vote has been securely recorded for the {activeElection.position_title} position. Candidate list is locked for your profile. Election results will be published once voting ends.
                </div>
              )}
            </div>
          </section>
        ) : activeElection ? (
          <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#f4f4f0] text-[#00450d] flex items-center justify-center mx-auto mb-2 border border-[#c0c9bb]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#00450d] text-base">Election Schedule: {activeElection.title}</h3>
            <p className="text-xs text-[#717a6d] max-w-md mx-auto leading-relaxed">
              Live election ballot box is currently <strong className="text-[#ba1a1a]">INACTIVE</strong>. It will automatically activate when live voting opens on{' '}
              <strong className="text-[#00450d]">
                {activeElection.voting_start ? new Date(activeElection.voting_start).toLocaleString() : 'Scheduled Voting Date'}
              </strong>.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#f4f4f0] text-[#00450d] flex items-center justify-center mx-auto mb-2 border border-[#c0c9bb]">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-[#00450d] text-base">No Active Elections Currently</h3>
            <p className="text-xs text-[#717a6d] max-w-md mx-auto leading-relaxed">
              There are no live elections scheduled at this moment. You will be notified when a new election is announced.
            </p>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL 1: OTP VERIFICATION BEFORE VOTING
        ------------------------------------------------------------- */}
        {votingStep === 'otp' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#c0c9bb] space-y-4">
              <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
                <h3 className="text-base font-extrabold text-[#00450d]">Step 1: OTP Verification</h3>
                <button onClick={() => setVotingStep(null)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                  <X className="w-5 h-5 text-[#717a6d]" />
                </button>
              </div>

              <p className="text-xs text-[#41493e]">{otpMessage}</p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1b1c1a] text-center mb-1">
                    Enter 6-Digit Voting OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center text-xl tracking-widest py-2.5 bg-[#f4f4f0] border border-[#00450d] rounded-xl font-mono text-[#00450d] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Verify OTP & Proceed to Face Scan ➔
                </button>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL 2: BIOMETRIC FACE SCAN BEFORE VOTING
        ------------------------------------------------------------- */}
        {votingStep === 'face' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#c0c9bb] space-y-4">
              <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
                <h3 className="text-base font-extrabold text-[#00450d]">Step 2: Biometric Face Scan</h3>
                <button onClick={() => setVotingStep(null)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                  <X className="w-5 h-5 text-[#717a6d]" />
                </button>
              </div>

              <p className="text-xs text-[#41493e] text-center">
                Look straight into the camera to authenticate facial biometrics before unlocking ballot.
              </p>

              <FaceCapture
                label="Scan Face to Unlock Election Candidates Ballot"
                onCapture={handleFaceCaptured}
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL 3: APPROVED CANDIDATES BALLOT LIST & CAST VOTE
        ------------------------------------------------------------- */}
        {votingStep === 'ballot' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-[#c0c9bb] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#c0c9bb] pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-[#00450d]">Approved Candidates Ballot</h3>
                  <p className="text-xs text-[#717a6d]">Select candidate to cast your vote for {activeElection.position_title}</p>
                </div>
                <button onClick={() => setVotingStep(null)} className="p-2 rounded-full hover:bg-[#e9e8e4]">
                  <X className="w-5 h-5 text-[#1b1c1a]" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="p-5 border-2 border-[#c0c9bb] hover:border-[#00450d] rounded-2xl bg-[#faf9f5] space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        {cand.photo_url ? (
                          <img
                            src={cand.photo_url}
                            alt={cand.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00450d]"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-[#00450d] text-white flex items-center justify-center font-bold text-lg">
                            {cand.name.charAt(0)}
                          </div>
                        )}

                        <div className="flex-1">
                          <h4 className="text-sm font-extrabold text-[#1b1c1a]">{cand.name}</h4>
                          <span className="text-[10px] font-extrabold text-[#005312] bg-[#a0f399] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                            {cand.party || 'Independent'}
                          </span>
                        </div>

                        {cand.symbol_image_url && (
                          <img
                            src={cand.symbol_image_url}
                            alt="Election Symbol"
                            className="w-12 h-12 object-contain rounded-lg border border-[#c0c9bb] bg-white p-1"
                            title="Election Symbol"
                          />
                        )}
                      </div>

                      <p className="text-xs text-[#41493e] leading-relaxed bg-white p-3 rounded-xl border border-[#c0c9bb]/60">
                        "{cand.manifesto || 'No manifesto provided.'}"
                      </p>
                    </div>

                    <button
                      onClick={() => handleCastVote(cand.id)}
                      disabled={submittingVote}
                      className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95"
                    >
                      <Vote className="w-4 h-4" />
                      <span>{submittingVote && selectedCandidate === cand.id ? 'Casting Vote...' : `Vote for ${cand.name}`}</span>
                    </button>
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
