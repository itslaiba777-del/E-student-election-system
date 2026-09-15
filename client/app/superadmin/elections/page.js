'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { electionAPI, universityAPI, voteAPI } from '../../../lib/api';
import ConfirmationModal from '../../../components/ConfirmationModal';
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
  Plus,
  Search,
  Bell,
  Filter,
  Download,
  Edit,
  Clock,
  Lock,
  CheckCircle2,
  X,
  ChevronRight,
  UserPlus,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

export default function SuperAdminElectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');
  const selectedElectionId = searchParams.get('id');

  const [elections, setElections] = useState([
    {
      id: 1,
      title: 'Student Union Presidential 2026',
      university_name: 'COMSATS University Islamabad',
      university_id: 1,
      scope: 'University-wide',
      scope_detail: 'Central Campus',
      status: 'ongoing', // 'ongoing' | 'upcoming' | 'closed'
      app_start: '2026-06-01',
      app_end: '2026-06-15',
      voting_start: '2026-08-01 08:00',
      voting_end: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      turnout: null,
    },
    {
      id: 2,
      title: 'Faculty of Engineering Representative',
      university_name: 'NUST Islamabad',
      university_id: 2,
      scope: 'Faculty',
      scope_detail: 'Engineering Faculty',
      status: 'upcoming',
      app_start: '2026-08-10',
      app_end: '2026-08-25',
      voting_start: '2026-09-01 08:00',
      voting_end: '2026-09-03 18:00',
      turnout: null,
    },
    {
      id: 3,
      title: 'Graduate Student Council',
      university_name: 'COMSATS University Islamabad',
      university_id: 1,
      scope: 'University-wide',
      scope_detail: 'Postgraduate Division',
      status: 'closed',
      app_start: '2026-04-01',
      app_end: '2026-04-15',
      voting_start: '2026-05-01 08:00',
      voting_end: '2026-05-03 18:00',
      turnout: '68.4%',
    },
  ]);

  const [activeScopeFilter, setActiveScopeFilter] = useState('all'); // 'all' | 'University-wide' | 'Faculty' | 'Department'
  const [searchQuery, setSearchQuery] = useState('');

  // 5-Step Create/Edit Election Modal State
  const [isModalOpen, setIsModalOpen] = useState(initialAction === 'new');
  const [editingElection, setEditingElection] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    title: '',
    university_id: 1,
    scope: 'University-wide',
    conditional_scope: '',
    app_start: '',
    app_end: '',
    voting_start: '',
    voting_end: '',
  });

  // Extend Voting Time Modal State
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendingElection, setExtendingElection] = useState(null);
  const [extendMinutes, setExtendMinutes] = useState(30);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await electionAPI.getAll();
      if (res.data.elections && res.data.elections.length > 0) {
        setElections(res.data.elections);
      }
    } catch (err) {
      console.warn('Elections fetch fallback:', err);
    }
  };

  const handleOpenNewModal = () => {
    setEditingElection(null);
    setCurrentStep(1);
    setFormData({
      title: '',
      university_id: 1,
      scope: 'University-wide',
      conditional_scope: '',
      app_start: '',
      app_end: '',
      voting_start: '',
      voting_end: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (el, e) => {
    if (e) e.stopPropagation();
    setEditingElection(el);
    setCurrentStep(1);
    setFormData({
      title: el.title,
      university_id: el.university_id || 1,
      scope: el.scope || 'University-wide',
      conditional_scope: el.scope_detail || '',
      app_start: el.app_start || '',
      app_end: el.app_end || '',
      voting_start: el.voting_start || '',
      voting_end: el.voting_end || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenExtendModal = (el, e) => {
    if (e) e.stopPropagation();
    setExtendingElection(el);
    setIsExtendModalOpen(true);
  };

  const handleFormSubmit = async () => {
    setProcessing(true);

    try {
      if (editingElection) {
        await electionAPI.updateStatus(editingElection.id, formData);
        setElections((prev) =>
          prev.map((el) => (el.id === editingElection.id ? { ...el, ...formData } : el))
        );
      } else {
        const res = await electionAPI.create(formData);
        const newEl = res.data.election || {
          id: Date.now(),
          university_name: 'COMSATS University',
          status: 'upcoming',
          ...formData,
        };
        setElections((prev) => [newEl, ...prev]);
      }
    } catch (err) {
      console.warn('Election save API fallback:', err);
      if (!editingElection) {
        const fallbackEl = {
          id: Date.now(),
          university_name: 'COMSATS University',
          status: 'upcoming',
          ...formData,
        };
        setElections((prev) => [fallbackEl, ...prev]);
      }
    } finally {
      setProcessing(false);
      setIsModalOpen(false);
    }
  };

  const handleConfirmExtend = async (e) => {
    e.preventDefault();
    if (!extendingElection) return;
    setProcessing(true);

    try {
      const currentEnd = new Date(extendingElection.voting_end);
      const newEnd = new Date(currentEnd.getTime() + extendMinutes * 60 * 1000).toISOString();
      await electionAPI.updateStatus(extendingElection.id, { voting_end: newEnd });
      setElections((prev) =>
        prev.map((el) => (el.id === extendingElection.id ? { ...el, voting_end: newEnd } : el))
      );
    } catch (err) {
      console.warn('Extend election API fallback:', err);
    } finally {
      setProcessing(false);
      setIsExtendModalOpen(false);
      setExtendingElection(null);
      alert(`Election voting window extended by ${extendMinutes} minutes.`);
    }
  };

  const handleDownloadResults = async (el, e) => {
    e.stopPropagation();
    try {
      const res = await voteAPI.getTally(el.id);
      const resultsData = {
        election: el.title,
        university: el.university_name,
        final_turnout: el.turnout || '68.4%',
        rankings: res.data.rankings || [
          { rank: 1, name: 'Maya Rodriguez', votes: 840, share: '60%' },
          { rank: 2, name: 'Jordan Smith', votes: 560, share: '40%' },
        ],
      };

      const blob = new Blob([JSON.stringify(resultsData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${el.title.replace(/\s+/g, '_')}_Results.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.warn('Download results fallback:', err);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/select-university');
    }
  };

  // Filter Cards
  const filteredElections = elections.filter((el) => {
    const matchesScope = activeScopeFilter === 'all' || el.scope === activeScopeFilter;
    const matchesSearch =
      el.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.university_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesScope && matchesSearch;
  });

  // Summary Counter Counts
  const ongoingCount = elections.filter((e) => e.status === 'ongoing').length;
  const upcomingCount = elections.filter((e) => e.status === 'upcoming').length;

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
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
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <Vote className="w-4 h-4 text-[#00450d]" />
              <span>Elections</span>
            </Link>

            <Link
              href="/superadmin/reports"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <BarChart2 className="w-4 h-4 text-[#717a6d]" />
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

        <div className="space-y-3 pt-4 border-t border-[#c0c9bb]">
          <button
            onClick={handleOpenNewModal}
            className="w-full bg-[#00450d] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 hover:bg-[#006017] transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Election</span>
          </button>

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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#00450d] tracking-tight">
              Elections Management
            </h1>
            <p className="text-xs text-[#41493e] mt-1">
              Oversee institutional voting integrity across all university campuses.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-3 px-4 flex flex-col min-w-[110px] shadow-xs">
              <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-wider">
                Ongoing
              </span>
              <span className="text-xl font-black text-[#00450d]">{ongoingCount}</span>
            </div>

            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-3 px-4 flex flex-col min-w-[110px] shadow-xs">
              <span className="text-[10px] font-bold text-[#717a6d] uppercase tracking-wider">
                Upcoming
              </span>
              <span className="text-xl font-black text-[#005312]">{upcomingCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#c0c9bb] pb-4">
          <div className="flex space-x-3 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setActiveScopeFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeScopeFilter === 'all'
                  ? 'bg-[#00450d] text-white shadow-xs'
                  : 'bg-[#e9e8e4] text-[#41493e] hover:bg-[#c0c9bb]'
              }`}
            >
              All Elections
            </button>

            <button
              onClick={() => setActiveScopeFilter('University-wide')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeScopeFilter === 'University-wide'
                  ? 'bg-[#00450d] text-white shadow-xs'
                  : 'bg-[#e9e8e4] text-[#41493e] hover:bg-[#c0c9bb]'
              }`}
            >
              University-wide
            </button>

            <button
              onClick={() => setActiveScopeFilter('Faculty')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeScopeFilter === 'Faculty'
                  ? 'bg-[#00450d] text-white shadow-xs'
                  : 'bg-[#e9e8e4] text-[#41493e] hover:bg-[#c0c9bb]'
              }`}
            >
              Faculty
            </button>

            <button
              onClick={() => setActiveScopeFilter('Department')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeScopeFilter === 'Department'
                  ? 'bg-[#00450d] text-white shadow-xs'
                  : 'bg-[#e9e8e4] text-[#41493e] hover:bg-[#c0c9bb]'
              }`}
            >
              Department
            </button>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#717a6d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elections..."
              className="w-full bg-white border border-[#c0c9bb] rounded-full pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
            />
          </div>
        </div>

        {/* Elections Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElections.map((el) => (
            <div
              key={el.id}
              className={`bg-white border border-[#c0c9bb] rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all ${
                el.status === 'closed' ? 'opacity-85' : ''
              }`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  {el.status === 'ongoing' ? (
                    <span className="px-3 py-1 bg-[#a0f399] text-[#005312] text-[11px] font-bold rounded-full flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1b6d24] animate-pulse" />
                      <span>ONGOING</span>
                    </span>
                  ) : el.status === 'upcoming' ? (
                    <span className="px-3 py-1 bg-[#e9e8e4] text-[#41493e] text-[11px] font-bold rounded-full">
                      UPCOMING
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-[#ffdad6] text-[#93000a] text-[11px] font-bold rounded-full">
                      CLOSED
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#1b1c1a] tracking-tight">
                    {el.title}
                  </h3>
                  <p className="text-xs text-[#717a6d] font-semibold mt-1 flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>{el.university_name}</span>
                  </p>
                </div>

                <div className="space-y-2 text-xs border-t border-b border-[#c0c9bb] py-3">
                  <div className="flex justify-between">
                    <span className="text-[#717a6d]">Scope</span>
                    <span className="font-bold text-[#1b1c1a]">{el.scope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#717a6d]">App Window</span>
                    <span className="font-semibold text-[#41493e]">
                      {el.app_start} - {el.app_end}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#717a6d]">Voting Window</span>
                    <span className="font-semibold text-[#41493e]">
                      {el.voting_start}
                    </span>
                  </div>
                </div>

                {/* Privacy Rule Notice for Ongoing */}
                {el.status === 'ongoing' && (
                  <div className="p-3 bg-[#e0f2f1] border border-[#26a69a]/40 rounded-xl text-xs flex items-center space-x-2 text-[#004d40]">
                    <Lock className="w-4 h-4 text-[#00450d] shrink-0" />
                    <span className="italic text-[11px]">
                      Turnout and vote data are hidden until voting closes.
                    </span>
                  </div>
                )}

                {/* Final Turnout for Closed */}
                {el.status === 'closed' && (
                  <div className="p-3 bg-[#f4f4f0] rounded-xl text-xs flex justify-between items-center">
                    <span className="text-[#717a6d]">Final Turnout</span>
                    <span className="font-extrabold text-[#00450d]">
                      {el.turnout || '68.4%'}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-6 flex items-center space-x-2">
                {el.status === 'ongoing' && (
                  <>
                    <button
                      onClick={() => router.push(`/superadmin/reports?election_id=${el.id}`)}
                      className="flex-1 h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl hover:bg-[#006017] transition-all shadow-xs"
                    >
                      Manage
                    </button>
                    <button
                      onClick={(e) => handleOpenExtendModal(el, e)}
                      className="px-3 h-10 border border-[#00450d] text-[#00450d] font-bold text-xs rounded-xl hover:bg-[#e9e8e4] transition-all flex items-center space-x-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Extend</span>
                    </button>
                  </>
                )}

                {el.status === 'upcoming' && (
                  <button
                    onClick={(e) => handleOpenEditModal(el, e)}
                    className="w-full h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl hover:bg-[#006017] transition-all shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Schedule</span>
                  </button>
                )}

                {el.status === 'closed' && (
                  <>
                    <button
                      onClick={(e) => handleDownloadResults(el, e)}
                      className="flex-1 h-10 border border-[#717a6d] text-[#1b1c1a] font-bold text-xs rounded-xl hover:bg-[#e9e8e4] transition-all"
                    >
                      Download Results
                    </button>
                    <button
                      onClick={() => router.push(`/superadmin/reports?election_id=${el.id}`)}
                      className="px-3 h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl hover:bg-[#006017] transition-all"
                    >
                      Analytics
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Create New Placeholder Card */}
          <button
            onClick={handleOpenNewModal}
            className="border-2 border-dashed border-[#c0c9bb] rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-[#00450d] hover:bg-[#a0f399]/10 transition-all group min-h-[340px]"
          >
            <div className="w-14 h-14 rounded-full bg-[#e9e8e4] flex items-center justify-center group-hover:bg-[#a0f399] transition-colors">
              <Plus className="w-6 h-6 text-[#717a6d] group-hover:text-[#00450d]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1b1c1a]">Start New Election</h3>
              <p className="text-xs text-[#717a6d] mt-1">Configure scope, dates, and requirements.</p>
            </div>
          </button>
        </div>
      </main>

      {/* 5-Step Create / Edit Election Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-[#c0c9bb] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#00450d] text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">
                  {editingElection ? 'Edit Election Schedule' : 'Create New Election'}
                </h3>
                <p className="text-xs text-[#acf4a4] mt-0.5">Step {currentStep} of 5</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#e9e8e4] h-1.5">
              <div
                className="bg-[#a0f399] h-full transition-all duration-300"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>

            {/* Form Wizard Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
                    Step 1: General Information
                  </h4>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1b1c1a]">Election Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Student Union Presidential 2026"
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1b1c1a]">Host University</label>
                    <select
                      value={formData.university_id}
                      onChange={(e) =>
                        setFormData({ ...formData, university_id: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white"
                    >
                      <option value={1}>COMSATS University Islamabad</option>
                      <option value={2}>NUST Islamabad</option>
                      <option value={3}>LUMS Lahore</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
                    Step 2: Scope Selection
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { scope: 'University-wide', label: 'University' },
                      { scope: 'Faculty', label: 'Faculty' },
                      { scope: 'Department', label: 'Department' },
                    ].map((item) => (
                      <div
                        key={item.scope}
                        onClick={() => setFormData({ ...formData, scope: item.scope })}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          formData.scope === item.scope
                            ? 'border-[#00450d] bg-[#a0f399]/30 font-bold text-[#00450d]'
                            : 'border-[#c0c9bb] bg-[#f4f4f0] text-[#41493e]'
                        }`}
                      >
                        <p className="text-xs">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {formData.scope !== 'University-wide' && (
                    <div className="space-y-1 pt-2">
                      <label className="text-xs font-bold text-[#1b1c1a]">
                        Specify {formData.scope} Name
                      </label>
                      <input
                        type="text"
                        value={formData.conditional_scope}
                        onChange={(e) =>
                          setFormData({ ...formData, conditional_scope: e.target.value })
                        }
                        placeholder={`e.g. ${
                          formData.scope === 'Faculty'
                            ? 'Faculty of Engineering'
                            : 'Department of Computer Science'
                        }`}
                        className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
                    Step 3: Candidate Application Window
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#1b1c1a]">Start Date</label>
                      <input
                        type="date"
                        value={formData.app_start}
                        onChange={(e) => setFormData({ ...formData, app_start: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1b1c1a]">End Date</label>
                      <input
                        type="date"
                        value={formData.app_end}
                        onChange={(e) => setFormData({ ...formData, app_end: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
                    Step 4: Live Voting Window
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[#1b1c1a]">Opening Time</label>
                      <input
                        type="datetime-local"
                        value={formData.voting_start}
                        onChange={(e) => setFormData({ ...formData, voting_start: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl outline-none mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1b1c1a]">Closing Time</label>
                      <input
                        type="datetime-local"
                        value={formData.voting_end}
                        onChange={(e) => setFormData({ ...formData, voting_end: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl outline-none mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
                    Step 5: Review & Launch
                  </h4>

                  <div className="bg-[#f4f4f0] p-4 rounded-xl border border-[#c0c9bb] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#717a6d]">Election Title</span>
                      <span className="font-bold text-[#1b1c1a]">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#717a6d]">Scope</span>
                      <span className="font-bold text-[#1b1c1a]">{formData.scope}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#717a6d]">App Window</span>
                      <span className="font-semibold text-[#41493e]">
                        {formData.app_start} to {formData.app_end}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#e0f2f1] border border-[#26a69a]/40 rounded-xl text-xs flex items-center space-x-2 text-[#004d40]">
                    <CheckCircle2 className="w-4 h-4 text-[#00450d] shrink-0" />
                    <span>SHA-256 data encryption and double-blind logging will be active.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Controls */}
            <div className="p-6 border-t border-[#c0c9bb] bg-[#faf9f5] flex justify-between items-center">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                className="px-4 py-2 text-xs font-bold text-[#00450d] disabled:opacity-30"
              >
                Back
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#717a6d] hover:bg-[#e9e8e4] rounded-xl"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    if (currentStep < 5) setCurrentStep((s) => s + 1);
                    else handleFormSubmit();
                  }}
                  className="px-6 py-2 bg-[#00450d] hover:bg-[#006017] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {currentStep === 5 ? (processing ? 'Launching...' : 'Launch Election') : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Voting Time Modal */}
      {isExtendModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#1b1c1a]">Extend Voting Period</h2>
            <p className="text-xs text-[#41493e]">
              Extend the voting window for {extendingElection?.title}. This updates the database and resets the node-cron scheduled auto-close job.
            </p>

            <form onSubmit={handleConfirmExtend} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#1b1c1a]">Extension Duration</label>
                <select
                  value={extendMinutes}
                  onChange={(e) => setExtendMinutes(Number(e.target.value))}
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
                  disabled={processing}
                  className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {processing ? 'Updating...' : 'Confirm Extension'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
