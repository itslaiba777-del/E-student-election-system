'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '../../../../components/StudentSidebar';
import {
  Lock,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Award,
  Vote,
  ShieldCheck,
} from 'lucide-react';

export default function VoteSuccessPage() {
  const router = useRouter();

  // Standalone random receipt ID (No DB link back to student or candidate)
  const [digitalBallotId, setDigitalBallotId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Generate random standalone receipt: CV-2026-XXXX-XXXX-XXXX
    const randomHex = () =>
      Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
        .toUpperCase();
    const generatedId = `CV-2026-${randomHex()}-${randomHex()}-${randomHex()}`;
    setDigitalBallotId(generatedId);
  }, []);

  const handleCopyReceipt = () => {
    if (navigator.clipboard && digitalBallotId) {
      navigator.clipboard.writeText(digitalBallotId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const genericShareMessage =
    'I voted in the Student Government Association Elections! 🗳️ #CampusVote #StudentDemocracy #YourVoteCounts';

  const handleShareBadge = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'I Voted! - Campus Vote',
          text: genericShareMessage,
          url: typeof window !== 'undefined' ? window.location.origin : '',
        })
        .catch(() => {});
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex relative overflow-hidden">
      {/* Shared Authenticated Student Shell Sidebar */}
      <StudentSidebar />

      {/* Atmospheric Background Decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#a0f399] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-[#98f994] opacity-20 blur-[100px]" />
      </div>

      {/* Main Success Content Canvas */}
      <main className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center text-center z-10 overflow-x-hidden">
        <div className="max-w-md w-full text-center space-y-6 animate-scale-in">
          {/* Animated Success Check Circle Assembly */}
          <div className="inline-flex items-center justify-center relative">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-[#a0f399] text-[#005312] flex items-center justify-center shadow-[0px_4px_12px_rgba(27,94,32,0.05)] ring-8 ring-[#a0f399]/30">
              <svg
                className="w-16 h-16 md:w-20 md:h-20 stroke-[#00450d] stroke-[2.5] fill-none"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M20 6L9 17L4 12" />
              </svg>
            </div>
          </div>

          {/* Header Content */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] tracking-tight mb-2">
              Your vote has been recorded
            </h1>
            <p className="text-xs md:text-sm text-[#41493e] px-4 leading-relaxed">
              Thank you for participating in the{' '}
              <span className="font-bold text-[#00450d]">
                Student Government Association Elections
              </span>
              . Your voice matters.
            </p>
          </div>

          {/* Anonymity Reassurance Card */}
          <div className="bg-[#f4f4f0] border border-[#c0c9bb] rounded-2xl p-5 text-left shadow-sm space-y-2">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-[#1b6d24] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1b1c1a] mb-1">
                  Your Anonymity is Protected
                </p>
                <p className="text-xs text-[#41493e] leading-relaxed">
                  Campus Vote uses zero-knowledge end-to-end encryption. Your identity is separated from your ballot immediately after submission, ensuring that no one—including the university—can link your choice back to you.
                </p>
              </div>
            </div>
          </div>

          {/* Standalone Digital Ballot Receipt ID Code Block */}
          <div className="flex flex-col items-center space-y-1">
            <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-widest">
              Digital Ballot ID
            </span>
            <div className="inline-flex items-center space-x-2 bg-[#e3e2df] px-4 py-1.5 rounded-lg border border-[#c0c9bb]">
              <code className="font-mono text-xs font-bold text-[#41493e]">
                {digitalBallotId || 'CV-2026-8A3B-72F1-99D0'}
              </code>
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="text-[#717a6d] hover:text-[#00450d] transition-colors p-0.5"
                title="Copy Standalone Receipt"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#1b6d24]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col space-y-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/student/dashboard')}
              className="w-full h-12 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <span>Return to dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleShareBadge}
              className="w-full h-12 bg-transparent hover:bg-[#e9e8e4] text-[#00450d] font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share participation badge</span>
            </button>
          </div>
        </div>
      </main>

      {/* Share Modal Popup */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#c0c9bb] text-center">
            <div className="w-12 h-12 rounded-full bg-[#a0f399] text-[#005312] flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-[#1b1c1a] text-base">Share Civic Participation</h3>
              <p className="text-xs text-[#717a6d] mt-1">
                Share that you voted without revealing your candidate choice!
              </p>
            </div>

            <div className="bg-[#faf9f5] p-3 rounded-xl border border-[#c0c9bb] text-xs text-[#1b1c1a] font-medium text-left">
              "{genericShareMessage}"
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(genericShareMessage);
                  }
                  setShowShareModal(false);
                }}
                className="flex-1 h-10 bg-[#00450d] text-white font-bold text-xs rounded-lg hover:bg-[#006017] transition-colors"
              >
                Copy Message
              </button>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 h-10 bg-[#e9e8e4] text-[#1b1c1a] font-bold text-xs rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
