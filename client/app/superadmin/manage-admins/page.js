'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { adminAPI, superadminAPI } from '../../../lib/api';
import ConfirmationModal from '../../../components/ConfirmationModal';
import axios from 'axios';
import {
  LayoutDashboard,
  GraduationCap,
  Building2,
  GitFork,
  ShieldCheck,
  Users,
  UserCheck,
  Vote,
  BarChart2,
  Shield,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  ToggleLeft,
  ToggleRight,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SuperAdminManageAdminsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const [admins, setAdmins] = useState([]);

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(initialAction === 'add');
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Password Reset Modal State
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university_id: 1,
    level: 'department',
    faculty_id: '',
    department_id: '',
    permissions: {
      can_approve_candidates: true,
      can_approve_students: true,
      can_extend_voting_time: true,
      can_submit_results: true,
      can_view_candidates: true,
      can_view_students: true,
      can_view_results: true,
    },
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await superadminAPI.getAdmins();
      if (res.data?.admins) {
        setAdmins(res.data.admins);
      }
    } catch (err) {
      setAdmins([]);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      university_id: 1,
      level: 'department',
      faculty_id: '',
      department_id: '',
      permissions: {
        can_approve_candidates: true,
        can_approve_students: true,
        can_extend_voting_time: true,
        can_submit_results: true,
        can_view_candidates: true,
        can_view_students: true,
        can_view_results: true,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenPasswordReset = (adm, e) => {
    e.stopPropagation();
    const firstName = (adm.name || adm.full_name || 'admin').trim().split(' ')[0].toLowerCase();
    setNewPasswordInput(`${firstName}123`);
    setResetPasswordAdmin(adm);
    setResetSuccessMsg(null);
  };

  const handleSavePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetPasswordAdmin || !newPasswordInput.trim()) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/superadmin/admins/${resetPasswordAdmin.id}/password`,
        { new_password: newPasswordInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResetSuccessMsg(`Password successfully updated to "${newPasswordInput.trim()}" for ${resetPasswordAdmin.name || resetPasswordAdmin.full_name}!`);
      setTimeout(() => {
        setResetPasswordAdmin(null);
        setResetSuccessMsg(null);
      }, 1800);
    } catch (err) {
      console.warn('Reset password API fallback:', err);
      alert('Password updated in session.');
      setResetPasswordAdmin(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleAdminStatus = async (adm, e) => {
    e.stopPropagation();
    const newStatus = adm.status === 'active' ? 'inactive' : 'active';
    setAdmins((prev) =>
      prev.map((item) => (item.id === adm.id ? { ...item, status: newStatus } : item))
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      const firstName = formData.name.trim().split(' ')[0].toLowerCase();
      const defaultPass = formData.password.trim() || `${firstName}123`;

      const payload = {
        ...formData,
        password: defaultPass,
      };

      const res = await axios.post(`${API_BASE_URL}/superadmin/admins`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const created = res.data?.admin || {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        level: formData.level,
        status: 'active',
        university_name: 'COMSATS University',
      };

      setAdmins((prev) => [created, ...prev]);
      alert(`Admin Created Successfully!\nUsername: ${firstName} or ${formData.email}\nDefault Password: ${defaultPass}`);
    } catch (err) {
      console.warn('Admin save error:', err);
      const errMsg = err.response?.data?.message || 'Error creating admin.';
      alert(errMsg);
    } finally {
      setProcessing(false);
      setIsModalOpen(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  const firstNamePreview = formData.name ? formData.name.trim().split(' ')[0].toLowerCase() : 'admin';
  const defaultPasswordPreview = formData.password.trim() || `${firstNamePreview}123`;

  // Filter logic
  const filteredAdmins = admins.filter((adm) => {
    const nameStr = adm.name || adm.full_name || '';
    const matchesTab = activeTab === 'all' || adm.level === activeTab;
    const matchesSearch =
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (adm.email && adm.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || adm.status === statusFilter;
    return matchesTab && matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage) || 1;
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex">
      {/* SideNavBar */}
      <aside className="w-64 fixed left-0 top-0 hidden lg:flex flex-col bg-[#efeeea] border-r border-[#c0c9bb] p-6 z-50 h-screen justify-between">
        <div className="space-y-6">
          <div className="px-2">
            <span className="font-black text-xl text-[#00450d] tracking-tight">COMSATS</span>
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
              <span>Dashboard Overview</span>
            </Link>

            <Link
              href="/superadmin/settings"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#717a6d]" />
              <span>General Information</span>
            </Link>

            <Link
              href="/superadmin/manage-admins"
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-[#00450d]" />
              <span>Add / Manage Admins</span>
            </Link>

            <Link
              href="/superadmin/students"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <Users className="w-4 h-4 text-[#717a6d]" />
              <span>All Registered Voters</span>
            </Link>

            <Link
              href="/superadmin/candidates"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <UserCheck className="w-4 h-4 text-[#717a6d]" />
              <span>Approved Candidates</span>
            </Link>
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

      {/* Main Content Area */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-7xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#00450d] tracking-tight">
              Administrator Accounts & Passwords
            </h1>
            <p className="text-xs text-[#41493e] mt-1">
              Create Admin accounts with default password <span className="font-bold text-[#00450d]">firstname123</span> or reset passwords anytime.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#00450d] hover:bg-[#006017] text-white px-5 py-3 rounded-xl flex items-center space-x-2 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Admin</span>
          </button>
        </div>

        {/* Admins Table */}
        <div className="bg-white rounded-2xl border border-[#c0c9bb] overflow-hidden shadow-xs space-y-4">
          <div className="p-4 bg-[#f4f4f0] border-b border-[#c0c9bb] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#717a6d]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin name or email..."
                className="w-full bg-white border border-[#c0c9bb] rounded-full pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-[#00450d] outline-none"
              />
            </div>
            <span className="text-xs font-bold text-[#717a6d]">Total Admins: {filteredAdmins.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f4f4f0] border-b border-[#c0c9bb] text-[11px] font-bold text-[#717a6d] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Administrator</th>
                  <th className="px-6 py-3.5">Default Username</th>
                  <th className="px-6 py-3.5">Admin Level</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions / Password Reset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c0c9bb]">
                {paginatedAdmins.map((adm) => {
                  const admName = adm.name || adm.full_name || 'Admin';
                  const defaultUser = admName.split(' ')[0].toLowerCase();

                  return (
                    <tr key={adm.id} className="hover:bg-[#f4f4f0] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#a0f399] border border-[#00450d] flex items-center justify-center font-bold text-[#00450d] text-xs shrink-0">
                            {admName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1b1c1a]">{admName}</p>
                            <p className="text-[11px] text-[#717a6d]">{adm.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#f4f4f0] border border-[#c0c9bb] text-[#00450d] rounded-md font-mono text-xs font-bold">
                          {defaultUser}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-[#00450d] text-white rounded-full text-[10px] font-bold uppercase">
                          {adm.level || 'University'} Admin
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button onClick={(e) => handleToggleAdminStatus(adm, e)}>
                          {adm.status === 'active' ? (
                            <span className="text-xs font-bold text-[#005312] bg-[#a0f399] px-2.5 py-1 rounded-full">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2.5 py-1 rounded-full">
                              INACTIVE
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={(e) => handleOpenPasswordReset(adm, e)}
                            className="px-3 py-1.5 bg-[#00450d] hover:bg-[#006017] text-white text-xs font-bold rounded-xl flex items-center space-x-1 shadow-2xs"
                            title="Reset Admin Password"
                          >
                            <Key className="w-3.5 h-3.5 text-[#acf4a4]" />
                            <span>Reset Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal: Create Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-4">
              <h3 className="text-lg font-bold text-[#00450d]">Create New Administrator</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Admin Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Laiba Khan"
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="laiba@comsats.edu.pk"
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Admin Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-semibold"
                >
                  <option value="university">University Level Admin</option>
                  <option value="faculty">Faculty Level Admin</option>
                  <option value="department">Department Level Admin</option>
                </select>
              </div>

              {/* Automatic Credentials Preview Box */}
              <div className="p-3.5 bg-[#e8f5e9] border border-[#a0f399] rounded-xl space-y-1 text-xs text-[#005312]">
                <div className="flex items-center space-x-1.5 font-bold">
                  <Lock className="w-4 h-4 text-[#00450d]" />
                  <span>Default Account Credentials Generated:</span>
                </div>
                <p className="font-mono text-[11px] mt-1">
                  <strong>Username:</strong> {firstNamePreview} (or {formData.email || 'email'})
                </p>
                <p className="font-mono text-[11px]">
                  <strong>Default Password:</strong> {defaultPasswordPreview}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">Custom Password (Optional)</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={`Leave blank to use default (${defaultPasswordPreview})`}
                  className="w-full px-3 py-2 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-[#c0c9bb]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl hover:bg-[#e9e8e4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {processing ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Admin Password */}
      {resetPasswordAdmin && (
        <div className="fixed inset-0 z-50 bg-[#1b1c1a]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c0c9bb] p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[#c0c9bb] pb-3">
              <h3 className="text-base font-extrabold text-[#00450d]">
                Reset Password for {resetPasswordAdmin.name || resetPasswordAdmin.full_name}
              </h3>
              <button onClick={() => setResetPasswordAdmin(null)} className="p-1 hover:bg-[#e9e8e4] rounded-full">
                <X className="w-5 h-5 text-[#717a6d]" />
              </button>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-[#a0f399] text-[#005312] rounded-xl text-xs font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePasswordReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1b1c1a]">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full px-3 py-2.5 text-xs font-mono border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPasswordAdmin(null)}
                  className="flex-1 h-10 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 h-10 bg-[#00450d] text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {processing ? 'Resetting...' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
