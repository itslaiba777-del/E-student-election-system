'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBranding } from '../../../context/BrandingContext';
import axios from 'axios';
import {
  LayoutDashboard,
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldCheck,
  Users,
  UserCheck,
  LogOut,
  Image as ImageIcon,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SuperAdminSettingsPage() {
  const router = useRouter();
  const { universityName, campusName, logoUrl, registrationPattern, refreshBranding, isConfigured } = useBranding();

  const [form, setForm] = useState({
    university_name: isConfigured ? universityName : '',
    campus_name: campusName || '',
    registration_number_pattern: registrationPattern || '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
    support_email: '',
    emergency_phone: '',
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(logoUrl);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setForm({
      university_name: isConfigured ? universityName : '',
      campus_name: campusName || '',
      registration_number_pattern: registrationPattern || '^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$',
      support_email: '',
      emergency_phone: '',
    });
    setLogoPreview(logoUrl);
  }, [universityName, campusName, logoUrl, registrationPattern, isConfigured]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('university_name', form.university_name);
      formData.append('campus_name', form.campus_name);
      formData.append('registration_number_pattern', form.registration_number_pattern);
      formData.append('support_email', form.support_email);
      formData.append('emergency_phone', form.emergency_phone);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      await axios.put(`${API_BASE_URL}/superadmin/settings`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({
        type: 'success',
        text: 'University details updated successfully! Changes applied globally.',
      });

      refreshBranding();
    } catch (err) {
      console.error('Update settings error:', err);
      const errMsg = err.response?.data?.message || 'Failed to update settings.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSubmitting(false);
    }
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
            <span className="font-black text-xl text-[#00450d] tracking-tight">SuperAdmin</span>
            <p className="text-xs text-[#717a6d] font-bold uppercase tracking-wider mt-0.5">
              Portal Control
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
              className="flex items-center space-x-3 px-4 py-3 bg-[#a0f399] text-[#217128] rounded-xl font-bold text-xs shadow-xs"
            >
              <Building2 className="w-4 h-4 text-[#00450d]" />
              <span>General Information</span>
            </Link>

            <Link
              href="/superadmin/manage-admins"
              className="flex items-center space-x-3 px-4 py-3 text-[#41493e] hover:bg-[#e3e2df] hover:text-[#1b1c1a] rounded-xl font-bold text-xs transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-[#717a6d]" />
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

      {/* Main Content */}
      <main className="lg:ml-64 flex-1 min-h-screen p-6 md:p-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a]">
              General Information & University Setup
            </h1>
            <p className="text-xs text-[#717a6d] mt-1">
              Enter University Name, Campus, Registration Pattern, and Logo. When left blank, system displays default "E-Election System".
            </p>
          </div>

          <span className="px-3 py-1 bg-[#00450d] text-white text-xs font-bold rounded-full uppercase tracking-wider self-start sm:self-auto flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-[#a0f399]" />
            <span>SuperAdmin Access</span>
          </span>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-[#a0f399] text-[#005312] border border-[#1b6d24]'
                : 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Settings Form Card */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-[#00450d] border-b border-[#c0c9bb]/60 pb-3">
            <Building2 className="w-5 h-5" />
            <h2 className="text-base font-extrabold">General Information Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* University Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1b1c1a]">University Name</label>
              <input
                type="text"
                value={form.university_name}
                onChange={(e) => setForm({ ...form, university_name: e.target.value })}
                placeholder="e.g. COMSATS University"
                className="w-full px-3.5 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-semibold"
              />
              <p className="text-[10px] text-[#717a6d]">
                If left blank, system displays default "E-Election System". When filled, it displays "[Name] E-Election System".
              </p>
            </div>

            {/* Campus / Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1b1c1a]">Campus / Branch Name</label>
              <input
                type="text"
                value={form.campus_name}
                onChange={(e) => setForm({ ...form, campus_name: e.target.value })}
                placeholder="e.g. Main Campus / Islamabad"
                className="w-full px-3.5 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-semibold"
              />
            </div>

            {/* Registration Number Pattern */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-[#1b1c1a]">Registration Number Regex Pattern</label>
              <input
                type="text"
                value={form.registration_number_pattern}
                onChange={(e) => setForm({ ...form, registration_number_pattern: e.target.value })}
                placeholder="^[A-Z]{2,4}-[0-9]{4}-[0-9]{3,5}$"
                className="w-full px-3.5 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] outline-none bg-white font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="pt-4 border-t border-[#c0c9bb]/60 space-y-4">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-[#00450d]" />
              <span>University Logo</span>
            </label>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 bg-[#faf9f5] border border-[#c0c9bb] rounded-2xl">
              <div className="w-20 h-20 rounded-2xl bg-white border border-[#c0c9bb] flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-xs">
                {logoPreview ? (
                  <img src={logoPreview} alt="University Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-[#717a6d]" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="w-full text-xs text-[#717a6d] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#00450d] file:text-white hover:file:bg-[#006017] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-[#c0c9bb] flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 h-12 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving General Info...' : 'Save General Information'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
