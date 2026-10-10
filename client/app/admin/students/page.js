'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { adminAPI } from '../../../lib/api';
import AccessRestricted from '../../../components/AccessRestricted';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Search,
  Building2,
  ShieldCheck,
  LogOut,
  User,
  X,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Download,
  Filter,
} from 'lucide-react';

import { API_BASE_URL, SERVER_BASE_URL } from '../../../lib/api';

export default function AdminStudentVerificationPage() {
  const router = useRouter();

  const [hasPermission, setHasPermission] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'edit' | 'password' | 'delete'

  // Edit Form State
  const [editForm, setEditForm] = useState({
    full_name: '',
    father_name: '',
    cnic: '',
    registration_number: '',
    mobile_number: '',
    email: '',
    status: 'active',
  });

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');

  // Status Message
  const [feedback, setFeedback] = useState({ type: '', msg: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.role === 'admin' && u.permissions) {
            if (u.permissions.can_view_students === false) {
              setHasPermission(false);
              return;
            }
          }
        } catch (e) {}
      }
    }
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await adminAPI.getStudents();
      if (res.data?.students) {
        setStudents(res.data.students);
      }
    } catch (err) {
      console.error('Fetch students error:', err);
      setStudents([]);
    }
  };

  const openStudentModal = (student) => {
    setSelectedStudent(student);
    setActiveTab('details');
    setPassMessage('');
    setFeedback({ type: '', msg: '' });
    setEditForm({
      full_name: student.full_name || '',
      father_name: student.father_name || 'Muhammad Akram',
      cnic: student.cnic || '',
      registration_number: student.registration_number || '',
      mobile_number: student.mobile_number || '03096932637',
      email: student.email || '',
      status: student.status || 'active',
    });
  };

  // 1. Toggle Voter Status
  const handleToggleStatus = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    const newStatus = selectedStudent.status === 'deactivated' ? 'active' : 'deactivated';
    try {
      await adminAPI.updateStudentStatus(selectedStudent.id, newStatus);

      const updated = { ...selectedStudent, status: newStatus };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? updated : s)));
      setFeedback({ type: 'success', msg: `Voter status updated to '${newStatus.toUpperCase()}'.` });
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to update status.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Edit Profile Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await adminAPI.updateStudentDetails(selectedStudent.id, editForm);

      const updated = { ...selectedStudent, ...editForm };
      setSelectedStudent(updated);
      setStudents((prev) => prev.map((s) => (s.id === selectedStudent.id ? updated : s)));
      setFeedback({ type: 'success', msg: 'Voter profile updated successfully.' });
      setActiveTab('details');
    } catch (err) {
      setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Update Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPassMessage('Password must be at least 4 characters long.');
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.updateStudentPassword(selectedStudent.id, newPassword);

      setPassMessage('Password updated successfully for voter.');
      setNewPassword('');
    } catch (err) {
      setPassMessage(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Delete Voter Account & Disk Image File
  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE voter '${selectedStudent.full_name}'? This will delete all database records and profile picture file from disk.`)) {
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.deleteStudent(selectedStudent.id);

      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setSelectedStudent(null);
      alert('Voter account and profile picture file deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete voter account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    // Exclude candidates from Student Voters roster
    if (s.user_role === 'candidate') return false;

    const term = searchQuery.toLowerCase();
    const matchesFilter = activeFilter === 'all' || s.status === activeFilter;
    const matchesSearch =
      (s.full_name || '').toLowerCase().includes(term) ||
      (s.registration_number || '').toLowerCase().includes(term) ||
      (s.cnic || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  if (!hasPermission) {
    return (
      <AccessRestricted message="You do not have administrative permission to view or manage the Student Voters Roster." />
    );
  }

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
      <aside className="w-64 bg-[#efeeea] border-r border-[#c0c9bb] p-6 hidden lg:flex flex-col justify-between shrink-0 min-h-screen">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">Admin Portal</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              Voter Management
            </p>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#717a6d]" />
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <Users className="w-4 h-4 text-[#00450d]" />
              <span>Student Voters Roster</span>
            </Link>

            <Link
              href="/admin/candidates"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <UserCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Candidate Approvals</span>
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#c0c9bb]">
          <button
            onClick={() => {
              localStorage.clear();
              router.push('/');
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl font-bold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen p-6 md:p-8 max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a]">
              Registered Voters Roster
            </h1>
            <p className="text-xs text-[#717a6d] mt-1">
              Select any voter to view full profile details, edit, change password, deactivate, or delete.
            </p>
          </div>

          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#717a6d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search voter name, reg no, cnic..."
              className="w-full bg-white border border-[#c0c9bb] rounded-full pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
            />
          </div>
        </div>

        {/* Voter Roster Table */}
        <div className="bg-white border border-[#c0c9bb] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student Voter Name</th>
                  <th className="px-6 py-3.5">Registration No & CNIC</th>
                  <th className="px-6 py-3.5">Department & Program</th>
                  <th className="px-6 py-3.5">Account Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c0c9bb]">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-[#717a6d]">
                      No registered voters found matching search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stud) => (
                    <tr
                      key={stud.id}
                      onClick={() => openStudentModal(stud)}
                      className="hover:bg-[#f4f4f0] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {stud.profile_image_url || stud.photo_url ? (
                            <img
                              src={
                                (stud.profile_image_url || stud.photo_url).startsWith('http')
                                  ? stud.profile_image_url || stud.photo_url
                                  : `${SERVER_BASE_URL}${stud.profile_image_url || stud.photo_url}`
                              }
                              alt={stud.full_name}
                              className="w-10 h-10 rounded-xl object-cover border-2 border-[#00450d]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#00450d] text-white flex items-center justify-center font-bold text-sm">
                              {stud.full_name ? stud.full_name.charAt(0) : 'V'}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-[#1b1c1a]">{stud.full_name || 'Registered Voter'}</p>
                            <p className="text-[11px] text-[#717a6d]">{stud.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-mono font-bold text-[#00450d]">{stud.registration_number}</p>
                        <p className="text-[11px] text-[#717a6d]">{stud.cnic}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-[#41493e]">
                        <p className="font-bold text-[#1b1c1a]">{stud.department_name || 'Computer Science'}</p>
                        <p className="text-[10px] text-[#717a6d]">{stud.program_name || 'BS Computer Science'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            stud.status === 'deactivated'
                              ? 'bg-[#ffb4ab] text-[#690005]'
                              : 'bg-[#a0f399] text-[#005312]'
                          }`}
                        >
                          {stud.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openStudentModal(stud);
                          }}
                          className="px-3 py-1.5 bg-[#00450d] hover:bg-[#006017] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile / Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* -------------------------------------------------------------
            VOTER PROFILE & MANAGEMENT MODAL
        ------------------------------------------------------------- */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto border border-[#c0c9bb] shadow-2xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00450d] text-white flex items-center justify-center font-black text-lg">
                    {selectedStudent.full_name ? selectedStudent.full_name.charAt(0) : 'V'}
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#00450d]">
                      Voter Profile: {selectedStudent.full_name}
                    </h2>
                    <p className="text-xs text-[#717a6d]">
                      {selectedStudent.registration_number} — {selectedStudent.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-[#e9e8e4] rounded-full text-[#717a6d]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feedback Banner */}
              {feedback.msg && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                    feedback.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}
                >
                  {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{feedback.msg}</span>
                </div>
              )}

              {/* Control Panel Tabs */}
              <div className="flex items-center space-x-2 border-b border-[#c0c9bb] pb-3 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'details' ? 'bg-[#00450d] text-white' : 'bg-[#f4f4f0] text-[#717a6d]'
                  }`}
                >
                  Full Profile Details
                </button>
                <button
                  onClick={() => setActiveTab('edit')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'edit' ? 'bg-[#00450d] text-white' : 'bg-[#f4f4f0] text-[#717a6d]'
                  }`}
                >
                  Edit Profile Info
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'password' ? 'bg-[#00450d] text-white' : 'bg-[#f4f4f0] text-[#717a6d]'
                  }`}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveTab('delete')}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                    activeTab === 'delete' ? 'bg-[#ba1a1a] text-white' : 'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}
                >
                  Delete Account
                </button>
              </div>

              {/* TAB 1: FULL PROFILE DETAILS */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-[#faf9f5] p-5 rounded-2xl border border-[#c0c9bb]/60">
                    {selectedStudent.profile_image_url || selectedStudent.photo_url ? (
                      <img
                        src={
                          (selectedStudent.profile_image_url || selectedStudent.photo_url).startsWith('http')
                            ? selectedStudent.profile_image_url || selectedStudent.photo_url
                            : `${SERVER_BASE_URL}${selectedStudent.profile_image_url || selectedStudent.photo_url}`
                        }
                        alt={selectedStudent.full_name}
                        className="w-28 h-28 rounded-2xl object-cover border-4 border-[#00450d] shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-2xl bg-[#00450d] text-white flex flex-col items-center justify-center font-bold shadow-md shrink-0">
                        <User className="w-10 h-10 mb-1 text-[#a0f399]" />
                        <span className="text-[10px]">No Photo</span>
                      </div>
                    )}

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <h3 className="text-xl font-black text-[#00450d]">{selectedStudent.full_name}</h3>
                      <p className="text-xs font-bold text-[#717a6d]">{selectedStudent.email}</p>
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <span className="px-3 py-1 bg-[#a0f399] text-[#005312] text-[10px] font-extrabold rounded-full uppercase">
                          {selectedStudent.user_role || 'VOTER'}
                        </span>
                        <span className="px-3 py-1 bg-[#e8f5e9] text-[#005312] border border-[#a0f399] text-[10px] font-extrabold rounded-full uppercase">
                          {selectedStudent.status || 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleToggleStatus}
                      disabled={submitting}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 shrink-0 ${
                        selectedStudent.status === 'deactivated'
                          ? 'bg-[#00450d] text-white hover:bg-[#006017]'
                          : 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]'
                      }`}
                    >
                      {selectedStudent.status === 'deactivated' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      <span>{selectedStudent.status === 'deactivated' ? 'Activate Account' : 'Deactivate Account'}</span>
                    </button>
                  </div>

                  {/* 8-Card Profile Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Father Name</span>
                      <p className="text-xs font-bold text-[#1b1c1a]">{selectedStudent.father_name || 'Muhammad Akram'}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Registration Number</span>
                      <p className="text-xs font-mono font-black text-[#00450d]">{selectedStudent.registration_number}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">CNIC Number</span>
                      <p className="text-xs font-mono font-bold text-[#1b1c1a]">{selectedStudent.cnic}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Email Address</span>
                      <p className="text-xs font-semibold text-[#1b1c1a] truncate">{selectedStudent.email}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Mobile Number</span>
                      <p className="text-xs font-bold text-[#1b1c1a]">{selectedStudent.mobile_number || '03096932637'}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Department</span>
                      <p className="text-xs font-bold text-[#1b1c1a]">{selectedStudent.department_name || 'Department of Computer Science'}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Degree / Program</span>
                      <p className="text-xs font-bold text-[#1b1c1a]">{selectedStudent.program_name || 'BS Computer Science'}</p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Batch & Semester</span>
                      <p className="text-xs font-bold text-[#1b1c1a]">
                        {selectedStudent.batch || '2022-2026'} ({selectedStudent.semester || '6th Semester'})
                      </p>
                    </div>

                    <div className="bg-[#f4f4f0] p-3.5 rounded-xl border border-[#c0c9bb]/60 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-[#717a6d] block">Biometric Status</span>
                      <p className="text-xs font-extrabold text-[#005312]">Biometric Verified</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EDIT PROFILE INFO */}
              {activeTab === 'edit' && (
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1a] mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="w-full bg-[#faf9f5] border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1a] mb-1">Father Name</label>
                      <input
                        type="text"
                        required
                        value={editForm.father_name}
                        onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })}
                        className="w-full bg-[#faf9f5] border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1a] mb-1">Registration Number</label>
                      <input
                        type="text"
                        required
                        value={editForm.registration_number}
                        onChange={(e) => setEditForm({ ...editForm, registration_number: e.target.value })}
                        className="w-full bg-[#faf9f5] border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1a] mb-1">CNIC Number</label>
                      <input
                        type="text"
                        required
                        value={editForm.cnic}
                        onChange={(e) => setEditForm({ ...editForm, cnic: e.target.value })}
                        className="w-full bg-[#faf9f5] border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1a] mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full bg-[#faf9f5] border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1b1c1a] mb-1">Mobile Number</label>
                      <input
                        type="text"
                        required
                        value={editForm.mobile_number}
                        onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                        className="w-full bg-[#faf9f5] border border-[#c0c9bb] rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </form>
              )}

              {/* TAB 3: CHANGE PASSWORD */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto">
                  {passMessage && (
                    <div className="p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-xl text-xs font-bold text-[#00450d] text-center">
                      {passMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1b1c1a] mb-1">
                      Set New Password for {selectedStudent.full_name}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new password (min 4 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#faf9f5] border border-[#00450d] rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#00450d] outline-none text-center font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    {submitting ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              )}

              {/* TAB 4: DELETE ACCOUNT (DANGER ZONE) */}
              {activeTab === 'delete' && (
                <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 p-6 rounded-2xl space-y-4 text-center">
                  <Trash2 className="w-12 h-12 text-[#ba1a1a] mx-auto" />
                  <div>
                    <h3 className="text-base font-extrabold text-[#690005]">Delete Voter Account</h3>
                    <p className="text-xs text-[#717a6d] max-w-md mx-auto mt-1">
                      This action will completely delete voter <strong>{selectedStudent.full_name}</strong> from the database and permanently delete their profile picture file from disk/Git directory.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteStudent}
                    disabled={submitting}
                    className="px-6 py-3 bg-[#ba1a1a] hover:bg-[#93000a] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    {submitting ? 'Deleting Voter...' : 'Permanently Delete Voter Account & Disk Photo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
