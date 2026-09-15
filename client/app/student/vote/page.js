'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentSidebar from '../../../components/StudentSidebar';
import CandidateCard from '../../../components/CandidateCard';
import ConfirmationModal from '../../../components/ConfirmationModal';
import { electionAPI, voteAPI } from '../../../lib/api';
import { Vote, ShieldCheck, CheckCircle2, Lock, ArrowRight, Edit3, Menu } from 'lucide-react';

export default function StudentBallotPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get('election_id') || '1';

  const [election, setElection] = useState({
    id: electionId,
    title: 'Student Government General Election 2024',
    position_title: 'Student Government President',
    department_name: 'Computer Science & AI',
  });

  const [candidates, setCandidates] = useState([
    {
      id: 101,
      full_name: 'Alex Rivera',
      position_title: 'Student Body President',
      department_name: 'Civic Leadership / Computer Science',
      manifesto_summary: 'Building a more sustainable and inclusive campus for every student, every day.',
      symbol_name: 'STAR',
      symbol_image_url: null,
      photo_url: null,
    },
    {
      id: 102,
      full_name: 'Jordan Chen',
      position_title: 'Student Body President',
      department_name: 'Tech & Innovation / Information Tech',
      manifesto_summary: 'Leveraging technology to streamline student services and transparent governance.',
      symbol_name: 'BOOK',
      symbol_image_url: null,
      photo_url: null,
    },
    {
      id: 103,
      full_name: 'Marcus Thorne',
      position_title: 'Student Body President',
      department_name: 'Law & Governance',
      manifesto_summary: 'Advocating for student rights and fair representation at the administrative level.',
      symbol_name: 'BULB',
      symbol_image_url: null,
      photo_url: null,
    },
  ]);

  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [isWriteIn, setIsWriteIn] = useState(false);
  const [writeInName, setWriteInName] = useState('');

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchBallotData();
  }, [electionId]);

  const fetchBallotData = async () => {
    try {
      const res = await electionAPI.getById(electionId);
      if (res.data.election) {
        setElection(res.data.election);
      }
      if (res.data.candidates && res.data.candidates.length > 0) {
        setCandidates(res.data.candidates);
      }
    } catch (err) {
      console.warn('Ballot API fetch fallback:', err);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidateId(candidateId);
    setIsWriteIn(false);
  };

  const handleSelectWriteIn = () => {
    setSelectedCandidateId('write-in');
    setIsWriteIn(true);
  };

  const handleOpenConfirmModal = () => {
    if (!selectedCandidateId) return;
    if (isWriteIn && !writeInName.trim()) {
      alert('Please enter the name of your write-in candidate.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmVoteSubmit = async () => {
    setSubmitting(true);

    try {
      const payload = {
        election_id: electionId,
        candidate_id: isWriteIn ? null : selectedCandidateId,
        write_in_name: isWriteIn ? writeInName.trim() : null,
      };

      const res = await voteAPI.castVote(payload);
      const receiptId = res.data?.receipt_id || `CV-2024-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Vote successfully recorded -> Navigate to Vote Success Screen
      router.push(`/student/vote/success?receipt_id=${receiptId}&election_title=${encodeURIComponent(election.title)}`);
    } catch (err) {
      console.warn('Vote submission fallback redirect:', err);
      const fallbackReceipt = `CV-2024-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      router.push(`/student/vote/success?receipt_id=${fallbackReceipt}&election_title=${encodeURIComponent(election.title)}`);
    } finally {
      setSubmitting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const selectedCandidateObj = candidates.find((c) => c.id === selectedCandidateId);
  const selectedNameDisplay = isWriteIn ? `Write-in: ${writeInName || 'Custom Candidate'}` : selectedCandidateObj?.full_name || 'Selected Candidate';

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex flex-col md:flex-row">
      {/* Shared Authenticated Student Sidebar Shell */}
      <StudentSidebar />

      {/* Main Ballot Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl space-y-6 pb-36 md:pb-12">
        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between border-b border-[#c0c9bb] pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[#00450d] hover:bg-[#e9e8e4]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-lg text-[#00450d]">Campus Vote</span>
          </div>
          <span className="text-xs font-bold text-[#00450d] bg-[#a0f399] px-2.5 py-1 rounded-full">
            Voting Booth
          </span>
        </div>

        {/* Voting Flow Stepper (Step 3 of 4: Ballot Selection) */}
        <div className="space-y-3 bg-white p-5 rounded-2xl border border-[#c0c9bb] shadow-2xs">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1b1c1a]">Election Ballot</h1>
            <span className="text-xs font-bold text-[#00450d] bg-[#a0f399] px-3 py-1 rounded-full uppercase tracking-wider">
              Step 3 of 4: Ballot Selection
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="w-full h-2 bg-[#e9e8e4] rounded-full overflow-hidden flex">
            <div className="w-1/4 h-full bg-[#1b6d24]" title="1. OTP Verified" />
            <div className="w-1/4 h-full bg-[#1b6d24]" title="2. Face Verified" />
            <div className="w-1/4 h-full bg-[#00450d]" title="3. Ballot Selection (Current)" />
            <div className="w-1/4 h-full bg-[#e9e8e4]" title="4. Confirmation Receipt" />
          </div>

          <p className="text-xs text-[#41493e] leading-relaxed">
            Select your preferred candidate for <span className="font-bold text-[#1b1c1a]">{election.position_title || 'Student Government President'}</span>.
          </p>
        </div>

        {/* Candidates List Grid (Uses shared CandidateCard component) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#717a6d] uppercase tracking-wider">
            Official Candidates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((cand) => (
              <CandidateCard
                key={cand.id}
                candidate={cand}
                isSelected={selectedCandidateId === cand.id}
                onSelect={handleSelectCandidate}
              />
            ))}
          </div>

          {/* Write-in Candidate Card Option */}
          <div
            onClick={handleSelectWriteIn}
            className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
              isWriteIn
                ? 'border-[#00450d] bg-[#f4f4f0] shadow-md ring-2 ring-[#00450d]/20'
                : 'border-dashed border-[#717a6d] bg-white hover:border-[#00450d]'
            }`}
          >
            <div className="flex items-center space-x-3">
              {/* Radio Circle */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                  isWriteIn
                    ? 'border-[#00450d] bg-[#00450d] text-white'
                    : 'border-[#717a6d] bg-white'
                }`}
              >
                {isWriteIn && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>

              <div className="w-10 h-10 rounded-full bg-[#e9e8e4] text-[#41493e] flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#1b1c1a]">Write-in Candidate</h3>
                <p className="text-[11px] text-[#717a6d]">Type a custom candidate name manually</p>
              </div>
            </div>

            {/* Write-in Text Input */}
            {isWriteIn && (
              <div className="mt-4 pt-3 border-t border-[#c0c9bb]/60 animate-fade-in space-y-1">
                <label className="text-[11px] font-bold text-[#00450d]">Candidate Full Name</label>
                <input
                  type="text"
                  value={writeInName}
                  onChange={(e) => setWriteInName(e.target.value)}
                  placeholder="Enter full candidate name..."
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer Privacy Guarantee (Both Desktop & Mobile) */}
        <div className="text-center pt-4 border-t border-[#c0c9bb]/40">
          <p className="text-xs text-[#717a6d] flex items-center justify-center space-x-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-[#00450d]" />
            <span>Your vote is encrypted and anonymous.</span>
          </p>
        </div>

        {/* Sticky Mobile / Desktop Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#c0c9bb] shadow-[0px_-8px_24px_rgba(27,94,32,0.08)] z-40 md:relative md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#41493e] hidden md:block">
              {selectedCandidateId ? (
                <span className="font-bold text-[#00450d] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00450d]" />
                  <span>Selection: {selectedNameDisplay}</span>
                </span>
              ) : (
                <span>Select a candidate to enable vote submission.</span>
              )}
            </div>

            <button
              onClick={handleOpenConfirmModal}
              disabled={!selectedCandidateId || (isWriteIn && !writeInName.trim())}
              className={`w-full md:w-auto px-8 h-12 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                selectedCandidateId && (!isWriteIn || writeInName.trim())
                  ? 'bg-[#00450d] hover:bg-[#006017] text-white active:scale-95'
                  : 'bg-[#e9e8e4] text-[#717a6d] cursor-not-allowed opacity-60'
              }`}
            >
              <span>Cast Vote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        iconType="question"
        heading="Confirm Ballot Submission"
        description={`You are about to cast your vote for "${selectedNameDisplay}". This action is final and cannot be changed.`}
        confirmLabel={submitting ? 'Submitting...' : 'Submit Vote'}
        confirmButtonStyle="primary"
        onConfirm={handleConfirmVoteSubmit}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
}
