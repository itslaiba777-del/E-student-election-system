'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { studentAPI } from '../../../lib/api';
import ConfirmationModal from '../../../components/ConfirmationModal';
import AccessRestricted from '../../../components/AccessRestricted';
import {
  LayoutDashboard,
  UserPlus,
  ShieldCheck,
  Calendar,
  BarChart,
  LogOut,
  Search,
  Bell,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  AlertTriangle,
} from 'lucide-react';

export default function AdminStudentVerificationPage() {
  const router = useRouter();

  // Admin Permissions State
  const [adminPermissions, setAdminPermissions] = useState([
    'verify_students',
    'can_approve_students',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [students, setStudents] = useState([
    {
      id: 101,
      full_name: 'Sarah Jenkins',
      registration_number: '2024-CS-101',
      cnic_masked: '12345-XXXXXXX-1',
      cnic_raw: '12345-6789012-1',
      department_name: 'Computer Science',
      batch: 'Fall 2024',
      email: 's.jenkins@campus.edu',
      applied_date: 'Oct 24, 2026',
      status: 'pending',
      match_score: '98.4%',
      id_photo_url: null,
      live_face_url: null,
    },
    {
      id: 102,
      full_name: 'Marcus Chen',
      registration_number: '2024-EE-042',
      cnic_masked: '42345-XXXXXXX-4',
      cnic_raw: '42345-1234567-4',
      department_name: 'Electrical Eng.',
      batch: 'Fall 2024',
      email: 'm.chen@campus.edu',
      applied_date: 'Oct 23, 2026',
      status: 'pending',
      match_score: '96.2%',
      id_photo_url: null,
      live_face_url: null,
    },
    {
      id: 103,
      full_name: 'Elena Rodriguez',
      registration_number: '2024-BA-015',
      cnic_masked: '35678-XXXXXXX-9',
      cnic_raw: '35678-9876543-9',
      department_name: 'Business Admin.',
      batch: 'Fall 2024',
      email: 'e.rodriguez@campus.edu',
      applied_date: 'Oct 22, 2026',
      status: 'approved',
      match_score: '99.1%',
      id_photo_url: null,
      live_face_url: null,
    },
    {
      id: 104,
      full_name: 'Zain Malik',
      registration_number: '2024-CS-189',
      cnic_masked: '61101-XXXXXXX-3',
      cnic_raw: '61101-1234567-3',
      department_name: 'Computer Science',
      batch: 'Fall 2024',
      email: 'z.malik@campus.edu',
      applied_date: 'Oct 21, 2026',
      status: 'rejected',
      rejection_reason: 'CNIC photo mismatch with registrar database.',
      match_score: '72.1%',
      id_photo_url: null,
      live_face_url: null,
    },
  ]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await studentAPI.getAll();
      if (res.data.students && res.data.students.length > 0) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.warn('Student list API fetch fallback:', err);
    }
  };

  const canApprove =
    adminPermissions.includes('can_approve_students') ||
    adminPermissions.includes('verify_students');

  // Filtering & Searching
  const filteredStudents = students.filter((st) => {
    const matchesFilter = activeFilter === 'all' || st.status === activeFilter;
    const matchesSearch =
      st.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.registration_number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApproveStudent = async () => {
    if (!selectedStudent) return;
    setProcessing(true);

    try {
      await studentAPI.updateStatus(selectedStudent.id, 'approved', {
        note: verificationNote,
      });
    } catch (err) {
      console.warn('Approve student API fallback:', err);
    } finally {
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? { ...s, status: 'approved' } : s))
      );
      setSelectedStudent((prev) => (prev ? { ...prev, status: 'approved' } : null));
      setProcessing(false);
      setIsApproveModalOpen(false);
    }
  };

  const handleRejectStudent = async () => {
    if (!selectedStudent) return;
    setProcessing(true);

    try {
      await studentAPI.updateStatus(selectedStudent.id, 'rejected', {
        reason: rejectReason || 'Document or facial verification check failed.',
        note: verificationNote,
      });
    } catch (err) {
      console.warn('Reject student API fallback:', err);
    } finally {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === selectedStudent.id
            ? {
                ...s,
                status: 'rejected',
                rejection_reason: rejectReason || 'Verification check failed.',
              }
            : s
        )
      );
      setSelectedStudent((prev) =>
        prev
          ? {
              ...prev,
              status: 'rejected',
              rejection_reason: rejectReason || 'Verification check failed.',
            }
          : null
      );
      setProcessing(false);
      setIsRejectModalOpen(false);
      setRejectReason('');
    }
  };

  // CSV Export functionality
  const exportCSV = () => {
    const headers = ['Full Name', 'Registration Number', 'CNIC', 'Department', 'Applied Date', 'Status'];
    const rows = filteredStudents.map((s) => [
      `"${s.full_name}"`,
      `"${s.registration_number}"`,
      `"${s.cnic_masked}"`,
      `"${s.department_name}"`,
      `"${s.applied_date}"`,
      `"${s.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Verification_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-[#00450d]" />
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
      <main className="lg:ml-64 flex-1 min-h-screen flex flex-col">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-[#c0c9bb] shadow-sm flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-3 bg-[#f4f4f0] border border-[#c0c9bb] rounded-full px-4 py-1.5 w-64 lg:w-96">
            <Search className="w-4 h-4 text-[#717a6d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Reg Number or Name..."
              className="bg-transparent border-none text-xs focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-[#41493e] hover:bg-[#e9e8e4] rounded-full relative">
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3 border-l border-[#c0c9bb] pl-4">
              <div className="w-9 h-9 rounded-full bg-[#a0f399] text-[#00450d] font-bold text-xs flex items-center justify-center border-2 border-[#00450d]">
                SV
              </div>
              <span className="text-xs font-bold text-[#1b1c1a] hidden sm:inline">Admin User</span>
            </div>
          </div>
        </header>

        {!hasPermission ? (
          <AccessRestricted requiredPermission="can_approve_students" />
        ) : (
          <>
        {/* Content Canvas */}
        <div className="flex-1 p-6 lg:p-8 max-w-7xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#00450d] tracking-tight">
                Student Verification
              </h1>
              <p className="text-xs text-[#41493e] mt-1">
                Verify credentials for the upcoming Campus Elections.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Filter Button Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 border border-[#c0c9bb] bg-white rounded-xl text-xs font-bold hover:bg-[#e9e8e4] transition-colors"
                >
                  <Filter className="w-3.5 h-3.5 text-[#00450d]" />
                  <span>Filter: {activeFilter.toUpperCase()}</span>
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-[#c0c9bb] rounded-xl shadow-xl z-50 py-1 space-y-1">
                    {['all', 'pending', 'approved', 'rejected'].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setActiveFilter(st);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#f4f4f0] ${
                          activeFilter === st ? 'text-[#00450d] font-bold bg-[#a0f399]/30' : 'text-[#41493e]'
                        }`}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export CSV List Button */}
              <button
                onClick={exportCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-[#00450d] text-white rounded-xl text-xs font-bold hover:bg-[#006017] transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Verification Table Card */}
          <div className="bg-white rounded-2xl border border-[#c0c9bb] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb]">
                  <tr>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      Student
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      CNIC
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      Reg Number
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      Department
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      Applied Date
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#717a6d]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c9bb]">
                  {paginatedStudents.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStudent(st)}
                      className="hover:bg-[#f4f4f0] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full border border-[#c0c9bb] bg-[#a0f399] flex items-center justify-center font-bold text-[#00450d] text-xs shrink-0">
                            {st.full_name.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-[#1b1c1a]">{st.full_name}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-mono text-[#41493e]">
                        {st.cnic_masked}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono font-bold text-[#1b1c1a]">
                        {st.registration_number}
                      </td>

                      <td className="px-6 py-4 text-xs text-[#41493e]">{st.department_name}</td>

                      <td className="px-6 py-4 text-xs text-[#717a6d]">{st.applied_date}</td>

                      <td className="px-6 py-4">
                        {st.status === 'pending' ? (
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#ffecb3] text-[#7f5f01] rounded-full text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        ) : st.status === 'approved' ? (
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

                      <td className="px-6 py-4">
                        <button className="text-xs font-bold text-[#00450d] hover:underline">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-[#f4f4f0] flex justify-between items-center text-xs text-[#717a6d]">
              <p>
                Showing {paginatedStudents.length} of {filteredStudents.length} student verifications
              </p>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-[#c0c9bb] bg-white hover:bg-[#e9e8e4] disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-[#1b1c1a]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-[#c0c9bb] bg-white hover:bg-[#e9e8e4] disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Side Drawer (Detail View) */}
      {selectedStudent && (
        <>
          <div
            onClick={() => setSelectedStudent(null)}
            className="fixed inset-0 bg-[#1b1c1a]/30 backdrop-blur-xs z-50 transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col border-l border-[#c0c9bb]">
            <div className="p-6 border-b border-[#c0c9bb] flex justify-between items-center bg-[#faf9f5]">
              <h3 className="text-base font-bold text-[#1b1c1a]">Verification Details</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 hover:bg-[#e9e8e4] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Identity Matching Result */}
              <div className="p-5 bg-[#a0f399]/20 border border-[#a0f399] rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#005312] uppercase tracking-wider">
                    IDENTITY VERIFICATION RESULT
                  </span>
                  <span className="bg-[#a0f399] text-[#005312] px-3 py-0.5 rounded-full text-xs font-black flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>MATCHED</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-center">
                    <p className="text-[11px] text-[#717a6d] font-semibold">Original ID Photo</p>
                    <div className="aspect-square rounded-xl border border-[#c0c9bb] bg-[#e9e8e4] flex items-center justify-center text-xs font-bold text-[#00450d]">
                      Database Photo
                    </div>
                  </div>

                  <div className="space-y-1 text-center">
                    <p className="text-[11px] text-[#717a6d] font-semibold">Captured Face</p>
                    <div className="aspect-square rounded-xl border-2 border-[#00450d] bg-[#acf4a4]/40 flex items-center justify-center text-xs font-bold text-[#00450d]">
                      Live Scan
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#41493e] leading-relaxed">
                  Biometric scan indicates a{' '}
                  <span className="font-bold text-[#00450d]">{selectedStudent.match_score} match</span>{' '}
                  between the database ID and the recently captured live facial descriptor. Confidence score: High.
                </p>
              </div>

              {/* Student Information Form */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#717a6d] uppercase tracking-wider">
                  Student Registration Details
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-[#c0c9bb]">
                    <span className="text-[#717a6d]">Full Name</span>
                    <span className="font-bold text-[#1b1c1a]">{selectedStudent.full_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#c0c9bb]">
                    <span className="text-[#717a6d]">Reg Number</span>
                    <span className="font-mono font-bold text-[#1b1c1a]">{selectedStudent.registration_number}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#c0c9bb]">
                    <span className="text-[#717a6d]">CNIC Number</span>
                    <span className="font-mono font-bold text-[#1b1c1a]">{selectedStudent.cnic_masked}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#c0c9bb]">
                    <span className="text-[#717a6d]">Department</span>
                    <span className="font-bold text-[#1b1c1a]">{selectedStudent.department_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#c0c9bb]">
                    <span className="text-[#717a6d]">Batch / Session</span>
                    <span className="font-bold text-[#1b1c1a]">{selectedStudent.batch}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#c0c9bb]">
                    <span className="text-[#717a6d]">Official Email</span>
                    <span className="font-bold text-[#00450d]">{selectedStudent.email}</span>
                  </div>
                </div>
              </div>

              {/* Verification Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#717a6d]">
                  Verification Notes (Optional)
                </label>
                <textarea
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Add administrative notes regarding this student application..."
                  className="w-full p-3 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                  rows={3}
                />
              </div>

              {/* Rejection Reason if rejected */}
              {selectedStudent.status === 'rejected' && selectedStudent.rejection_reason && (
                <div className="p-4 bg-[#ffdad6] border border-[#ba1a1a] rounded-xl text-xs space-y-1">
                  <p className="font-bold text-[#93000a]">Rejection Reason:</p>
                  <p className="text-[#41493e]">{selectedStudent.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="p-6 border-t border-[#c0c9bb] bg-[#faf9f5] flex items-center space-x-3">
              {canApprove ? (
                <>
                  <button
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={selectedStudent.status === 'rejected'}
                    className={`flex-1 h-11 border border-[#ba1a1a] text-[#ba1a1a] font-bold text-xs rounded-xl hover:bg-[#ffdad6]/50 transition-colors ${
                      selectedStudent.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Reject Application
                  </button>

                  <button
                    onClick={() => setIsApproveModalOpen(true)}
                    disabled={selectedStudent.status === 'approved'}
                    className={`flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                      selectedStudent.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Approve Student
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

      {/* Confirmation Modal — Reject Student */}
      <ConfirmationModal
        isOpen={isRejectModalOpen}
        iconType="warning"
        heading="Reject student verification?"
        description={`This action will reject ${selectedStudent?.full_name}'s registration and send an official status notification email explaining the reason.`}
        confirmLabel={processing ? 'Rejecting...' : 'Reject Registration'}
        confirmButtonStyle="destructive"
        onConfirm={handleRejectStudent}
        onCancel={() => setIsRejectModalOpen(false)}
      />

      {/* Confirmation Modal — Approve Student */}
      <ConfirmationModal
        isOpen={isApproveModalOpen}
        iconType="question"
        heading="Approve student registration?"
        description={`This action will approve ${selectedStudent?.full_name} and allow them to log in and cast votes in upcoming active elections.`}
        confirmLabel={processing ? 'Approving...' : 'Approve Registration'}
        confirmButtonStyle="primary"
        onConfirm={handleApproveStudent}
        onCancel={() => setIsApproveModalOpen(false)}
      />
          </>
        )}
      </main>
    </div>
  );
}
