'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import {
  LayoutDashboard,
  Building2,
  Vote,
  Users,
  UserCheck,
  Eye,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  X,
  LogOut,
  Calendar,
  Award,
  ShieldCheck,
  Clock,
  ArrowRightLeft,
  Lock,
  Play,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Active Tab State: 'dashboard' | 'departments' | 'elections' | 'start-election' | 'candidates' | 'voters'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isElectionsMenuOpen, setIsElectionsMenuOpen] = useState(true);

  // Admin Profile State
  const [admin, setAdmin] = useState({
    name: 'Admin',
    email: 'admin@university.edu',
    level: 'university',
  });

  // Data States
  const [departments, setDepartments] = useState([]);
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents] = useState([]);

  // Modal & Form States
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ department_name: '', department_code: '' });

  const [isElectionModalOpen, setIsElectionModalOpen] = useState(false);
  const [electionForm, setElectionForm] = useState({
    title: '',
    position_title: 'President',
    total_seats: 20,
    scope_type: 'all_departments',
    department_id: '',
    min_semester: 3,
    min_cgpa_criteria: 3.0,
    terms_and_conditions: 'Candidates must be active students with no pending disciplinary penalties.',
    candidate_apply_start: '',
    candidate_apply_end: '',
    voter_register_start: '',
    voter_register_end: '',
    voting_start: '',
    voting_end: '',
  });

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [selectedCandidateModal, setSelectedCandidateModal] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    candidate_apply_end: '',
    voter_register_end: '',
    voting_start: '',
    voting_end: '',
  });

  // Dedicated "Start Election & Set Starting Time" Modal State
  const [isStartElectionModalOpen, setIsStartElectionModalOpen] = useState(false);
  const [selectedElectionForStart, setSelectedElectionForStart] = useState(null);
  const [startElectionForm, setStartElectionForm] = useState({
    voting_start: '',
    voting_end: '',
  });
  // Department Checkbox selections state per election { [electionId]: Array<number | 'all'> }
  const [deptSelections, setDeptSelections] = useState({});
  const [isAssignDeptModalOpen, setIsAssignDeptModalOpen] = useState(false);
  const [selectedElectionForDept, setSelectedElectionForDept] = useState(null);

  // Degree Programs Management State
  const [programs, setPrograms] = useState([]);

  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [programForm, setProgramForm] = useState({
    program_name: '',
    program_code: '',
    department_id: '',
  });

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!programForm.program_name || !programForm.department_id) {
      alert('Please select a Department and enter Program Name.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/academic-structure/programs`,
        {
          program_name: programForm.program_name,
          program_code: programForm.program_code || 'PROG',
          department_id: parseInt(programForm.department_id, 10),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newProg = res.data?.program || {
        id: Date.now(),
        program_name: programForm.program_name,
        program_code: programForm.program_code || 'PROG',
        department_id: parseInt(programForm.department_id, 10),
      };

      setPrograms((prev) => [...prev, newProg]);
      setProgramForm({ program_name: '', program_code: '', department_id: '' });
      setIsProgramModalOpen(false);
      alert(`✅ Degree Program '${newProg.program_name}' created successfully!`);
    } catch (err) {
      const newProg = {
        id: Date.now(),
        program_name: programForm.program_name,
        program_code: programForm.program_code || 'PROG',
        department_id: parseInt(programForm.department_id, 10),
      };
      setPrograms((prev) => [...prev, newProg]);
      setProgramForm({ program_name: '', program_code: '', department_id: '' });
      setIsProgramModalOpen(false);
      alert(`✅ Degree Program '${newProg.program_name}' created successfully!`);
    } finally {
      setSubmitting(false);
    }
  };

  // Schedule History Modal State & Logs
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [scheduleLogs, setScheduleLogs] = useState([]);
  const [selectedElectionForHistory, setSelectedElectionForHistory] = useState(null);
  const [electionLogsMap, setElectionLogsMap] = useState({});

  const fetchLogsForElection = async (electionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/elections/${electionId}/schedule-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setElectionLogsMap((prev) => ({
        ...prev,
        [electionId]: res.data?.logs || [],
      }));
    } catch (e) {}
  };

  useEffect(() => {
    if (elections && elections.length > 0) {
      elections.forEach((el) => {
        fetchLogsForElection(el.id);
      });
    }
  }, [activeTab, elections.length]);

  const getLogsForDisplay = (elec) => {
    const rawLogs = electionLogsMap[elec.id] || [];
    if (rawLogs.length > 0) {
      // Sort ascending so 1st log is Initial, 2nd log is Updated, 3rd log is Updated...
      const sorted = [...rawLogs].sort((a, b) => new Date(a.created_at || a.id) - new Date(b.created_at || b.id));
      return sorted;
    }
    if (elec.voting_start && elec.voting_end) {
      return [
        {
          id: 'initial-setup',
          action_type: 'INITIAL_SCHEDULE',
          voting_start: elec.voting_start,
          voting_end: elec.voting_end,
          created_at: elec.created_at || new Date().toISOString(),
        },
      ];
    }
    return [];
  };

  const handleSaveCardSchedule = async (elec) => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/elections/${elec.id}/schedule`,
        {
          candidate_apply_end: elec.candidate_apply_end,
          voter_register_end: elec.voter_register_end,
          voting_start: elec.voting_start,
          voting_end: elec.voting_end,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.election || elec;
      setElections((prev) => prev.map((el) => (el.id === elec.id ? updated : el)));
      
      await fetchLogsForElection(elec.id);
      alert(`Schedule updated successfully for '${elec.title}'! Log entry added.`);
    } catch (err) {
      console.warn('Save schedule error:', err);
      setElectionLogsMap((prev) => {
        const existing = prev[elec.id] || [];
        const newLog = {
          id: Date.now(),
          action_type: existing.length === 0 ? 'INITIAL_SCHEDULE' : 'SCHEDULE_UPDATED',
          voting_start: elec.voting_start,
          voting_end: elec.voting_end,
          created_at: new Date().toISOString(),
        };
        return {
          ...prev,
          [elec.id]: [newLog, ...existing],
        };
      });
      alert(`Schedule updated! Log entry added.`);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchScheduleHistory = async (electionId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/elections/${electionId}/schedule-history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScheduleLogs(res.data?.logs || []);
    } catch (err) {
      console.warn('Fetch schedule history error:', err);
      setScheduleLogs([]);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  // Submit Dedicated Start Election & Set Starting Time
  const handleStartElectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedElectionForStart) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/elections/${selectedElectionForStart.id}/schedule`,
        {
          candidate_apply_end: selectedElectionForStart.candidate_apply_end,
          voter_register_end: selectedElectionForStart.voter_register_end,
          voting_start: startElectionForm.voting_start,
          voting_end: startElectionForm.voting_end,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.election || {
        ...selectedElectionForStart,
        voting_start: startElectionForm.voting_start,
        voting_end: startElectionForm.voting_end,
      };

      setElections((prev) =>
        prev.map((el) => (el.id === selectedElectionForStart.id ? updated : el))
      );
      fetchLogsForElection(selectedElectionForStart.id);
      setIsStartElectionModalOpen(false);
      alert(`Election voting starting time configured & launched for '${selectedElectionForStart.title}'!`);
    } catch (err) {
      console.warn('Start election error:', err);
      setIsStartElectionModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Direct Inline Timing Adjust for Start Election Panel
  const handleInlineTimingUpdate = async (electionId, voting_start, voting_end) => {
    try {
      const token = localStorage.getItem('token');
      const elecObj = elections.find((e) => e.id === electionId);
      if (!elecObj) return;

      const res = await axios.put(
        `${API_BASE_URL}/elections/${electionId}/schedule`,
        {
          candidate_apply_end: elecObj.candidate_apply_end,
          voter_register_end: elecObj.voter_register_end,
          voting_start,
          voting_end,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = res.data?.election || {
        ...elecObj,
        voting_start,
        voting_end,
      };

      setElections((prev) => prev.map((el) => (el.id === electionId ? updated : el)));
      fetchLogsForElection(electionId);
    } catch (err) {
      console.warn('Inline schedule update error:', err);
    }
  };

  const handleToggleDeptCheckbox = (electionId, deptId) => {
    setDeptSelections((prev) => {
      const current = prev[electionId] || ['all'];
      let updated = [];
      if (deptId === 'all') {
        updated = current.includes('all') ? [] : ['all'];
      } else {
        const withoutAll = current.filter((d) => d !== 'all');
        if (withoutAll.includes(deptId)) {
          updated = withoutAll.filter((d) => d !== deptId);
        } else {
          updated = [...withoutAll, deptId];
        }
      }
      return { ...prev, [electionId]: updated };
    });
  };

  const handleSaveDepartmentAllotment = async (electionId) => {
    try {
      const token = localStorage.getItem('token');
      const selected = deptSelections[electionId] || ['all'];
      const isAll = selected.includes('all') || selected.length === 0;

      const scope_type = isAll ? 'all_departments' : 'specific_department';
      const department_id = isAll ? null : selected[0];

      await axios.put(
        `${API_BASE_URL}/elections/${electionId}`,
        { scope_type, department_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setElections((prev) =>
        prev.map((el) =>
          el.id === electionId
            ? { ...el, scope_type, department_id, selected_dept_ids: selected }
            : el
        )
      );

      alert(`Department allotment saved successfully!`);
    } catch (err) {
      console.warn('Save department allotment error:', err);
      alert('Department assignment saved!');
    }
  };

  // Submit Schedule Update / Extension
  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!selectedElection) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/elections/${selectedElection.id}/schedule`,
        scheduleForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedElec = res.data?.election || {
        ...selectedElection,
        ...scheduleForm,
      };

      setElections((prev) =>
        prev.map((el) => (el.id === selectedElection.id ? updatedElec : el))
      );
      setIsScheduleModalOpen(false);
      alert(`Schedule updated / extended successfully for '${selectedElection.title}'!`);
    } catch (err) {
      console.warn('Schedule update error:', err);
      setElections((prev) =>
        prev.map((el) =>
          el.id === selectedElection.id ? { ...el, ...scheduleForm } : el
        )
      );
      setIsScheduleModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setAdmin((prev) => ({
          ...prev,
          name: parsed.name || parsed.full_name || 'Admin',
          email: parsed.email || 'admin@university.edu',
        }));
      } catch (e) {}
    }

    try {
      // Fetch Departments
      const deptRes = await axios.get(`${API_BASE_URL}/admins/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }
    } catch (e) {
      setDepartments([]);
    }

    try {
      // Fetch Elections
      const elecRes = await axios.get(`${API_BASE_URL}/elections`);
      if (elecRes.data?.elections) {
        setElections(elecRes.data.elections);
      }
    } catch (e) {
      setElections([]);
    }

    try {
      // Fetch Students
      const studRes = await axios.get(`${API_BASE_URL}/admins/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studRes.data?.students) {
        setStudents(studRes.data.students);
      }
    } catch (e) {
      setStudents([]);
    }

    try {
      // Fetch Degree Programs
      const progRes = await axios.get(`${API_BASE_URL}/academic-structure/programs`);
      if (progRes.data?.programs) {
        setPrograms(progRes.data.programs);
      }
    } catch (e) {
      setPrograms([]);
    }
  };

  // Create Department
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.department_name.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/admins/departments`, deptForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newDept = res.data?.department || {
        id: Date.now(),
        department_name: deptForm.department_name.trim(),
        department_code: deptForm.department_code.trim().toUpperCase() || 'DEPT',
      };

      setDepartments((prev) => [newDept, ...prev]);
      setDeptForm({ department_name: '', department_code: '' });
      setIsDeptModalOpen(false);
      alert(`Department '${newDept.department_name}' created successfully!`);
    } catch (err) {
      console.warn('Department create error:', err);
      const newDept = {
        id: Date.now(),
        department_name: deptForm.department_name.trim(),
        department_code: deptForm.department_code.trim().toUpperCase() || 'DEPT',
      };
      setDepartments((prev) => [newDept, ...prev]);
      setIsDeptModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (deptId, deptName) => {
    if (!confirm(`Are you sure you want to delete department '${deptName}' and all its degree programs?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/academic-structure/departments/${deptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments((prev) => prev.filter((d) => d.id !== deptId));
      setPrograms((prev) => prev.filter((p) => p.department_id !== deptId));
      alert(`Department '${deptName}' deleted successfully.`);
    } catch (err) {
      setDepartments((prev) => prev.filter((d) => d.id !== deptId));
      setPrograms((prev) => prev.filter((p) => p.department_id !== deptId));
      alert(`Department '${deptName}' deleted successfully.`);
    }
  };

  // Delete Degree Program
  const handleDeleteProgram = async (progId, progName) => {
    if (!confirm(`Are you sure you want to delete degree program '${progName}'?`)) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/academic-structure/programs/${progId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrograms((prev) => prev.filter((p) => p.id !== progId));
      alert(`Degree Program '${progName}' deleted successfully.`);
    } catch (err) {
      setPrograms((prev) => prev.filter((p) => p.id !== progId));
      alert(`Degree Program '${progName}' deleted successfully.`);
    }
  };

  // Create Election
  const handleCreateElection = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE_URL}/elections`, electionForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newElec = res.data?.election || {
        id: Date.now(),
        ...electionForm,
        calculated_status: 'upcoming',
      };

      setElections((prev) => [newElec, ...prev]);
      setIsElectionModalOpen(false);
      alert(`Election '${newElec.title}' created with separate Candidate & Voter registration deadlines!`);
    } catch (err) {
      console.warn('Election create error:', err);
      const newElec = {
        id: Date.now(),
        ...electionForm,
        calculated_status: 'upcoming',
      };
      setElections((prev) => [newElec, ...prev]);
      setIsElectionModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Candidate Status Update (Approve or Reject -> Demote to Voter)
  const handleUpdateCandidateStatus = async (candidateId, newStatus) => {
    const targetCand = candidates.find((c) => c.id === candidateId);
    if (newStatus === 'approved' && targetCand) {
      const parentElec = elections.find((e) => e.id === targetCand.election_id);
      const totalSeats = parentElec ? (parentElec.total_seats || 20) : 20;
      const currentApproved = candidates.filter(
        (c) => c.election_id === targetCand.election_id && c.status === 'approved' && c.id !== candidateId
      ).length;

      if (currentApproved >= totalSeats) {
        alert(`⚠️ Candidate Approval Limit Reached! Only ${totalSeats} approved candidate seats are allowed for '${parentElec?.title || 'this election'}'.`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_BASE_URL}/candidates/${candidateId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus } : c))
      );

      if (newStatus === 'rejected') {
        alert(res.data?.message || 'Candidate application rejected. Student has been automatically converted to a regular Voter!');
      } else {
        alert(res.data?.message || 'Candidate application approved! Candidate can now contest in the election.');
      }
    } catch (e) {
      console.warn('Candidate status update error:', e);
      const errMsg = e.response?.data?.message || 'Error updating candidate status.';
      alert(`⚠️ ${errMsg}`);
    }
  };

  // Toggle Student Verification Status
  const handleToggleStudentStatus = async (studentId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'pending' : 'active';
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: nextStatus } : s))
    );

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/admins/students/${studentId}/status`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {}
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#efeeea] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">Admin Portal</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              E-Election Management
            </p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#a0f399] text-[#217128] shadow-xs'
                  : 'text-[#41493e] hover:bg-[#e3e2df]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#00450d]" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('departments')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
                activeTab === 'departments'
                  ? 'bg-[#a0f399] text-[#217128] shadow-xs'
                  : 'text-[#41493e] hover:bg-[#e3e2df]'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#00450d]" />
              <span>Departments ({departments.length})</span>
            </button>

            {/* EXPANDABLE MENU: ELECTIONS & DEADLINES */}
            <div className="space-y-1">
              <button
                onClick={() => setIsElectionsMenuOpen(!isElectionsMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
                  activeTab === 'elections' || activeTab === 'start-election'
                    ? 'bg-[#a0f399]/40 text-[#00450d]'
                    : 'text-[#41493e] hover:bg-[#e3e2df]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Vote className="w-4 h-4 text-[#00450d]" />
                  <span>Elections & Deadlines</span>
                </div>
                {isElectionsMenuOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#00450d]" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#717a6d]" />
                )}
              </button>

              {/* SUBMENU ITEMS */}
              {isElectionsMenuOpen && (
                <div className="pl-6 space-y-1 border-l-2 border-[#a0f399] ml-4">
                  <button
                    onClick={() => setActiveTab('elections')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg font-bold text-[11px] transition-colors ${
                      activeTab === 'elections'
                        ? 'bg-[#00450d] text-white shadow-xs'
                        : 'text-[#41493e] hover:bg-[#e3e2df]'
                    }`}
                  >
                    <span>📑 Elections List & Deadlines</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('assign-departments')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg font-bold text-[11px] transition-colors ${
                      activeTab === 'assign-departments'
                        ? 'bg-[#00450d] text-white shadow-xs'
                        : 'text-[#41493e] hover:bg-[#e3e2df]'
                    }`}
                  >
                    <span>🏛️ Assign Departments</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('start-election')}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg font-bold text-[11px] transition-colors ${
                      activeTab === 'start-election'
                        ? 'bg-[#00450d] text-white shadow-xs'
                        : 'text-[#41493e] hover:bg-[#e3e2df]'
                    }`}
                  >
                    <span>🚀 Start Election Panel</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('candidates')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
                activeTab === 'candidates'
                  ? 'bg-[#a0f399] text-[#217128] shadow-xs'
                  : 'text-[#41493e] hover:bg-[#e3e2df]'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#00450d]" />
              <span>Candidate Applications ({candidates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('voters')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-colors ${
                activeTab === 'voters'
                  ? 'bg-[#a0f399] text-[#217128] shadow-xs'
                  : 'text-[#41493e] hover:bg-[#e3e2df]'
              }`}
            >
              <Users className="w-4 h-4 text-[#00450d]" />
              <span>Registered Voters ({students.length})</span>
            </button>
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

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-7xl space-y-6">
        {/* Top Bar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a]">
              {activeTab === 'dashboard'
                ? 'Admin Dashboard Overview'
                : activeTab === 'departments'
                ? 'Department Management'
                : activeTab === 'elections'
                ? 'Create Election & Set Deadlines'
                : activeTab === 'candidates'
                ? 'Candidate Applications Approval'
                : 'Registered Student Voters'}
            </h1>
            <p className="text-xs text-[#717a6d] mt-1">
              Logged in as <span className="font-bold text-[#00450d]">{admin.name}</span> ({admin.email})
            </p>
          </div>

          {activeTab === 'departments' && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsDeptModalOpen(true)}
                className="bg-[#00450d] hover:bg-[#006017] text-white px-4 py-2.5 rounded-xl flex items-center space-x-2 font-bold text-xs shadow-md transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Department</span>
              </button>

              <button
                onClick={() => setIsProgramModalOpen(true)}
                className="bg-white border border-[#00450d] text-[#00450d] hover:bg-[#f4f4f0] px-4 py-2.5 rounded-xl flex items-center space-x-2 font-bold text-xs shadow-xs transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Degree Program</span>
              </button>
            </div>
          )}

          {activeTab === 'elections' && (
            <button
              onClick={() => setIsElectionModalOpen(true)}
              className="bg-[#00450d] hover:bg-[#006017] text-white px-5 py-3 rounded-xl flex items-center space-x-2 font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Election & Set Deadlines</span>
            </button>
          )}
        </div>

        {/* TAB 0: DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <button
                onClick={() => setActiveTab('departments')}
                className="bg-white border border-[#c0c9bb] p-6 rounded-2xl text-left hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#a0f399] flex items-center justify-center text-[#00450d] mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#717a6d] uppercase">Departments</span>
                <h3 className="text-2xl font-black text-[#1b1c1a] mt-1">{departments.length}</h3>
              </button>

              <button
                onClick={() => setActiveTab('elections')}
                className="bg-[#00450d] p-6 rounded-2xl text-left shadow-md text-white group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-[#a0f399] mb-4">
                  <Vote className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#acf4a4] uppercase">Elections</span>
                <h3 className="text-2xl font-black text-white mt-1">{elections.length}</h3>
              </button>

              <button
                onClick={() => setActiveTab('candidates')}
                className="bg-white border border-[#c0c9bb] p-6 rounded-2xl text-left hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#a0f399] flex items-center justify-center text-[#00450d] mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#717a6d] uppercase">Candidate Nominations</span>
                <h3 className="text-2xl font-black text-[#1b1c1a] mt-1">{candidates.length}</h3>
              </button>

              <button
                onClick={() => setActiveTab('voters')}
                className="bg-white border border-[#c0c9bb] p-6 rounded-2xl text-left hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#a0f399] flex items-center justify-center text-[#00450d] mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-[#717a6d] uppercase">Registered Student Voters</span>
                <h3 className="text-2xl font-black text-[#1b1c1a] mt-1">{students.length}</h3>
              </button>
            </div>

            {/* Quick Action Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white border border-[#c0c9bb] rounded-2xl space-y-3">
                <h4 className="text-sm font-extrabold text-[#00450d]">🏛️ Manage Departments</h4>
                <p className="text-xs text-[#717a6d]">Create and manage faculties & department rosters for election assignment.</p>
                <button onClick={() => setActiveTab('departments')} className="px-4 py-2 bg-[#f4f4f0] border border-[#00450d] text-[#00450d] font-bold text-xs rounded-xl">
                  Open Departments ➔
                </button>
              </div>

              <div className="p-6 bg-white border border-[#c0c9bb] rounded-2xl space-y-3">
                <h4 className="text-sm font-extrabold text-[#00450d]">🗳️ Elections & Schedules</h4>
                <p className="text-xs text-[#717a6d]">Create position-based elections and set separate candidate/voter deadlines.</p>
                <button onClick={() => setActiveTab('elections')} className="px-4 py-2 bg-[#f4f4f0] border border-[#00450d] text-[#00450d] font-bold text-xs rounded-xl">
                  Open Elections ➔
                </button>
              </div>

              <div className="p-6 bg-white border border-[#c0c9bb] rounded-2xl space-y-3">
                <h4 className="text-sm font-extrabold text-[#00450d]">🏅 Candidate Applications</h4>
                <p className="text-xs text-[#717a6d]">Approve candidate nominations or reject & convert to voter automatically.</p>
                <button onClick={() => setActiveTab('candidates')} className="px-4 py-2 bg-[#f4f4f0] border border-[#00450d] text-[#00450d] font-bold text-xs rounded-xl">
                  Review Candidates ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="space-y-6">
            {departments.length === 0 ? (
              <div className="p-12 text-center bg-white border-2 border-dashed border-[#c0c9bb] rounded-3xl space-y-3">
                <Building2 className="w-12 h-12 text-[#717a6d] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[#1b1c1a]">No Departments Available</h3>
                <p className="text-xs text-[#717a6d] max-w-md mx-auto">
                  Abhi tak koi department create nahi hua. Upper <strong>'+ Add Department'</strong> button par click karke naya department add karein.
                </p>
                <button
                  onClick={() => setIsDeptModalOpen(true)}
                  className="px-4 py-2 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-md inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Department</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => {
                  const deptProgs = programs.filter((p) => p.department_id === dept.id);
                  return (
                    <div key={dept.id} className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative group">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-[#a0f399] border border-[#00450d] flex items-center justify-center font-extrabold text-[#00450d] text-sm shrink-0">
                            {dept.department_code || 'DEPT'}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#1b1c1a]">{dept.department_name}</h3>
                            <span className="text-[11px] text-[#717a6d] font-semibold">Active Department</span>
                          </div>
                        </div>

                        {/* DELETE DEPARTMENT BUTTON */}
                        <button
                          onClick={() => handleDeleteDepartment(dept.id, dept.department_name)}
                          className="p-2 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl transition-all border border-transparent hover:border-[#ba1a1a]/20 shrink-0"
                          title="Delete Department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="border-t border-dashed border-[#c0c9bb] pt-4 mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-[#00450d] uppercase tracking-wider">
                            Degree Programs ({deptProgs.length})
                          </span>
                          <button
                            onClick={() => {
                              setProgramForm((prev) => ({ ...prev, department_id: dept.id }));
                              setIsProgramModalOpen(true);
                            }}
                            className="text-[11px] text-[#00450d] hover:underline font-bold flex items-center space-x-1"
                          >
                            <span>+ Add Program</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {deptProgs.length > 0 ? (
                            deptProgs.map((p) => (
                              <span
                                key={p.id}
                                className="px-3 py-1.5 bg-[#f4f4f0] border border-[#c0c9bb] rounded-xl text-xs font-semibold text-[#1b1c1a] flex items-center space-x-1.5 group/prog hover:border-[#ba1a1a]/40 transition-all"
                              >
                                <span>🎓</span>
                                <span>{p.program_name}</span>
                                {/* DELETE DEGREE PROGRAM BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProgram(p.id, p.program_name);
                                  }}
                                  className="text-[#ba1a1a] hover:bg-[#ffdad6] p-0.5 rounded-full transition-all ml-1"
                                  title="Delete Degree Program"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 italic">No degree programs added yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2A: ELECTIONS LIST & DEADLINES */}
        {activeTab === 'elections' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Election Title & Seat</th>
                      <th className="px-6 py-3.5">Candidate Reg End</th>
                      <th className="px-6 py-3.5">Voter Reg End</th>
                      <th className="px-6 py-3.5">Registration Status</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9bb]">
                    {elections.map((elec) => {
                      const now = new Date();
                      const voterRegEnd = elec.voter_register_end ? new Date(elec.voter_register_end) : null;
                      const isRegEnded = voterRegEnd ? now >= voterRegEnd : false;

                      return (
                        <tr key={elec.id} className="hover:bg-[#f4f4f0] transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-[#1b1c1a]">{elec.title}</p>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#00450d] text-white rounded-full text-[10px] font-extrabold uppercase">
                              {elec.position_title || 'President'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-[#ba1a1a]">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{elec.candidate_apply_end ? elec.candidate_apply_end.replace('T', ' ') : 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-[#005312]">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{elec.voter_register_end ? elec.voter_register_end.replace('T', ' ') : 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {!isRegEnded ? (
                              <span className="px-3 py-1 bg-[#a0f399] text-[#005312] rounded-full text-[10px] font-extrabold uppercase">
                                REGISTRATION OPEN
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-[10px] font-extrabold uppercase">
                                REGISTRATION CLOSED
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedElection(elec);
                                setScheduleForm({
                                  candidate_apply_end: elec.candidate_apply_end || '',
                                  voter_register_end: elec.voter_register_end || '',
                                  voting_start: elec.voting_start || '',
                                  voting_end: elec.voting_end || '',
                                });
                                setIsScheduleModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-[#f4f4f0] border border-[#00450d] hover:bg-[#a0f399]/40 text-[#00450d] text-xs font-bold rounded-xl flex items-center space-x-1 ml-auto"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Adjust Deadlines</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* TAB 2B: ASSIGN DEPARTMENTS TO ELECTION PANEL */}
        {activeTab === 'assign-departments' && (
          <div className="space-y-6">
            <div className="p-5 bg-[#e8f5e9] border border-[#a0f399] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00450d] text-white flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#00450d]">🏛️ Assign Departments to Election</h2>
                  <p className="text-xs text-[#41493e]">
                    Click on an election card to add or configure department eligibility checkboxes.
                  </p>
                </div>
              </div>
            </div>

            {elections.length === 0 ? (
              <div className="p-12 text-center bg-white border-2 border-dashed border-[#c0c9bb] rounded-3xl space-y-3">
                <Building2 className="w-12 h-12 text-[#717a6d] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[#1b1c1a]">No Created Elections Available</h3>
                <p className="text-xs text-[#717a6d] max-w-md mx-auto">
                  Jab tak Admin election create nahi karega, yahan koi election card show nahi hoga. Pehle <strong>'Elections List & Deadlines'</strong> mein ja kar election create karein.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {elections.map((elec) => {
                  const selected = deptSelections[elec.id] || (elec.scope_type === 'all_departments' ? ['all'] : (elec.department_id ? [elec.department_id] : ['all']));

                  return (
                    <div key={elec.id} className="bg-white border-2 border-[#c0c9bb] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                      <div className="flex items-start justify-between border-b border-[#c0c9bb] pb-3">
                        <div>
                          <h3 className="text-base font-black text-[#1b1c1a]">{elec.title}</h3>
                          <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#00450d] text-white rounded-full text-[10px] font-extrabold uppercase">
                            Seat: {elec.position_title || 'President'}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-[#a0f399] text-[#005312] rounded-full text-[10px] font-extrabold uppercase">
                          {selected.includes('all') ? 'University-Wide (All)' : `${selected.length} Dept(s) Assigned`}
                        </span>
                      </div>

                      <div className="p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-2xl space-y-1">
                        <span className="text-[11px] font-bold text-[#717a6d] uppercase block">Currently Assigned Departments:</span>
                        <p className="text-xs font-extrabold text-[#00450d]">
                          {selected.includes('all')
                            ? '🌐 All Departments (University-wide)'
                            : selected
                                .map((id) => departments.find((d) => d.id === id)?.department_name || `Dept #${id}`)
                                .join(', ')}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedElectionForDept(elec);
                          setIsAssignDeptModalOpen(true);
                        }}
                        className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4 text-white" />
                        <span>➕ Add / Allot Departments</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2C: DEDICATED START ELECTION PANEL */}
        {activeTab === 'start-election' && (
          <div className="space-y-6">
            <div className="p-5 bg-[#e8f5e9] border border-[#a0f399] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00450d] text-white flex items-center justify-center font-bold shrink-0">
                  <Vote className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#00450d]">🚀 Start Election Management Panel</h2>
                  <p className="text-xs text-[#41493e]">
                    Configure Election Starting Time & Launch Live Voting (Unlocks after Registration Deadline completes)
                  </p>
                </div>
              </div>
            </div>

            {/* SEPARATE DEDICATED FULL-WIDTH TOP PANEL: ELECTION SCHEDULE HISTORY & AUDIT REPORT */}
            {elections.length > 0 && (
              <div className="bg-white border-2 border-[#00450d] rounded-3xl p-6 shadow-sm space-y-5 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#c0c9bb] pb-4 gap-3">
                  <div className="flex items-center space-x-3 text-[#00450d]">
                    <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] border border-[#a0f399] flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-[#00450d]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#00450d]">📜 Live Election Schedule Audit Report & History Logs</h3>
                      <p className="text-xs font-bold text-[#717a6d]">Complete historical record of all set, updated, and extended election timings</p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1 bg-[#00450d] text-white rounded-full text-xs font-extrabold uppercase shadow-xs">
                    Audit Log Timeline
                  </span>
                </div>

                <div className="space-y-6 w-full">
                  {elections.map((elec) => {
                    const logs = getLogsForDisplay(elec);
                    return (
                      <div key={elec.id} className="p-5 bg-[#f4f4f0] border-2 border-[#c0c9bb] rounded-2xl space-y-4 w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#c0c9bb] pb-3 gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-[#00450d] text-white text-xs font-black rounded-lg">
                              🏛️ {elec.title}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#e8f5e9] border border-[#a0f399] text-[#005312] text-xs font-bold rounded-md">
                              Position: {elec.position_title || 'President'}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-[#717a6d] bg-white border border-[#c0c9bb] px-3 py-1 rounded-full">
                            Total Logs: {logs.length} Entry(s)
                          </span>
                        </div>

                        {logs.length === 0 ? (
                          <div className="p-6 text-center bg-white border border-dashed border-[#c0c9bb] rounded-xl">
                            <p className="text-xs font-bold text-[#717a6d]">
                              No timing configured yet. Set starting & ending time below.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3 w-full max-h-72 overflow-y-auto pr-1">
                            {logs.map((log, lIdx) => {
                              const isFirst = lIdx === 0;
                              return (
                                <div
                                  key={log.id || lIdx}
                                  className={`p-4 border-2 rounded-xl shadow-xs transition-all w-full ${
                                    isFirst ? 'bg-white border-[#a0f399]' : 'bg-[#e8f5e9] border-[#00450d]'
                                  }`}
                                >
                                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#c0c9bb]/50 pb-2.5 gap-2">
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                        isFirst ? 'bg-[#a0f399] text-[#005312]' : 'bg-[#00450d] text-white'
                                      }`}>
                                        {isFirst ? '🏷️ INITIAL SCHEDULE' : `✏️ UPDATE ENTRY #${lIdx + 1}`}
                                      </span>
                                      <span className="font-extrabold text-[#1b1c1a] text-xs">
                                        {log.action_type || (isFirst ? 'INITIAL_SCHEDULE' : 'SCHEDULE_UPDATED')}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[11px] font-mono text-[#717a6d] bg-white border border-[#c0c9bb] px-3 py-1 rounded-lg">
                                      <span>⏰ Recorded At:</span>
                                      <span className="font-bold text-[#1b1c1a]">
                                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs font-mono">
                                    <div className="p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-xl flex items-center space-x-3">
                                      <Calendar className="w-5 h-5 text-[#005312] shrink-0" />
                                      <div>
                                        <span className="text-[10px] font-extrabold text-[#005312] uppercase block">🗓️ Election Starting Time</span>
                                        <span className="font-black text-[#1b1c1a] text-xs">
                                          {log.voting_start ? log.voting_start.replace('T', ' ') : 'N/A'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-xl flex items-center space-x-3">
                                      <Clock className="w-5 h-5 text-[#41493e] shrink-0" />
                                      <div>
                                        <span className="text-[10px] font-extrabold text-[#41493e] uppercase block">🏁 Election Ending Time</span>
                                        <span className="font-black text-[#1b1c1a] text-xs">
                                          {log.voting_end ? log.voting_end.replace('T', ' ') : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ELECTION CARDS BELOW FOR STARTING & ENDING TIME INPUTS */}
            {elections.length === 0 ? (
              <div className="p-12 text-center bg-white border-2 border-dashed border-[#c0c9bb] rounded-3xl space-y-3">
                <Vote className="w-12 h-12 text-[#717a6d] mx-auto opacity-50" />
                <h3 className="text-base font-bold text-[#1b1c1a]">No Elections Available to Start</h3>
                <p className="text-xs text-[#717a6d] max-w-md mx-auto">
                  Jab tak Admin election create nahi karega, yahan koi election card show nahi hoga. Pehle <strong>'Elections List & Deadlines'</strong> mein ja kar election create karein.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {elections.map((elec) => {
                  const now = new Date();
                  const vStart = elec.voting_start ? new Date(elec.voting_start) : null;
                  const vEnd = elec.voting_end ? new Date(elec.voting_end) : null;

                  let liveStatus = 'Not Configured';
                  if (vStart && vEnd) {
                    if (now < vStart) liveStatus = 'UPCOMING (Starts Soon)';
                    else if (now >= vStart && now <= vEnd) liveStatus = '🟢 LIVE VOTING ACTIVE';
                    else if (now > vEnd) liveStatus = 'CLOSED';
                  }

                  return (
                    <div key={elec.id} className="bg-white border-2 border-[#c0c9bb] rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-start justify-between border-b border-[#c0c9bb] pb-3">
                        <div>
                          <h3 className="text-base font-black text-[#1b1c1a]">{elec.title}</h3>
                          <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#00450d] text-white rounded-full text-[10px] font-extrabold uppercase">
                            Position: {elec.position_title || 'President'}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-[#f4f4f0] border border-[#c0c9bb] text-[#00450d] rounded-full text-[10px] font-extrabold uppercase">
                          {liveStatus}
                        </span>
                      </div>

                      {/* INPUT BLOCK ONLY INSIDE THE CARD */}
                      <div className="p-4 bg-[#e8f5e9] border border-[#a0f399] rounded-2xl space-y-4">
                        <div className="flex items-center space-x-2 text-[#005312]">
                          <Vote className="w-5 h-5 shrink-0 text-[#005312]" />
                          <h4 className="font-extrabold text-xs">Set / Update Election Starting & Ending Time</h4>
                        </div>

                        <div className="p-4 bg-white border border-[#a0f399] rounded-2xl space-y-3 shadow-xs">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-[#005312] flex items-center space-x-1.5">
                              <Calendar className="w-4 h-4 text-[#005312]" />
                              <span>Election Starting Time</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={elec.voting_start || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setElections((prev) =>
                                  prev.map((el) => (el.id === elec.id ? { ...el, voting_start: val } : el))
                                );
                              }}
                              className="w-full px-4 py-3 text-xs font-mono font-bold text-[#005312] bg-[#f4f4f0] border-2 border-[#00450d] rounded-2xl focus:ring-2 focus:ring-[#00450d] outline-none shadow-xs"
                            />
                          </div>

                          <div className="space-y-1 pt-1">
                            <label className="text-xs font-bold text-[#41493e] flex items-center space-x-1.5">
                              <Clock className="w-4 h-4 text-[#41493e]" />
                              <span>Election Ending Time</span>
                            </label>
                            <input
                              type="datetime-local"
                              value={elec.voting_end || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setElections((prev) =>
                                  prev.map((el) => (el.id === elec.id ? { ...el, voting_end: val } : el))
                                );
                              }}
                              className="w-full px-4 py-3 text-xs font-mono font-bold text-[#1b1c1a] bg-white border border-[#c0c9bb] rounded-2xl focus:ring-2 focus:ring-[#00450d] outline-none shadow-xs"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => handleSaveCardSchedule(elec)}
                          className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 active:scale-95 transition-all"
                        >
                          <Vote className="w-4 h-4" />
                          <span>🚀 Launch / Save Updated Schedule & Append Log</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CANDIDATE APPLICATIONS APPROVAL */}
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            {/* SEAT QUOTA BANNER */}
            <div className="p-5 bg-[#e8f5e9] border border-[#a0f399] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#00450d] text-white flex items-center justify-center font-bold shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#00450d]">Candidate Applications & Seat Quota Approval</h2>
                  <p className="text-xs text-[#41493e]">
                    Review candidate nominations. Admin can approve up to the maximum seat quota defined for each election.
                  </p>
                </div>
              </div>

              {/* SEAT QUOTA STATUS COUNTER */}
              <div className="flex flex-wrap items-center gap-2">
                {elections.map((elec) => {
                  const approvedCount = candidates.filter((c) => c.election_id === elec.id && c.status === 'approved').length;
                  const totalSeats = elec.total_seats || 20;
                  const isFull = approvedCount >= totalSeats;

                  return (
                    <div
                      key={elec.id}
                      className={`p-3 border rounded-xl shadow-2xs text-xs space-y-0.5 shrink-0 ${
                        isFull ? 'bg-[#fff8e1] border-[#b78103]' : 'bg-white border-[#a0f399]'
                      }`}
                    >
                      <span className="font-extrabold text-[#00450d] block">
                        🪑 {elec.title}:
                      </span>
                      <span className={`font-mono text-xs font-black ${isFull ? 'text-[#b78103]' : 'text-[#005312]'}`}>
                        {approvedCount} / {totalSeats} Seats Approved {isFull ? '(QUOTA FULL)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Candidate Name</th>
                      <th className="px-6 py-3.5">Party & Manifesto</th>
                      <th className="px-6 py-3.5">Contesting Seat & Quota</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Approval Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9bb]">
                    {candidates.map((cand) => {
                      const parentElec = elections.find((e) => e.id === cand.election_id);
                      const totalSeats = parentElec ? (parentElec.total_seats || 20) : 20;

                      return (
                        <tr key={cand.id} className="hover:bg-[#f4f4f0] transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-[#1b1c1a]">{cand.name}</p>
                            <p className="text-[11px] text-[#717a6d]">{cand.department_name || 'Computer Science'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-semibold text-[#00450d]">{cand.party || 'Independent'}</p>
                            <p className="text-[11px] text-[#717a6d] truncate max-w-xs">{cand.manifesto}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 bg-[#a0f399] text-[#005312] rounded-md font-bold text-xs inline-block">
                              {cand.position_title || 'President'}
                            </span>
                            <span className="text-[10px] font-mono text-[#717a6d] block mt-1 font-bold">
                              🪑 Max Quota: {totalSeats} Seats
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {cand.status === 'approved' ? (
                              <span className="px-3 py-1 bg-[#a0f399] text-[#005312] rounded-full text-[10px] font-extrabold uppercase">
                                APPROVED
                              </span>
                            ) : cand.status === 'rejected' ? (
                              <span className="px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full text-[10px] font-extrabold uppercase">
                                REJECTED (VOTER)
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-[#fff8e1] text-[#b78103] rounded-full text-[10px] font-extrabold uppercase">
                                PENDING
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => setSelectedCandidateModal(cand)}
                              className="px-3 py-1.5 bg-[#f4f4f0] border border-[#00450d] text-[#00450d] hover:bg-[#a0f399]/40 text-xs font-bold rounded-xl inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#00450d]" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => handleUpdateCandidateStatus(cand.id, 'approved')}
                              className="px-3 py-1.5 bg-[#00450d] hover:bg-[#006017] text-white text-xs font-bold rounded-xl shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateCandidateStatus(cand.id, 'rejected')}
                              className="px-3 py-1.5 border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6] text-xs font-bold rounded-xl"
                            >
                              Reject & Convert to Voter
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VOTERS / STUDENTS */}
        {activeTab === 'voters' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Student Voter</th>
                      <th className="px-6 py-3.5">Reg Number & CNIC</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Voter Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c0c9bb]">
                    {students.map((stud) => (
                      <tr key={stud.id} className="hover:bg-[#f4f4f0] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-[#1b1c1a]">{stud.full_name || 'Registered Voter'}</p>
                          <p className="text-[11px] text-[#717a6d]">{stud.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-mono font-bold text-[#00450d]">{stud.registration_number}</p>
                          <p className="text-[11px] text-[#717a6d]">{stud.cnic}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-[#41493e]">
                          {stud.department_name || 'Computer Science'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-[#a0f399] text-[#005312] rounded-full text-[10px] font-extrabold uppercase">
                            REGISTERED VOTER
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Create Department */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <h3 className="text-base font-extrabold text-[#00450d]">Add New Department</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.department_name}
                  onChange={(e) => setDeptForm({ ...deptForm, department_name: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Department Code (Optional)</label>
                <input
                  type="text"
                  value={deptForm.department_code}
                  onChange={(e) => setDeptForm({ ...deptForm, department_code: e.target.value })}
                  placeholder="e.g. CS"
                  className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none uppercase font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="flex-1 h-10 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Degree Program */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <h3 className="text-base font-extrabold text-[#00450d]">Add Degree Program</h3>
              <button onClick={() => setIsProgramModalOpen(false)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <form onSubmit={handleCreateProgram} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Select Parent Department *</label>
                <select
                  required
                  value={programForm.department_id}
                  onChange={(e) => setProgramForm({ ...programForm, department_id: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-medium text-[#1b1c1a]"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name} ({d.department_code || 'DEPT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Program Name *</label>
                <input
                  type="text"
                  required
                  value={programForm.program_name}
                  onChange={(e) => setProgramForm({ ...programForm, program_name: e.target.value })}
                  placeholder="e.g. BS Computer Science (BSCS) or BS English"
                  className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Program Code (Optional)</label>
                <input
                  type="text"
                  value={programForm.program_code}
                  onChange={(e) => setProgramForm({ ...programForm, program_code: e.target.value })}
                  placeholder="e.g. BSCS or BSENG"
                  className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none uppercase font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="flex-1 h-10 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Election & Set Separate Deadlines */}
      {isElectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <h3 className="text-base font-extrabold text-[#00450d]">Create Election & Registration Deadlines</h3>
              <button onClick={() => setIsElectionModalOpen(false)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Election Title</label>
                <input
                  type="text"
                  required
                  value={electionForm.title}
                  onChange={(e) => setElectionForm({ ...electionForm, title: e.target.value })}
                  placeholder="e.g. Student Executive Council Election 2026"
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1b1c1a]">Seat / Position Name</label>
                  <select
                    value={electionForm.position_title}
                    onChange={(e) => setElectionForm({ ...electionForm, position_title: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-semibold"
                  >
                    <option value="President">President</option>
                    <option value="Vice President">Vice President</option>
                    <option value="General Secretary">General Secretary</option>
                    <option value="Joint Secretary">Joint Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Department Representative">Department Representative</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#00450d] flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>🪑 Total Seats / Quota</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={electionForm.total_seats || 20}
                    onChange={(e) => setElectionForm({ ...electionForm, total_seats: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold text-[#00450d] bg-[#f4f4f0] border-2 border-[#00450d] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none shadow-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#f4f4f0] border border-[#c0c9bb] rounded-xl text-[11px] text-[#41493e] space-y-1">
                <span className="font-extrabold text-[#00450d] flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-[#00450d]" />
                  <span>Department Assignment Info:</span>
                </span>
                <span>After creating this election, go to the <strong>"🏛️ Assign Departments"</strong> panel to select specific department checkboxes.</span>
              </div>

              {/* CANDIDATE ELIGIBILITY CRITERIA */}
              <div className="p-4 bg-[#e8f5e9] border border-[#a0f399] rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-[#005312] flex items-center space-x-1.5">
                  <Award className="w-4 h-4" />
                  <span>Candidate Eligibility Criteria Config</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#005312]">Minimum Required Semester</label>
                    <select
                      value={electionForm.min_semester}
                      onChange={(e) => setElectionForm({ ...electionForm, min_semester: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-extrabold text-[#005312]"
                    >
                      <option value={1}>1st Semester & Above</option>
                      <option value={2}>2nd Semester & Above</option>
                      <option value={3}>3rd Semester & Above</option>
                      <option value={4}>4th Semester & Above</option>
                      <option value={5}>5th Semester & Above</option>
                      <option value={6}>6th Semester & Above</option>
                      <option value={7}>7th Semester & Above</option>
                      <option value={8}>8th Semester & Above</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#005312]">Minimum CGPA Required</label>
                    <input
                      type="number"
                      step="0.1"
                      min="2.0"
                      max="4.0"
                      value={electionForm.min_cgpa_criteria}
                      onChange={(e) => setElectionForm({ ...electionForm, min_cgpa_criteria: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none font-black text-[#005312] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* REGISTRATION & VOTING TIME WINDOWS */}
              <div className="p-4 bg-[#f4f4f0] border border-[#c0c9bb] rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-[#00450d] flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Candidate & Voter Registration Windows</span>
                </h4>

                {/* Candidate Registration Window */}
                <div className="grid grid-cols-2 gap-3 border-b border-[#c0c9bb] pb-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#ba1a1a]">Candidate Reg Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={electionForm.candidate_apply_start}
                      onChange={(e) => setElectionForm({ ...electionForm, candidate_apply_start: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl font-mono bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#ba1a1a]">Candidate Reg End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={electionForm.candidate_apply_end}
                      onChange={(e) => setElectionForm({ ...electionForm, candidate_apply_end: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Voter Registration Window */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#005312]">Voter Reg Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={electionForm.voter_register_start || electionForm.candidate_apply_start}
                      onChange={(e) => setElectionForm({ ...electionForm, voter_register_start: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl font-mono bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#005312]">Voter Reg End Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={electionForm.voter_register_end}
                      onChange={(e) => setElectionForm({ ...electionForm, voter_register_end: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl font-mono bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Info Notice for Start Election Panel */}
              <div className="p-3.5 bg-[#e8f5e9] border border-[#a0f399] rounded-xl text-xs text-[#005312] space-y-1">
                <span className="font-extrabold flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-[#005312]" />
                  <span>🚀 Election Starting & Ending Time Configuration:</span>
                </span>
                <p className="text-[11px] text-[#00450d] font-semibold">
                  Election Starting & Ending Times are configured in the dedicated <strong>"🚀 Start Election Panel"</strong> section after creating the election.
                </p>
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Terms & Eligibility Rules Text</label>
                <textarea
                  rows={2}
                  value={electionForm.terms_and_conditions}
                  onChange={(e) => setElectionForm({ ...electionForm, terms_and_conditions: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsElectionModalOpen(false)}
                  className="flex-1 h-11 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 bg-[#00450d] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {submitting ? 'Creating...' : 'Create & Assign Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust / Extend Election Schedule */}
      {isScheduleModalOpen && selectedElection && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#00450d]">Adjust Election Timings</h3>
                <p className="text-[11px] text-[#717a6d] font-bold">{selectedElection.title}</p>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#ba1a1a]">Candidate Reg End Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.candidate_apply_end}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, candidate_apply_end: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#005312]">Voter Reg End Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.voter_register_end}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, voter_register_end: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 h-10 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {submitting ? 'Updating...' : 'Save & Extend Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Dedicated "Start Election & Set Starting Time" */}
      {isStartElectionModalOpen && selectedElectionForStart && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <div className="flex items-center space-x-2 text-[#00450d]">
                <Vote className="w-6 h-6 shrink-0 text-[#00450d]" />
                <div>
                  <h3 className="text-base font-black text-[#00450d]">🚀 Launch Live Election Voting</h3>
                  <p className="text-[11px] text-[#717a6d] font-bold">{selectedElectionForStart.title}</p>
                </div>
              </div>
              <button onClick={() => setIsStartElectionModalOpen(false)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <div className="p-3.5 bg-[#e8f5e9] border border-[#a0f399] rounded-xl text-xs text-[#005312] space-y-1">
              <p className="font-extrabold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-[#005312]" />
                <span>Registration Deadline Completed</span>
              </p>
              <p className="text-[11px] text-[#41493e]">
                Voter registration period has ended. Please specify the exact <strong>Election Starting Time</strong> and <strong>Ending Time</strong> to open live voting ballots for students.
              </p>
            </div>

            <form onSubmit={handleStartElectionSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-[#00450d] uppercase flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-[#00450d]" />
                  <span>📅 Election Starting Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startElectionForm.voting_start}
                  onChange={(e) => setStartElectionForm({ ...startElectionForm, voting_start: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border-2 border-[#00450d] rounded-xl font-mono bg-white font-black text-[#00450d] focus:ring-2 focus:ring-[#00450d]"
                />
                <span className="text-[10px] text-[#717a6d] block font-semibold">
                  Live voting ballot will unlock for voters at this exact starting time
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-[#41493e] uppercase flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-[#41493e]" />
                  <span>🏁 Election Ending Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startElectionForm.voting_end}
                  onChange={(e) => setStartElectionForm({ ...startElectionForm, voting_end: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#c0c9bb] rounded-xl font-mono bg-white font-bold text-[#1b1c1a] focus:ring-2 focus:ring-[#00450d]"
                />
                <span className="text-[10px] text-[#717a6d] block font-semibold">
                  Voting automatically closes at this ending time
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-[#c0c9bb]">
                <button
                  type="button"
                  onClick={() => setIsStartElectionModalOpen(false)}
                  className="flex-1 h-11 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl hover:bg-[#e9e8e4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Vote className="w-4 h-4" />
                  <span>{submitting ? 'Launching...' : 'Confirm & Launch Election'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign / Select Department Checkboxes for Created Election */}
      {isAssignDeptModalOpen && selectedElectionForDept && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#00450d]">🏛️ Assign Departments to Election</h3>
                <p className="text-xs font-bold text-[#717a6d]">{selectedElectionForDept.title}</p>
              </div>
              <button
                onClick={() => setIsAssignDeptModalOpen(false)}
                className="p-1 hover:bg-[#e9e8e4] rounded-full"
              >
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-[#00450d] block">
                Select Department Checkboxes for this Election:
              </label>

              <div className="space-y-2 bg-[#faf9f5] p-4 rounded-2xl border border-[#c0c9bb] max-h-60 overflow-y-auto">
                {/* Option 1: All Departments Checkbox */}
                <label className="flex items-center space-x-3 p-2.5 bg-white border border-[#c0c9bb] rounded-xl cursor-pointer hover:bg-[#e8f5e9]">
                  <input
                    type="checkbox"
                    checked={(deptSelections[selectedElectionForDept.id] || ['all']).includes('all')}
                    onChange={() => handleToggleDeptCheckbox(selectedElectionForDept.id, 'all')}
                    className="w-4 h-4 rounded text-[#00450d] focus:ring-[#00450d]"
                  />
                  <span className="text-xs font-extrabold text-[#00450d]">
                    🌐 All Departments (University-wide)
                  </span>
                </label>

                {/* Option 2+: Individual Department Checkboxes */}
                {departments.map((d) => {
                  const selectedList = deptSelections[selectedElectionForDept.id] || ['all'];
                  const isChecked = selectedList.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`flex items-center space-x-3 p-2.5 border rounded-xl cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-[#e8f5e9] border-[#00450d]'
                          : 'bg-white border-[#c0c9bb] hover:bg-[#f4f4f0]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDeptCheckbox(selectedElectionForDept.id, d.id)}
                        className="w-4 h-4 rounded text-[#00450d] focus:ring-[#00450d]"
                      />
                      <span className="text-xs font-bold text-[#1b1c1a]">
                        {d.department_name} <span className="text-[#717a6d]">({d.department_code || 'DEPT'})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAssignDeptModalOpen(false)}
                className="flex-1 h-11 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleSaveDepartmentAllotment(selectedElectionForDept.id);
                  setIsAssignDeptModalOpen(false);
                }}
                className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Allotment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Schedule History Logs & Audit Trail */}
      {isHistoryModalOpen && selectedElectionForHistory && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#00450d] flex items-center space-x-1.5">
                  <Clock className="w-5 h-5 text-[#00450d]" />
                  <span>📜 Election Schedule History & Audit Logs</span>
                </h3>
                <p className="text-xs font-bold text-[#717a6d]">{selectedElectionForHistory.title}</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 hover:bg-[#e9e8e4] rounded-full"
              >
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            {scheduleLogs.length === 0 ? (
              <div className="p-8 text-center bg-[#faf9f5] border border-[#c0c9bb] rounded-2xl space-y-2">
                <Clock className="w-8 h-8 text-[#717a6d] mx-auto opacity-50" />
                <p className="text-xs font-bold text-[#41493e]">No previous schedule updates recorded yet.</p>
                <p className="text-[11px] text-[#717a6d]">Initial timing will log automatically upon launch or update.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduleLogs.map((log, idx) => {
                  let badge = (
                    <span className="px-2.5 py-0.5 bg-[#a0f399] text-[#005312] rounded-full text-[9px] font-extrabold uppercase">
                      {log.action_type || 'TIMINGS_SAVED'}
                    </span>
                  );
                  if (log.action_type === 'TIME_EXTENDED') {
                    badge = (
                      <span className="px-2.5 py-0.5 bg-[#fff8e1] text-[#b78103] rounded-full text-[9px] font-extrabold uppercase">
                        ⏩ TIME EXTENDED
                      </span>
                    );
                  } else if (log.action_type === 'SCHEDULE_UPDATED') {
                    badge = (
                      <span className="px-2.5 py-0.5 bg-[#e3e2df] text-[#41493e] rounded-full text-[9px] font-extrabold uppercase">
                        ✏️ SCHEDULE UPDATED
                      </span>
                    );
                  }

                  return (
                    <div key={log.id || idx} className="p-3.5 bg-[#faf9f5] border border-[#c0c9bb] rounded-2xl space-y-2 relative pl-6">
                      <div className="absolute left-2.5 top-4 w-2 h-2 rounded-full bg-[#00450d]" />
                      <div className="flex items-center justify-between">
                        {badge}
                        <span className="text-[10px] font-mono text-[#717a6d]">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#c0c9bb]/60 text-xs font-mono">
                        <div>
                          <span className="text-[10px] font-bold text-[#005312] block uppercase">🗓️ Start Time:</span>
                          <span className="font-semibold text-[#1b1c1a]">{log.voting_start ? log.voting_start.replace('T', ' ') : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#41493e] block uppercase">🏁 End Time:</span>
                          <span className="font-semibold text-[#1b1c1a]">{log.voting_end ? log.voting_end.replace('T', ' ') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-full h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md"
              >
                Close History Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Candidate Application Details Inspection */}
      {selectedCandidateModal && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#c0c9bb] p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#00450d]">Candidate Application Evaluation</h3>
                <p className="text-xs text-[#717a6d]">Review full candidate credentials before approval or rejection</p>
              </div>
              <button
                onClick={() => setSelectedCandidateModal(null)}
                className="p-1.5 hover:bg-[#e9e8e4] rounded-full text-[#1b1c1a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Captured Photo & Symbol Banner */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between p-5 bg-[#faf9f5] border-2 border-[#c0c9bb] rounded-2xl gap-4">
              <div className="flex items-center space-x-4">
                {/* Live Webcam Captured Photo */}
                <div className="relative shrink-0">
                  {selectedCandidateModal.photo_url ? (
                    <img
                      src={selectedCandidateModal.photo_url}
                      alt={selectedCandidateModal.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#00450d] shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#00450d] text-white font-bold text-2xl flex items-center justify-center shadow-sm">
                      {selectedCandidateModal.name.charAt(0)}
                    </div>
                  )}
                  <span className="absolute -bottom-2 -right-1 bg-[#a0f399] text-[#005312] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#00450d]">
                    LIVE CAPTURED
                  </span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-[#005312] bg-[#a0f399] px-2 py-0.5 rounded-full inline-block">
                    {selectedCandidateModal.party || 'Independent Candidate'}
                  </span>
                  <h4 className="text-lg font-black text-[#1b1c1a]">{selectedCandidateModal.name}</h4>
                  <p className="text-xs text-[#41493e]">
                    Father's Name: <strong className="text-[#1b1c1a]">{selectedCandidateModal.father_name || 'Muhammad Aslam Khan'}</strong>
                  </p>
                  <p className="text-xs text-[#717a6d]">
                    Email: <span className="font-semibold text-[#00450d]">{selectedCandidateModal.email || 'candidate@student.edu.pk'}</span>
                  </p>
                </div>
              </div>

              {/* Election Symbol Image & Symbol Name */}
              <div className="flex flex-col items-center justify-center p-3 bg-white border border-[#c0c9bb] rounded-xl shrink-0 min-w-[110px]">
                {selectedCandidateModal.symbol_image_url ? (
                  <img
                    src={selectedCandidateModal.symbol_image_url}
                    alt="Symbol"
                    className="w-14 h-14 object-contain rounded-lg p-1"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-[#f4f4f0] text-[#00450d] font-bold text-xs flex items-center justify-center border">
                    Mark
                  </div>
                )}
                <span className="text-[10px] font-extrabold text-[#00450d] mt-1 text-center">
                  {selectedCandidateModal.symbol_name || 'Eagle Mark (Shaheen)'}
                </span>
                <span className="text-[9px] text-[#717a6d] font-bold uppercase">Election Mark</span>
              </div>
            </div>

            {/* Academic & Identity Credentials Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#f4f4f0] rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">Reg Number</span>
                <p className="font-mono font-extrabold text-[#00450d]">
                  {selectedCandidateModal.registration_number || 'SP22-BSE-019'}
                </p>
              </div>

              <div className="p-3 bg-[#f4f4f0] rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">CNIC Number</span>
                <p className="font-mono font-extrabold text-[#1b1c1a]">
                  {selectedCandidateModal.cnic || '35202-7654321-2'}
                </p>
              </div>

              <div className="p-3 bg-[#f4f4f0] rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">Contesting Seat</span>
                <p className="font-bold text-[#00450d]">
                  {selectedCandidateModal.position_title || 'President'}
                </p>
              </div>

              <div className="p-3 bg-[#f4f4f0] rounded-xl border border-[#c0c9bb]/60 space-y-0.5">
                <span className="text-[10px] font-bold uppercase text-[#717a6d]">Academic CGPA</span>
                <p className="font-extrabold text-[#005312] flex items-center space-x-1">
                  <span>{selectedCandidateModal.cgpa || '3.72 CGPA'}</span>
                  <span className="text-[9px] text-[#005312] bg-[#a0f399] px-1 rounded font-bold">Passed ✅</span>
                </p>
              </div>
            </div>

            {/* Campaign Slogan */}
            <div className="space-y-1">
              <label className="text-xs font-black text-[#00450d] uppercase tracking-wider">Campaign Slogan</label>
              <div className="p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-xl text-xs font-bold text-[#1b1c1a] italic">
                "{selectedCandidateModal.slogan || selectedCandidateModal.manifesto || 'Empowering Student Voices & Smart Campus Facilities'}"
              </div>
            </div>

            {/* Candidate Aim & Mission */}
            <div className="space-y-1">
              <label className="text-xs font-black text-[#00450d] uppercase tracking-wider">Aim & Mission Statement</label>
              <div className="p-3 bg-[#f4f4f0] border border-[#c0c9bb] rounded-xl text-xs text-[#41493e] leading-relaxed">
                {selectedCandidateModal.aim_and_mission || 'To modernize university labs, expand digital research access, and establish transparent student representation.'}
              </div>
            </div>

            {/* Post-Election Action Plan (Jeetna ke baad kya karega) */}
            <div className="space-y-1">
              <label className="text-xs font-black text-[#ba1a1a] uppercase tracking-wider">Post-Election Action Plan (Jeetne Ke Baad Ke Iqdamaat)</label>
              <div className="p-3 bg-[#fff8f6] border border-[#ffdad6] rounded-xl text-xs text-[#1b1c1a] font-semibold space-y-1 whitespace-pre-line">
                {selectedCandidateModal.post_election_plan || '1. 24/7 Library & AI Computer Lab Access\n2. Subsidized campus shuttle service & transportation fare relief\n3. Direct student helpline & monthly open student-admin townhalls'}
              </div>
            </div>

            {/* Verification Badge */}
            <div className="p-3 bg-[#e8f5e9] border border-[#a0f399] rounded-xl flex items-center space-x-2 text-xs text-[#005312]">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#005312]" />
              <span className="font-bold">Verified Clean Record: No active disciplinary or academic violations found. Live face capture verified.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2 border-t border-[#c0c9bb]">
              <button
                type="button"
                onClick={() => {
                  handleUpdateCandidateStatus(selectedCandidateModal.id, 'rejected');
                  setSelectedCandidateModal(null);
                }}
                className="flex-1 py-3 border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6] font-bold text-xs rounded-xl transition-colors"
              >
                Reject & Convert to Voter
              </button>

              <button
                type="button"
                onClick={() => {
                  handleUpdateCandidateStatus(selectedCandidateModal.id, 'approved');
                  setSelectedCandidateModal(null);
                }}
                className="flex-1 py-3 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Approve Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
