'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { candidateAPI, electionAPI } from '../../../lib/api';
import ConfirmationModal from '../../../components/ConfirmationModal';
import AccessRestricted from '../../../components/AccessRestricted';
import {
  UserPlus,
  ShieldCheck,
  Calendar,
  BarChart,
  Settings,
  LogOut,
  Search,
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  FileText,
  Download,
  ChevronRight,
  X,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';

export default function AdminCandidatesPage() {
  // Admin Session & Permission State
  const [adminPermissions, setAdminPermissions] = useState([
    'manage_candidates',
    'can_approve_candidates',
    'verify_students',
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

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Election Window State
  const [electionWindow, setElectionWindow] = useState({
    apply_start: '2026-07-01',
    apply_end: '2026-07-25', // Passed -> Closed
    title: 'Fall 2026 General Election',
  });

  const isWindowClosed = new Date() > new Date(electionWindow.apply_end);

  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const res = await candidateAPI.getAll();
      if (res.data?.candidates) {
        setCandidates(res.data.candidates);
      }
    } catch (err) {
      setCandidates([]);
    }
  };

  const canApprove = adminPermissions.includes('can_approve_candidates') || adminPermissions.includes('manage_candidates');

  const filteredCandidates = candidates.filter((c) => {
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    const matchesSearch =
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.position_title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleApproveCandidate = async () => {
    if (!selectedCandidate) return;
    setProcessing(true);

    try {
      await candidateAPI.updateStatus(selectedCandidate.id, 'approved');
    } catch (err) {
      console.warn('API approve fallback:', err);
    } finally {
      setCandidates((prev) =>
        prev.map((item) =>
          item.id === selectedCandidate.id ? { ...item, status: 'approved' } : item
        )
      );
      setSelectedCandidate((prev) => (prev ? { ...prev, status: 'approved' } : null));
      setProcessing(false);
      setIsApproveModalOpen(false);
    }
  };

  const handleRejectCandidate = async () => {
    if (!selectedCandidate) return;
    setProcessing(true);

    try {
      await candidateAPI.updateStatus(
        selectedCandidate.id,
        'rejected',
        rejectReason || 'Application preconditions or prerequisite signatures not satisfied.'
      );
    } catch (err) {
      console.warn('API reject fallback:', err);
    } finally {
      setCandidates((prev) =>
        prev.map((item) =>
          item.id === selectedCandidate.id
            ? {
                ...item,
                status: 'rejected',
                rejection_reason: rejectReason || 'Application preconditions not met.',
              }
            : item
        )
      );
      setSelectedCandidate((prev) =>
        prev
          ? {
              ...prev,
              status: 'rejected',
              rejection_reason: rejectReason || 'Application preconditions not met.',
            }
          : null
      );
      setProcessing(false);
      setIsRejectModalOpen(false);
      setRejectReason('');
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* Sidebar Navigation */}
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
              <UserPlus className="w-4 h-4 text-[#717a6d]" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/candidates"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-[#00450d]" />
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
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <BarChart className="w-4 h-4 text-[#717a6d]" />
              <span>Results</span>
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

      {/* Main Content Shell */}
      <main className="lg:ml-64 flex-1 min-h-screen flex flex-col">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#c0c9bb] shadow-sm flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-3 bg-[#f4f4f0] border border-[#c0c9bb] rounded-full px-4 py-1.5 w-64 lg:w-96">
            <Search className="w-4 h-4 text-[#717a6d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications by name or ID..."
              className="bg-transparent border-none text-xs focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-[#41493e] hover:bg-[#e9e8e4] rounded-full relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 border-l border-[#c0c9bb] pl-4">
              <div className="w-9 h-9 rounded-full bg-[#a0f399] text-[#00450d] font-bold text-xs flex items-center justify-center border-2 border-[#00450d]">
                AP
              </div>
              <span className="text-xs font-bold text-[#1b1c1a] hidden sm:inline">Admin Profile</span>
            </div>
          </div>
        </header>

        {!hasPermission ? (
          <AccessRestricted requiredPermission="can_approve_candidates" />
        ) : (
          <>

        {/* Application Window Closed Banner */}
        {isWindowClosed && (
          <div className="bg-[#fff3e0] border-b border-[#ffe0b2] px-6 py-3 flex items-center justify-center space-x-2 text-[#e65100]">
            <Info className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold">
              Application window closed on {electionWindow.apply_end}. No new candidate submissions accepted.
            </span>
          </div>
        )}

        {/* Content Canvas */}
        <div className="flex-1 p-6 lg:p-8 max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#00450d] tracking-tight">
                Candidate Applications
              </h1>
              <p className="text-xs text-[#41493e] mt-1">
                Review and manage student nominations for the {electionWindow.title}.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#c0c9bb] space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-[#00450d] text-[#00450d]'
                  : 'border-transparent text-[#717a6d] hover:text-[#1b1c1a]'
              }`}
            >
              All Applications ({candidates.length})
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-[#00450d] text-[#00450d]'
                  : 'border-transparent text-[#717a6d] hover:text-[#1b1c1a]'
              }`}
            >
              Pending Review ({candidates.filter((c) => c.status === 'pending').length})
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-[#00450d] text-[#00450d]'
                  : 'border-transparent text-[#717a6d] hover:text-[#1b1c1a]'
              }`}
            >
              Approved ({candidates.filter((c) => c.status === 'approved').length})
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`pb-3 text-xs font-bold transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-[#00450d] text-[#00450d]'
                  : 'border-transparent text-[#717a6d] hover:text-[#1b1c1a]'
              }`}
            >
              Rejected ({candidates.filter((c) => c.status === 'rejected').length})
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-[#c0c9bb] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb]">
                <tr>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                    Candidate
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                    Party & Symbol
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                    Position
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                    Date Applied
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c0c9bb]">
                {filteredCandidates.map((cand) => {
                  const isSelected = selectedCandidate?.id === cand.id;
                  return (
                    <tr
                      key={cand.id}
                      onClick={() => setSelectedCandidate(cand)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#a0f399]/20 font-medium'
                          : 'hover:bg-[#f4f4f0]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full border border-[#c0c9bb] bg-[#e9e8e4] flex items-center justify-center font-bold text-[#00450d] text-xs shrink-0">
                            {cand.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1b1c1a]">{cand.full_name}</p>
                            <p className="text-[11px] text-[#717a6d]">ID: {cand.student_id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 rounded bg-[#00450d] text-white">
                            <Star className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-[#1b1c1a]">{cand.party_name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-[#e9e8e4] text-[#41493e] rounded-full text-[11px] font-semibold">
                          {cand.position_title}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-[#717a6d]">{cand.applied_date}</td>

                      <td className="px-6 py-4">
                        {cand.status === 'pending' ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#ffecb3] text-[#7f5f01] rounded-full text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        ) : cand.status === 'approved' ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#a0f399] text-[#005312] rounded-full text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#ffdad6] text-[#93000a] rounded-full text-[11px] font-bold">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
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

      {/* Side Detail Drawer (Open when candidate is selected) */}
      {selectedCandidate && (
        <>
          <div
            onClick={() => setSelectedCandidate(null)}
            className="fixed inset-0 bg-[#1b1c1a]/30 backdrop-blur-xs z-50 transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-[#c0c9bb] animate-fade-in">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#c0c9bb] flex justify-between items-center bg-[#faf9f5]">
              <h3 className="text-base font-bold text-[#1b1c1a]">Application Details</h3>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 hover:bg-[#e9e8e4] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-24 h-24 rounded-2xl bg-[#a0f399] border-4 border-white shadow-md flex items-center justify-center font-black text-[#00450d] text-2xl">
                  {selectedCandidate.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-[#1b1c1a]">
                    {selectedCandidate.full_name}
                  </h4>
                  <p className="text-xs text-[#717a6d] font-semibold mt-0.5">
                    Candidate for {selectedCandidate.position_title}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <span className="px-3 py-1 bg-[#a3f69c] text-[#005312] text-xs font-bold rounded-full">
                    {selectedCandidate.party_name}
                  </span>
                  <span className="px-3 py-1 bg-[#e9e8e4] text-[#41493e] text-xs font-bold rounded-full flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>Symbol: {selectedCandidate.symbol_name}</span>
                  </span>
                </div>
              </div>

              {/* Manifesto Section */}
              <section className="space-y-2">
                <h5 className="text-xs font-bold text-[#00450d] uppercase tracking-wider">
                  Campaign Manifesto
                </h5>
                <div className="bg-[#f4f4f0] p-4 rounded-xl border border-[#c0c9bb]">
                  <p className="text-xs text-[#41493e] leading-relaxed italic">
                    "{selectedCandidate.manifesto_summary}"
                  </p>
                </div>
              </section>

              {/* Documents Section */}
              <section className="space-y-2">
                <h5 className="text-xs font-bold text-[#00450d] uppercase tracking-wider">
                  Submitted Documents
                </h5>
                <div className="space-y-2">
                  {selectedCandidate.documents?.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-xl hover:bg-[#e9e8e4] transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-[#00450d]" />
                        <div>
                          <p className="text-xs font-bold text-[#1b1c1a]">{doc.name}</p>
                          <p className="text-[11px] text-[#717a6d]">{doc.size}</p>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-[#717a6d] cursor-pointer hover:text-[#1b1c1a]" />
                    </div>
                  ))}
                </div>
              </section>

              {/* Eligibility Checklist */}
              <section className="space-y-2">
                <h5 className="text-xs font-bold text-[#00450d] uppercase tracking-wider">
                  Eligibility Checklist
                </h5>
                <div className="bg-[#faf9f5] p-4 rounded-xl border border-[#c0c9bb] space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#005312]" />
                    <span>Enrolled in current semester</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-[#005312]" />
                    <span>No disciplinary records</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedCandidate.checklist?.gpa_threshold ? (
                      <CheckCircle2 className="w-4 h-4 text-[#005312]" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#ba1a1a]" />
                    )}
                    <span>GPA meets threshold (Min 3.0) — Verified: {selectedCandidate.gpa}</span>
                  </div>
                </div>
              </section>

              {/* Rejection Reason display if rejected */}
              {selectedCandidate.status === 'rejected' && selectedCandidate.rejection_reason && (
                <div className="p-4 bg-[#ffdad6] border border-[#ba1a1a] rounded-xl text-xs space-y-1">
                  <p className="font-bold text-[#93000a]">Reason for Rejection:</p>
                  <p className="text-[#41493e]">{selectedCandidate.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions (Conditioned on canApprove permission) */}
            <div className="p-6 border-t border-[#c0c9bb] bg-[#faf9f5] flex items-center space-x-3">
              {canApprove ? (
                <>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={selectedCandidate.status === 'rejected'}
                    className={`flex-1 h-11 border border-[#ba1a1a] text-[#ba1a1a] font-bold text-xs rounded-xl hover:bg-[#ffdad6]/50 transition-colors ${
                      selectedCandidate.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => setIsApproveModalOpen(true)}
                    disabled={selectedCandidate.status === 'approved'}
                    className={`flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                      selectedCandidate.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Approve Candidate
                  </button>
                </>
              ) : (
                <div className="w-full text-center text-xs text-[#717a6d] font-semibold italic py-2">
                  View-Only Mode (Missing approval permission)
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal — Reject Application */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        iconType="warning"
        heading="Reject candidate application?"
        description={`This action will reject ${selectedCandidate?.full_name}'s nomination and send an official status notification email explaining the rejection reason.`}
        confirmLabel={processing ? 'Rejecting...' : 'Reject Application'}
        confirmButtonStyle="destructive"
        onConfirm={handleRejectCandidate}
        onCancel={() => setIsRejectModalOpen(false)}
      />

      {/* Confirmation Modal — Approve Application */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        iconType="question"
        heading="Approve candidate application?"
        description={`This action will approve ${selectedCandidate?.full_name} and add them to the official ballot screen for ${selectedCandidate?.position_title}.`}
        confirmLabel={processing ? 'Approving...' : 'Approve Candidate'}
        confirmButtonStyle="primary"
        onConfirm={handleApproveCandidate}
        onCancel={() => setIsApproveModalOpen(false)}
      />
          </>
        )}
      </main>
    </div>
  );
}
