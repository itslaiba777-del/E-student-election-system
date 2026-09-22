'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Building2, 
  UserPlus, 
  LogIn, 
  Vote,
  Award, 
  Phone, 
  Mail, 
  CreditCard, 
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  ArrowRight,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { authAPI, studentAPI, universityAPI, academicAPI } from '../lib/api';
import FaceCapture from '../components/FaceCapture';
import { useBranding } from '../context/BrandingContext';

export default function UnifiedAuthHub() {
  const router = useRouter();
  const { universityName, logoUrl, systemTitle } = useBranding();

  // Mode state: 'login' | 'select-role' | 'register-voter' | 'register-candidate'
  const [viewMode, setViewMode] = useState('login');

  // Candidate Step: 1 (Basic Details + CGPA) | 2 (Candidate Extra Details)
  const [candidateStep, setCandidateStep] = useState(1);

  // Universities & Academic Structures
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Login Form (Unified 2-field form)
  const [loginForm, setLoginForm] = useState({
    identifier: '', // Email, CNIC, or Reg Number
    password: '',
  });

  // Common Basic Details Form for Voter & Candidate
  const [regForm, setRegForm] = useState({
    full_name: '',
    father_name: '',
    mobile_number: '',
    email: '',
    registration_number: '',
    cnic: '',
    university_id: '',
    faculty_id: '',
    department_id: '',
    batch: '',
    semester: '',
    cgpa: '',
    password: '',
    // Candidate extra fields
    party_name: '',
    symbol_url: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=150',
    manifesto: '',
  });

  // Role being registered: 'voter' | 'candidate'
  const [targetRole, setTargetRole] = useState('voter');

  // Modal / Verification States
  const [showCandidateTermsModal, setShowCandidateTermsModal] = useState(false);
  const [candidateTermsAgreed, setCandidateTermsAgreed] = useState(false);
  const [showLowCgpaModal, setShowLowCgpaModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showProfileSummaryModal, setShowProfileSummaryModal] = useState(false);
  const [showPasswordInSummary, setShowPasswordInSummary] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [faceData, setFaceData] = useState(null);

  const getSelectedDepartmentName = () => {
    const f = faculties.find((item) => String(item.id) === String(regForm.faculty_id));
    return f ? formatDepartmentName(f.department_name || f.faculty_name) : 'Computer Science Department';
  };

  const getSelectedProgramName = () => {
    const p = departments.find((item) => String(item.id) === String(regForm.department_id));
    return p ? (p.program_name || p.department_name) : 'BS Computer Science';
  };

  // Active Election & Registration Windows State
  const [activeElection, setActiveElection] = useState({
    id: 1,
    title: 'University Executive Union Election 2026',
    min_semester: 3,
    min_cgpa_criteria: 3.0,
    candidate_apply_start: '2026-08-01T00:00',
    candidate_apply_end: '2026-09-01T23:59',
    voter_register_start: '2026-08-01T00:00',
    voter_register_end: '2026-09-03T23:59',
    status: 'active',
  });

  const minCgpaLimit = activeElection.min_cgpa_criteria || 3.0;

  // UI Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if Candidate Registration is currently OPEN
  const isCandidateRegOpen = () => {
    if (!activeElection || !activeElection.candidate_apply_start) return true; // default open if not set
    const now = new Date();
    const start = new Date(activeElection.candidate_apply_start);
    const end = new Date(activeElection.candidate_apply_end);
    return now >= start && now <= end;
  };

  // Check if Voter Registration is currently OPEN
  const isVoterRegOpen = () => {
    if (!activeElection || !activeElection.voter_register_end) return true;
    const now = new Date();
    const start = activeElection.voter_register_start ? new Date(activeElection.voter_register_start) : new Date(activeElection.candidate_apply_start);
    const end = new Date(activeElection.voter_register_end);
    return now >= start && now <= end;
  };

  const [systemUniversityName, setSystemUniversityName] = useState('COMSATS University Islamabad');

  // Load Universities & Active Election on mount
  useEffect(() => {
    fetchUniversities();
    fetchActiveElection();
    fetchPublicSettings();
    fetchAllPrograms();
  }, []);

  const fetchPublicSettings = async () => {
    try {
      const res = await academicAPI.getPublicSettings();
      if (res.data?.settings?.university_name) {
        setSystemUniversityName(res.data.settings.university_name);
      }
    } catch (e) {}
  };

  const fetchActiveElection = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/elections');
      const data = await res.json();
      if (data.elections && data.elections.length > 0) {
        setActiveElection(data.elections[0]);
      }
    } catch (e) {}
  };

  const formatDepartmentName = (name) => {
    if (!name) return '';
    let cleaned = name.replace(/^Faculty of /i, '').replace(/^School of /i, '').trim();
    cleaned = cleaned.replace(/(\s*Department)+$/i, '').trim();
    return `${cleaned} Department`;
  };

  const fetchUniversities = async () => {
    try {
      const res = await universityAPI.getAll();
      const unis = res.data.universities || res.data || [];
      setUniversities(unis);
      const uniId = unis.length > 0 ? unis[0].id : 1;
      setRegForm((prev) => ({ ...prev, university_id: uniId }));
      fetchFaculties(uniId);
    } catch (err) {
      fetchFaculties(1);
    }
  };

  const fetchFaculties = async (uniId) => {
    try {
      const res = await academicAPI.getAllDepartments();
      let depts = res.data.departments || [];
      setFaculties(depts);
      fetchAllPrograms();
    } catch (err) {
      setFaculties([]);
    }
  };

  const fetchAllPrograms = async () => {
    try {
      const res = await academicAPI.getAllPrograms();
      let progs = res.data.programs || [];
      setDepartments(progs);
    } catch (err) {
      setDepartments([]);
    }
  };

  const fetchDepartments = async (facId) => {
    if (!facId) {
      fetchAllPrograms();
      return;
    }
    try {
      const res = await academicAPI.getPrograms(facId);
      let progs = res.data.programs || [];
      if (progs.length === 0) {
        const allRes = await academicAPI.getAllPrograms();
        progs = allRes.data.programs || [];
      }
      setDepartments(progs);
    } catch (err) {
      fetchAllPrograms();
    }
  };

  const handleUniversityChange = (e) => {
    const uniId = e.target.value;
    setRegForm((prev) => ({ ...prev, university_id: uniId }));
    fetchFaculties(uniId);
  };

  const handleFacultyChange = (e) => {
    const facId = e.target.value;
    setRegForm((prev) => ({ ...prev, faculty_id: facId, department_id: '' }));
    if (facId) {
      fetchDepartments(facId);
    } else {
      fetchAllPrograms();
    }
  };

  // 1. Unified Login Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authAPI.unifiedLogin({
        identifier: loginForm.identifier,
        password: loginForm.password,
      });

      const user = res.data.user;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('Login successful! Redirecting...');

      setTimeout(() => {
        const userRole = user.role || user.user_role;
        if (userRole === 'superadmin') {
          router.push('/superadmin/dashboard');
        } else if (userRole === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/student/dashboard');
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Voter Form Submit -> Trigger OTP
  const handleVoterFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regForm.email || !regForm.password || !regForm.cnic || !regForm.registration_number) {
      setError('Please fill in all required fields (CNIC, Reg No, Email, Password).');
      return;
    }

    setTargetRole('voter');
    triggerSendOtp();
  };

  // 3. Candidate Step 1 Submit -> Check Schedule, CGPA & Semester Criteria
  const handleCandidateStep1Submit = (e) => {
    e.preventDefault();
    setError('');

    if (!isCandidateRegOpen()) {
      setError('Candidate registration window is currently CLOSED for this election.');
      return;
    }

    if (!regForm.email || !regForm.password || !regForm.cnic || !regForm.registration_number) {
      setError('Please fill in all required basic details.');
      return;
    }

    const cgpaVal = parseFloat(regForm.cgpa || '0');
    const semVal = parseInt(regForm.semester || '0');
    const reqCgpa = activeElection.min_cgpa_criteria || 3.0;
    const reqSem = activeElection.min_semester || 3;

    if (isNaN(cgpaVal) || cgpaVal < reqCgpa || isNaN(semVal) || semVal < reqSem) {
      // Candidate does not meet criteria -> Show Popup with "Proceed as Voter" option
      setShowLowCgpaModal(true);
      return;
    }

    // Eligible candidate -> Move to Step 2 (Party & Symbol details)
    setCandidateStep(2);
  };

  // 4. Candidate Step 2 Submit -> Trigger OTP
  const handleCandidateStep2Submit = async (e) => {
    e.preventDefault();
    setError('');
    setTargetRole('candidate');
    triggerSendOtp();
  };

  // Switch low CGPA candidate to Voter flow automatically
  const handleProceedAsVoter = () => {
    setShowLowCgpaModal(false);
    setTargetRole('voter');
    triggerSendOtp();
  };

  // Helper: Trigger OTP email sending
  const triggerSendOtp = async () => {
    setLoading(true);
    setError('');
    setOtpCode('');
    try {
      const res = await studentAPI.sendOtp({ email: regForm.email });
      setOtpSentMessage(res.data.message || `OTP sent to ${regForm.email}`);
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP code to email.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await studentAPI.verifyOtp({ email: regForm.email, otp_code: otpCode });
      setShowOtpModal(false);
      // Next: Face Scan Modal
      setShowFaceModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Store captured face photo & descriptor
  const handleFaceCaptured = (faceInfo) => {
    setFaceData(faceInfo);
    setError('');
  };

  // Proceed to Profile Summary & Credentials Screen
  const handleProceedToSummary = () => {
    if (!faceData?.image) {
      setError('Please click the button to open your camera and capture your picture first.');
      return;
    }
    setError('');
    setShowFaceModal(false);
    setShowProfileSummaryModal(true);
  };

  // Final Registration API submit from Profile Summary Screen
  const handleFinalRegistrationSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...regForm,
        user_role: targetRole,
        face_encoding: faceData?.descriptor || null,
        photo_url: faceData?.image || null,
      };

      const res = await studentAPI.register(payload);
      setShowProfileSummaryModal(false);
      setSuccess(`${targetRole === 'candidate' ? 'Candidate' : 'Voter'} registered successfully!`);

      // Auto-fill login credentials and switch view to Login
      setTimeout(() => {
        setViewMode('login');
        setLoginForm({
          identifier: regForm.registration_number || regForm.email,
          password: regForm.password,
        });
        setSuccess('Registration completed! Your account credentials have been auto-filled for login.');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FBFAF6] flex flex-col justify-center items-center p-4 md:p-8">
      {/* Header Branding */}
      <div className="text-center mb-8">
        {logoUrl ? (
          <img src={logoUrl} alt={universityName} className="w-16 h-16 object-contain rounded-2xl mx-auto shadow-md mb-3 border border-[#c0c9bb] bg-white p-1" />
        ) : (
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00450d] text-white shadow-lg mb-3">
            <Vote className="w-9 h-9" />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#00450d] tracking-tight">{universityName}</h1>
        <p className="text-[#6B6B60] text-sm mt-1">E-Election & Biometric Voting Portal</p>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-xl bg-white border border-[#E4E1D5] rounded-2xl shadow-xl overflow-hidden">
        
        {/* Banner Alert Feedback */}
        {error && (
          <div className="bg-[#D32F2F]/10 border-l-4 border-[#D32F2F] text-[#D32F2F] p-4 text-xs md:text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-[#2E7D32]/10 border-l-4 border-[#2E7D32] text-[#2E7D32] p-4 text-xs md:text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 1: SIMPLIFIED LOGIN PAGE (Identifier + Password ONLY)
        ------------------------------------------------------------- */}
        {viewMode === 'login' && (
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#1B5E20]">Account Login</h2>
              <p className="text-xs text-[#6B6B60] mt-1">Enter your credentials to access your portal</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2C2C2C] mb-1">
                  Username / Email / CNIC / Reg Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B6B60]">
                    <UserCheck className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter Email, CNIC, or Reg No"
                    value={loginForm.identifier}
                    onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs md:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2C2C2C] mb-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#6B6B60]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs md:text-sm text-[#2C2C2C] focus:outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </>
                )}
              </button>
            </form>

            {/* Registration option */}
            <div className="mt-6 pt-5 border-t border-[#E4E1D5] text-center">
              <p className="text-xs text-[#6B6B60]">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => setViewMode('select-role')}
                  className="text-[#2E7D32] hover:text-[#1B5E20] font-bold underline ml-1"
                >
                  Register Here
                </button>
              </p>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 2: ROLE SELECTION (Voter vs Candidate)
        ------------------------------------------------------------- */}
        {viewMode === 'select-role' && (
          <div className="p-6 md:p-8 text-center">
            <h2 className="text-xl font-bold text-[#1B5E20] mb-2">Select Registration Category</h2>
            <p className="text-xs text-[#6B6B60] mb-6">Choose how you wish to register in the E-Election System</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Voter */}
              <button
                type="button"
                onClick={() => {
                  setTargetRole('voter');
                  setViewMode('register-voter');
                }}
                className="p-6 border-2 border-[#E4E1D5] hover:border-[#2E7D32] bg-[#FBFAF6] hover:bg-[#A5D6A7]/20 rounded-2xl transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center mb-3 group-hover:bg-[#2E7D32] group-hover:text-white transition-colors">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#2C2C2C] text-sm">Register as Voter</h3>
                <p className="text-[11px] text-[#6B6B60] mt-1">Cast your vote in university elections safely</p>
              </button>

              {/* Option B: Election Candidate */}
              <button
                type="button"
                onClick={() => {
                  setCandidateTermsAgreed(false);
                  setShowCandidateTermsModal(true);
                }}
                className="p-6 border-2 border-[#E4E1D5] hover:border-[#2E7D32] bg-[#FBFAF6] hover:bg-[#A5D6A7]/20 rounded-2xl transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#1B5E20]/10 text-[#1B5E20] flex items-center justify-center mb-3 group-hover:bg-[#1B5E20] group-hover:text-white transition-colors">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-[#2C2C2C] text-sm">Register as Candidate</h3>
                <p className="text-[11px] text-[#6B6B60] mt-1">Contest in elections (Requires CGPA ≥ {activeElection.min_cgpa_criteria || 3.0})</p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('login')}
              className="mt-6 text-xs text-[#6B6B60] hover:text-[#2C2C2C] underline"
            >
              Back to Login
            </button>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 3: VOTER REGISTRATION FORM
        ------------------------------------------------------------- */}
        {viewMode === 'register-voter' && (
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1B5E20]">Voter Registration</h2>
                <p className="text-xs text-[#6B6B60]">Provide your basic details for voter verification</p>
              </div>
              <span className="text-[10px] font-bold bg-[#A5D6A7] text-[#1B5E20] px-2.5 py-1 rounded-full">
                Voter
              </span>
            </div>

            <form onSubmit={handleVoterFormSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={regForm.full_name}
                    onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Father Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Father Name"
                    value={regForm.father_name}
                    onChange={(e) => setRegForm({ ...regForm, father_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    placeholder="0300-1234567"
                    value={regForm.mobile_number}
                    onChange={(e) => setRegForm({ ...regForm, mobile_number: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">CNIC Number</label>
                  <input
                    type="text"
                    required
                    placeholder="61101-1234567-1"
                    value={regForm.cnic}
                    onChange={(e) => setRegForm({ ...regForm, cnic: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Registration Number</label>
                  <input
                    type="text"
                    required
                    placeholder="CS-2022-001"
                    value={regForm.registration_number}
                    onChange={(e) => setRegForm({ ...regForm, registration_number: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1B5E20] mb-1 flex items-center justify-between">
                    <span>University</span>
                    <span className="text-[9px] font-bold text-[#005312] bg-[#E8F5E9] px-1.5 py-0.5 rounded-full">
                      Auto-filled
                    </span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={systemUniversityName || 'COMSATS University Islamabad'}
                    className="w-full px-3 py-2 bg-[#E8F5E9] border-2 border-[#1B5E20] rounded-xl text-xs font-mono font-bold text-[#1B5E20] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1B5E20] mb-1">
                    Department <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <select
                    value={regForm.faculty_id}
                    onChange={handleFacultyChange}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs font-semibold text-[#2C2C2C]"
                  >
                    <option value="">-- Select Department --</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>
                        {formatDepartmentName(f.department_name || f.faculty_name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1B5E20] mb-1">
                    Degree / Program <span className="text-[#BA1A1A]">*</span>
                  </label>
                  <select
                    value={regForm.department_id}
                    onChange={(e) => setRegForm({ ...regForm, department_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs font-semibold text-[#2C2C2C]"
                  >
                    <option value="">-- Select Degree / Program --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.program_name || d.department_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Batch</label>
                  <input
                    type="text"
                    placeholder="2022-2026"
                    value={regForm.batch}
                    onChange={(e) => setRegForm({ ...regForm, batch: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Semester</label>
                  <input
                    type="text"
                    placeholder="6th"
                    value={regForm.semester}
                    onChange={(e) => setRegForm({ ...regForm, semester: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set account password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setViewMode('select-role')}
                  className="text-xs text-[#6B6B60] underline"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1"
                >
                  <span>Submit & Request OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW 4: CANDIDATE REGISTRATION FORM (Step 1 & Step 2)
        ------------------------------------------------------------- */}
        {viewMode === 'register-candidate' && (
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1B5E20]">Candidate Registration</h2>
                <p className="text-xs text-[#6B6B60]">
                  {candidateStep === 1 ? 'Step 1: Academic & Personal Profile' : 'Step 2: Campaign & Symbol Details'}
                </p>
              </div>
              <span className="text-[10px] font-bold bg-[#1B5E20] text-white px-2.5 py-1 rounded-full">
                Candidate Step {candidateStep}/2
              </span>
            </div>

            {/* STEP 1: Basic Info + CGPA */}
            {candidateStep === 1 && (
              <form onSubmit={handleCandidateStep1Submit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Candidate"
                      value={regForm.full_name}
                      onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Father Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Father Name"
                      value={regForm.father_name}
                      onChange={(e) => setRegForm({ ...regForm, father_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Mobile Number</label>
                    <input
                      type="text"
                      required
                      placeholder="0300-9876543"
                      value={regForm.mobile_number}
                      onChange={(e) => setRegForm({ ...regForm, mobile_number: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="candidate@university.edu"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">CNIC Number</label>
                    <input
                      type="text"
                      required
                      placeholder="61101-9999999-1"
                      value={regForm.cnic}
                      onChange={(e) => setRegForm({ ...regForm, cnic: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Registration Number</label>
                    <input
                      type="text"
                      required
                      placeholder="CS-2022-099"
                      value={regForm.registration_number}
                      onChange={(e) => setRegForm({ ...regForm, registration_number: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1B5E20] mb-1 font-bold">
                      Current CGPA (Min {activeElection.min_cgpa_criteria || 3.0})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      placeholder="e.g. 3.65"
                      value={regForm.cgpa}
                      onChange={(e) => setRegForm({ ...regForm, cgpa: e.target.value })}
                      className="w-full px-3 py-2 bg-[#A5D6A7]/20 border border-[#2E7D32] rounded-xl text-xs font-bold text-[#1B5E20]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1B5E20] mb-1 flex items-center justify-between">
                      <span>University</span>
                      <span className="text-[9px] font-bold text-[#005312] bg-[#E8F5E9] px-1.5 py-0.5 rounded-full">
                        Auto-filled
                      </span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={systemUniversityName || 'COMSATS University Islamabad'}
                      className="w-full px-3 py-2 bg-[#E8F5E9] border-2 border-[#1B5E20] rounded-xl text-xs font-mono font-bold text-[#1B5E20] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#1B5E20] mb-1">
                      Department <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <select
                      value={regForm.faculty_id}
                      onChange={handleFacultyChange}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs font-semibold text-[#2C2C2C]"
                    >
                      <option value="">-- Select Department --</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {formatDepartmentName(f.department_name || f.faculty_name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#1B5E20] mb-1">
                      Degree / Program <span className="text-[#BA1A1A]">*</span>
                    </label>
                    <select
                      value={regForm.department_id}
                      onChange={(e) => setRegForm({ ...regForm, department_id: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs font-semibold text-[#2C2C2C]"
                    >
                      <option value="">-- Select Degree / Program --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.program_name || d.department_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Batch</label>
                    <input
                      type="text"
                      placeholder="2022-2026"
                      value={regForm.batch}
                      onChange={(e) => setRegForm({ ...regForm, batch: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Semester</label>
                    <input
                      type="text"
                      placeholder="6th"
                      value={regForm.semester}
                      onChange={(e) => setRegForm({ ...regForm, semester: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#2C2C2C] mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Set password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('select-role')}
                    className="text-xs text-[#6B6B60] underline"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#1B5E20] hover:bg-[#2E7D32] text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1"
                  >
                    <span>Validate CGPA & Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Party, Symbol & Manifesto Details */}
            {candidateStep === 2 && (
              <form onSubmit={handleCandidateStep2Submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2C2C2C] mb-1">Party / Student Alliance Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Progressive Student Front"
                    value={regForm.party_name}
                    onChange={(e) => setRegForm({ ...regForm, party_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2C2C2C] mb-1">Election Symbol Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/symbol.png"
                    value={regForm.symbol_url}
                    onChange={(e) => setRegForm({ ...regForm, symbol_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2C2C2C] mb-1">Manifesto / Vision Statement</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Describe key goals and promises for university elections..."
                    value={regForm.manifesto}
                    onChange={(e) => setRegForm({ ...regForm, manifesto: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FBFAF6] border border-[#E4E1D5] rounded-xl text-xs text-[#2C2C2C]"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setCandidateStep(1)}
                    className="text-xs text-[#6B6B60] underline"
                  >
                    Back to Step 1
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-semibold text-xs rounded-xl shadow transition-all flex items-center space-x-1"
                  >
                    <span>Submit & Request OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>

      {/* -------------------------------------------------------------
          MODAL 1: LOW CGPA WARNING & "NEXT AS VOTER" OPTION
      ------------------------------------------------------------- */}
      {showLowCgpaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E1D5] rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#2C2C2C]">Candidate Eligibility Notice</h3>
            <p className="text-xs text-[#6B6B60] mt-2 leading-relaxed">
              Aap election candidate ke liye eligible nahi hain kyun ke aapka criteria (Semester: <strong>{regForm.semester || 'N/A'}</strong>, CGPA: <strong>{regForm.cgpa || '0'}</strong>) required minimum limit (<strong>Semester {activeElection.min_semester || 3}</strong> & <strong>{activeElection.min_cgpa_criteria || 3.0} CGPA</strong>) ko meet nahi kar raha.
            </p>
            
            <div className="mt-6 pt-4 border-t border-[#E4E1D5] space-y-2">
              <button
                type="button"
                onClick={handleProceedAsVoter}
                className="w-full py-3 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-2"
              >
                <span>Proceed to Register as Voter</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowLowCgpaModal(false)}
                className="w-full py-2 text-xs text-[#6B6B60] hover:text-[#2C2C2C] underline"
              >
                Cancel & Edit Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 0: CANDIDATE TERMS & ELIGIBILITY CRITERIA AGREEMENT
      ------------------------------------------------------------- */}
      {showCandidateTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E1D5] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#00450d] border-b border-[#c0c9bb] pb-3">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-[#1B5E20]">Candidate Terms & Eligibility Criteria</h3>
                <p className="text-xs text-[#6B6B60]">Please review all election rules before proceeding</p>
              </div>
            </div>

            <div className="space-y-3 bg-[#f4f4f0] p-4 rounded-xl text-xs text-[#1b1c1a] border border-[#c0c9bb]">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-[#c0c9bb]">
                  <span className="font-bold text-[#00450d] text-[10px] uppercase block">Min Required Semester</span>
                  <span className="font-extrabold text-[#005312] text-xs bg-[#a0f399] px-2 py-0.5 rounded-md inline-block mt-0.5">
                    Semester {activeElection.min_semester || 3} & Above
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-[#c0c9bb]">
                  <span className="font-bold text-[#00450d] text-[10px] uppercase block">Min Required CGPA</span>
                  <span className="font-extrabold text-[#005312] text-xs bg-[#a0f399] px-2 py-0.5 rounded-md inline-block mt-0.5">
                    {activeElection.min_cgpa_criteria || 3.0} CGPA
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[#41493e] leading-relaxed">
                <p><strong>1. Academic & Conduct Record:</strong> Candidate must be an active enrolled student with no pending disciplinary penalties.</p>
                <p><strong>2. Electoral Rules:</strong> All campaign slogans, election symbols, and manifestos are subject to Admin approval.</p>
                <p><strong>3. Biometric Verification:</strong> Candidate must complete face biometrics & OTP verification.</p>
              </div>
            </div>

            <label className="flex items-center space-x-3 p-3 bg-[#e8f5e9] border border-[#a0f399] rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={candidateTermsAgreed}
                onChange={(e) => setCandidateTermsAgreed(e.target.checked)}
                className="w-4 h-4 rounded text-[#00450d] focus:ring-[#00450d]"
              />
              <span className="text-xs font-bold text-[#005312]">
                I have read and AGREE to all election terms & eligibility criteria.
              </span>
            </label>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCandidateTermsModal(false)}
                className="flex-1 py-2.5 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl hover:bg-[#e9e8e4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!candidateTermsAgreed}
                onClick={() => {
                  setShowCandidateTermsModal(false);
                  setViewMode('register-candidate');
                  setTargetRole('candidate');
                }}
                className="flex-1 py-2.5 bg-[#00450d] hover:bg-[#006017] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                Proceed to Candidate Form
              </button>
            </div>
          </div>
        </div>
      )}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E4E1D5] rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-[#6B6B60] hover:text-[#2C2C2C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#43A047]/10 text-[#43A047] flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#1B5E20]">Verify Email OTP</h3>
              <p className="text-xs text-[#6B6B60] mt-1">{otpSentMessage}</p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2C2C2C] mb-1 text-center">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center text-lg tracking-widest py-2 bg-[#FBFAF6] border border-[#2E7D32] rounded-xl font-mono text-[#1B5E20] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Proceed to Face Scan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 3: WEBCAM FACE SCAN
      ------------------------------------------------------------- */}
      {showFaceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#c0c9bb] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setShowFaceModal(false)}
              className="absolute top-4 right-4 text-[#6B6B60] hover:text-[#2C2C2C] bg-[#f4f4f0] p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <h3 className="text-lg font-extrabold text-[#00450d]">Biometric Face Capture</h3>
              <p className="text-xs text-[#717a6d] mt-1">
                Take a clear face photo for biometric identity verification
              </p>
            </div>

            <FaceCapture
              label="Face Identity Verification"
              onCapture={handleFaceCaptured}
            />

            {error && (
              <p className="text-center text-xs text-red-600 font-semibold mt-2">
                {error}
              </p>
            )}

            {faceData?.image && (
              <div className="mt-4 pt-3 border-t border-[#c0c9bb]">
                <button
                  type="button"
                  onClick={handleProceedToSummary}
                  className="w-full py-3 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <span>Next: View Profile & Account Details</span>
                  <ArrowRight className="w-4 h-4 text-[#a0f399]" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL 4: REGISTRATION PROFILE & LOGIN CREDENTIALS SUMMARY
      ------------------------------------------------------------- */}
      {showProfileSummaryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#c0c9bb] rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setShowProfileSummaryModal(false)}
              className="absolute top-5 right-5 text-[#6B6B60] hover:text-[#2C2C2C] bg-[#f4f4f0] p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#00450d] text-[#a0f399] flex items-center justify-center mx-auto mb-2 shadow-md">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#00450d]">Registration Profile & Account Credentials</h3>
              <p className="text-xs text-[#717a6d] mt-1">
                Please review your profile details and save your account login credentials.
              </p>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center space-x-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Credentials Card (Username & Password Highlighted) */}
            <div className="bg-[#00450d] text-white p-5 rounded-2xl mb-6 shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-[#006017]/40 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between border-b border-[#006017] pb-3 mb-3">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#a0f399]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#a0f399]">Account Login Credentials</span>
                </div>
                <span className="text-[10px] bg-[#a0f399] text-[#005312] font-black px-2.5 py-0.5 rounded-full uppercase">
                  Important
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="bg-[#003608]/80 p-3 rounded-xl border border-[#006017]">
                  <span className="text-[10px] font-bold text-[#a0f399] uppercase block">Full Name</span>
                  <p className="text-sm font-extrabold text-white mt-0.5 truncate">{regForm.full_name || 'N/A'}</p>
                </div>

                {/* Login Username */}
                <div className="bg-[#003608]/80 p-3 rounded-xl border border-[#006017]">
                  <span className="text-[10px] font-bold text-[#a0f399] uppercase block">Login Username (Reg No / Email)</span>
                  <p className="text-sm font-mono font-black text-[#a0f399] mt-0.5 truncate">
                    {regForm.registration_number || regForm.email}
                  </p>
                </div>

                {/* Account Password */}
                <div className="bg-[#003608]/80 p-3 rounded-xl border border-[#006017] sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#a0f399] uppercase block">Account Password</span>
                    <p className="text-sm font-mono font-bold text-white mt-0.5 tracking-wider">
                      {showPasswordInSummary ? regForm.password : '••••••••••••'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPasswordInSummary(!showPasswordInSummary)}
                    className="p-2 text-[#a0f399] hover:bg-[#006017] rounded-lg transition-colors flex items-center space-x-1 text-xs font-bold"
                  >
                    {showPasswordInSummary ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#e2e3dd] mt-3 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-[#a0f399] shrink-0" />
                <span>Please write down or take a screenshot of your Username and Password for future logins.</span>
              </p>
            </div>

            {/* Profile Summary Details & Face Image */}
            <div className="bg-[#f4f4f0] border border-[#c0c9bb] rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* Captured Face Image */}
                <div className="relative shrink-0 text-center">
                  {faceData?.image ? (
                    <img
                      src={faceData.image}
                      alt={regForm.full_name}
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-[#00450d] shadow-md"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-[#00450d] text-white flex flex-col items-center justify-center font-bold text-xs">
                      No Photo
                    </div>
                  )}
                  <span className="mt-1.5 inline-block bg-[#00450d] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    VERIFIED FACE
                  </span>
                </div>

                {/* Profile Key Info */}
                <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Father Name</span>
                    <span className="font-bold text-[#1b1c1a]">{regForm.father_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">CNIC Number</span>
                    <span className="font-bold text-[#1b1c1a] font-mono">{regForm.cnic || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Email Address</span>
                    <span className="font-bold text-[#1b1c1a]">{regForm.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Mobile Number</span>
                    <span className="font-bold text-[#1b1c1a]">{regForm.mobile_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Department</span>
                    <span className="font-bold text-[#1b1c1a]">{getSelectedDepartmentName()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Degree / Program</span>
                    <span className="font-bold text-[#1b1c1a]">{getSelectedProgramName()}</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Batch & Semester</span>
                    <span className="font-bold text-[#1b1c1a]">{regForm.batch || '2022-2026'} ({regForm.semester || '6th'})</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#717a6d] block text-[10px] uppercase">Registration Category</span>
                    <span className="font-extrabold text-[#005312] bg-[#a0f399] px-2 py-0.5 rounded uppercase text-[10px] inline-block">
                      {targetRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowProfileSummaryModal(false);
                  setShowFaceModal(true);
                }}
                className="py-3 px-4 border border-[#717a6d] text-[#41493e] font-bold text-xs rounded-xl hover:bg-[#e9e8e4] transition-colors"
              >
                Back / Retake Photo
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleFinalRegistrationSubmit}
                className="flex-1 py-3 bg-[#00450d] hover:bg-[#006017] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Saving Registration...</span>
                ) : (
                  <>
                    <span>Complete Registration & Go to Login</span>
                    <ArrowRight className="w-4 h-4 text-[#a0f399]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
