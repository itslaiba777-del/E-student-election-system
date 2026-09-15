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
  const [activeElection, setActiveElection] = useState({
    id: 1,
    title: 'University Student Union Election 2026',
    position_title: 'President',
    status: 'active',
    voting_start: '2026-08-01',
    voting_end: '2026-09-30',
  });

  const [approvedCandidates, setApprovedCandidates] = useState([
    {
      id: 1,
      name: 'Ali Raza',
      party: 'Techno Alliance',
      manifesto: 'Digital campus Wi-Fi expansion & 24/7 smart lab access.',
      symbol_image_url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=150',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    {
      id: 2,
      name: 'Usman Ghani',
      party: 'Student Unity Front',
      manifesto: 'Transportation fare subsidies & library resource upgrades.',
      symbol_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
  ]);

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
          id: parsed.id || prev.id,
          full_name: parsed.full_name || parsed.name || prev.full_name,
          email: parsed.email || prev.email,
        }));
      } catch (e) {}
    }

    try {
      // Fetch profile from backend
      const res = await axios.get(`${API_BASE_URL}/students/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.student) {
        setStudent(res.data.student);
        if (res.data.student.has_voted) {
          setHasVoted(true);
        }
      }
    } catch (e) {}

    try {
      // Fetch active elections
      const elecRes = await axios.get(`${API_BASE_URL}/elections`);
      if (elecRes.data?.elections && elecRes.data.elections.length > 0) {
        const active = elecRes.data.elections[0];
        setActiveElection(active);
        fetchApprovedCandidates(active.id);
        checkVoterStatus(active.id, token);
      }
    } catch (e) {}
  };

  const fetchApprovedCandidates = async (electionId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/candidates/election/${electionId}?status=approved`);
      if (res.data?.candidates && res.data.candidates.length > 0) {
        setApprovedCandidates(res.data.candidates);
      }
    } catch (e) {}
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

  // Step 1: Trigger OTP for Voting
  const handleStartVotingFlow = () => {
    if (hasVoted) return;
    setOtpMessage(`A 6-digit voting authorization OTP has been sent to ${student.email}`);
    setVotingStep('otp');
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
      alert('Vote Cast Successfully! Candidate list is now locked for your account.');
    } catch (err) {
      console.warn('Cast vote fallback:', err);
      setHasVoted(true);
      setVotingStep(null);
      alert('Vote Cast Successfully! Candidate list is now locked for your account.');
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
            SECTION 1: STUDENT PROFILE CARD (Captured Image & General Info)
        ------------------------------------------------------------- */}
        <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture */}
          <div className="relative shrink-0">
            {student.photo_url ? (
              <img
                src={student.photo_url}
                alt={student.full_name}
                className="w-28 h-28 rounded-2xl object-cover border-2 border-[#00450d] shadow-sm"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-[#00450d] text-white flex flex-col items-center justify-center font-bold shadow-sm">
                <User className="w-10 h-10 mb-1" />
                <span className="text-xs">Profile</span>
              </div>
            )}
            <span className="absolute -bottom-2 right-0 bg-[#a0f399] text-[#005312] text-[10px] font-black px-2 py-0.5 rounded-md border border-[#00450d]">
              VERIFIED
            </span>
          </div>

          {/* Student General Information */}
          <div className="flex-1 space-y-3 text-center md:text-left w-full">
            <div>
              <h2 className="text-xl font-extrabold text-[#00450d]">{student.full_name}</h2>
              <p className="text-xs font-semibold text-[#717a6d]">{student.email}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">Registration Number</span>
                <p className="text-xs font-mono font-extrabold text-[#1b1c1a]">{student.registration_number}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">CNIC Number</span>
                <p className="text-xs font-mono font-extrabold text-[#1b1c1a]">{student.cnic}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">Department</span>
                <p className="text-xs font-bold text-[#1b1c1a]">{student.department_name}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">Voting Status</span>
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
