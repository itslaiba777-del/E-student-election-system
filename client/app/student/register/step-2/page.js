'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentFlow } from '../../../../context/StudentFlowContext';
import { academicAPI } from '../../../../lib/api';
import RegistrationStepIndicator from '../../../../components/RegistrationStepIndicator';
import {
  ShieldCheck,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertCircle,
  Shield,
  History,
  Bell,
  ChevronDown,
} from 'lucide-react';

export default function Step2AcademicDetailsPage() {
  const router = useRouter();
  const { selectedUniversity } = useStudentFlow();

  // Step 1 Identity Data
  const [identityData, setIdentityData] = useState({
    cnic: '61101-1234567-1',
    registration_number: '2024-QAU-123',
    full_name: 'ALEXANDER J. STERLING',
    father_name: 'JAMES R. STERLING',
    dob: 'MAY 14, 2002',
  });

  // Cascading Academic Data
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');

  // Contact & Security
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock Fallback Data if backend API is not populated
  const sampleAcademicData = {
    faculties: [
      { id: 'engineering', faculty_name: 'Faculty of Engineering & Tech' },
      { id: 'sciences', faculty_name: 'Faculty of Natural Sciences' },
      { id: 'arts', faculty_name: 'Faculty of Liberal Arts' },
      { id: 'business', faculty_name: 'School of Business Administration' },
    ],
    departments: {
      engineering: [
        { id: 'cs', department_name: 'Computer Science & AI' },
        { id: 'ee', department_name: 'Electrical Engineering' },
        { id: 'me', department_name: 'Mechanical Engineering' },
      ],
      sciences: [
        { id: 'physics', department_name: 'Physics & Astronomy' },
        { id: 'bio', department_name: 'Molecular Biology & Biotech' },
        { id: 'env', department_name: 'Environmental Science' },
      ],
      arts: [
        { id: 'fine_arts', department_name: 'Fine Arts & Design' },
        { id: 'lit', department_name: 'Modern Literature' },
        { id: 'history', department_name: 'History & Civics' },
      ],
      business: [
        { id: 'acct', department_name: 'Accounting & Finance' },
        { id: 'mktg', department_name: 'Digital Marketing' },
        { id: 'mgmt', department_name: 'Strategic Management' },
      ],
    },
    programs: {
      cs: [
        { id: 'bscs', program_name: 'Bachelor of Science in Computer Science (4Y)' },
        { id: 'mscs', program_name: 'Master of Science in Cybersecurity' },
        { id: 'phd', program_name: 'Doctorate in Computational Theory' },
      ],
      ee: [
        { id: 'bsee', program_name: 'BS Electrical Engineering' },
        { id: 'msee', program_name: 'MS Embedded Systems' },
      ],
      acct: [
        { id: 'bba', program_name: 'Bachelor of Business Administration' },
        { id: 'mba', program_name: 'Master of Business Administration' },
      ],
    },
  };

  const [universityName, setUniversityName] = useState('COMSATS University Islamabad');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('registration_step_1');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setIdentityData((prev) => ({ ...prev, ...parsed }));
        } catch (e) {}
      }
    }

    fetchSystemSettings();
    fetchFaculties();
  }, [selectedUniversity]);

  const fetchSystemSettings = async () => {
    try {
      const res = await academicAPI.getPublicSettings();
      if (res.data?.settings?.university_name) {
        setUniversityName(res.data.settings.university_name);
      }
    } catch (e) {}
  };

  // Fetch Faculties
  const fetchFaculties = async () => {
    const uniId = selectedUniversity ? selectedUniversity.id : 1;
    try {
      const res = await academicAPI.getFaculties(uniId);
      const fetched = res.data.faculties || [];
      if (fetched.length > 0) {
        setFaculties(fetched);
      } else {
        setFaculties(sampleAcademicData.faculties);
      }
    } catch (err) {
      setFaculties(sampleAcademicData.faculties);
    }
  };

  // Handle Faculty Change -> Cascades to Departments
  const handleFacultyChange = async (facId) => {
    setSelectedFaculty(facId);
    setSelectedDepartment('');
    setSelectedProgram('');
    setDepartments([]);
    setPrograms([]);

    try {
      const res = await academicAPI.getDepartments(facId);
      const fetched = res.data.departments || [];
      if (fetched.length > 0) {
        setDepartments(fetched);
      } else {
        setDepartments(sampleAcademicData.departments[facId] || []);
      }
    } catch (err) {
      setDepartments(sampleAcademicData.departments[facId] || []);
    }
  };

  // Handle Department Change -> Cascades to Programs
  const handleDepartmentChange = async (deptId) => {
    setSelectedDepartment(deptId);
    setSelectedProgram('');
    setPrograms([]);

    try {
      const res = await academicAPI.getPrograms(deptId);
      const fetched = res.data.programs || [];
      if (fetched.length > 0) {
        setPrograms(fetched);
      } else {
        setPrograms(sampleAcademicData.programs[deptId] || []);
      }
    } catch (err) {
      setPrograms(sampleAcademicData.programs[deptId] || []);
    }
  };

  const handleContinue = (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedFaculty) {
      setError('Please select your Faculty.');
      return;
    }
    if (!selectedDepartment) {
      setError('Please select your Department.');
      return;
    }
    if (!email || !email.includes('@')) {
      setError('Please provide a valid institutional email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Portal password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    const step2Payload = {
      faculty_id: selectedFaculty,
      department_id: selectedDepartment,
      program_id: selectedProgram || null,
      email,
      password,
    };

    console.log('Step 2 Academic Details Saved:', step2Payload);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('registration_step_2', JSON.stringify(step2Payload));
    }

    setTimeout(() => {
      setLoading(false);
      // Navigate to Step 3 (Face Capture)
      router.push('/student/register/step-3');
    }, 800);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Corrected 4-Step Indicator with currentStep = 2 */}
        <RegistrationStepIndicator currentStep={2} />

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Form Content */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#00450d] mb-1">
                Academic Details
              </h1>
              <p className="text-xs text-[#41493e]">
                Verify your identity and select your current enrollment information to continue.
              </p>
            </div>

            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg border border-[#ba1a1a]/20 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Read-Only Verified Identity Card */}
            <div className="bg-[#f4f4f0] border border-[#c0c9bb] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center space-x-2 text-[#41493e]">
                <ShieldCheck className="w-4 h-4 text-[#1b6d24]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#1b1c1a]">
                  Verified Identity Info
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-medium text-[#717a6d]">Full Name</label>
                  <input
                    disabled
                    type="text"
                    value={identityData.full_name || 'ALEXANDER J. STERLING'}
                    className="bg-[#dbdad6]/50 border-none rounded-lg text-xs font-semibold text-[#41493e] cursor-not-allowed px-3 py-2"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-medium text-[#717a6d]">Registration Number</label>
                  <input
                    disabled
                    type="text"
                    value={identityData.registration_number || '2024-QAU-123'}
                    className="bg-[#dbdad6]/50 border-none rounded-lg text-xs font-mono text-[#41493e] cursor-not-allowed px-3 py-2"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-medium text-[#717a6d]">CNIC</label>
                  <input
                    disabled
                    type="text"
                    value={identityData.cnic || '61101-1234567-1'}
                    className="bg-[#dbdad6]/50 border-none rounded-lg text-xs font-mono text-[#41493e] cursor-not-allowed px-3 py-2"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#717a6d] flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Identity data is verified from the central registrar records.</span>
              </p>
            </div>

            {/* Form with Cascading Dropdowns */}
            <form onSubmit={handleContinue} className="bg-white p-6 rounded-2xl border border-[#c0c9bb] shadow-sm space-y-6">
              {/* AUTO-FILLED UNIVERSITY FIELD */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#1b1c1a] flex items-center justify-between">
                  <span>University</span>
                  <span className="text-[10px] font-bold text-[#005312] bg-[#e8f5e9] px-2 py-0.5 rounded-full">
                    Auto-filled from System Settings
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={universityName || 'Quaid-i-Azam University'}
                    className="w-full h-11 rounded-lg border-2 border-[#00450d] px-3 font-mono font-bold bg-[#e8f5e9] text-xs text-[#005312] cursor-not-allowed"
                  />
                  <Building2 className="w-4 h-4 absolute right-3 top-3.5 text-[#00450d]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department Selection (Renamed from Faculty) */}
                <div className="space-y-1">
                  <label htmlFor="department" className="block text-xs font-bold text-[#1b1c1a]">
                    Department <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="department"
                      required
                      value={selectedFaculty}
                      onChange={(e) => handleFacultyChange(e.target.value)}
                      className="w-full h-11 rounded-lg border border-[#717a6d] px-3 pr-8 appearance-none bg-[#faf9f5] text-xs font-medium focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all font-semibold"
                    >
                      <option value="">-- Select Department --</option>
                      {faculties.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.faculty_name.replace('Faculty of ', '').replace('School of ', '')} Department
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 pointer-events-none text-[#41493e]" />
                  </div>
                </div>

                {/* Degree / Program Selection (Renamed from Department) */}
                <div className="space-y-1">
                  <label htmlFor="program" className="block text-xs font-bold text-[#1b1c1a]">
                    Degree / Program <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="program"
                      required
                      disabled={!selectedFaculty}
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full h-11 rounded-lg border border-[#717a6d] px-3 pr-8 appearance-none bg-[#faf9f5] text-xs font-medium focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      <option value="">
                        {selectedFaculty ? '-- Select Degree / Program --' : '-- First Select a Department --'}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 pointer-events-none text-[#41493e]" />
                  </div>
                </div>
              </div>

              {/* Specialization / Academic Stream Selection */}
              <div className="space-y-1">
                <label htmlFor="stream" className="block text-xs font-bold text-[#1b1c1a]">
                  Program Specialization / Stream <span className="text-[#717a6d] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <select
                    id="stream"
                    disabled={!selectedDepartment}
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full h-11 rounded-lg border border-[#717a6d] px-3 pr-8 appearance-none bg-[#faf9f5] text-xs font-medium focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Specialization / Major (Optional)</option>
                    {programs.map((prog) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.program_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-3.5 pointer-events-none text-[#41493e]" />
                </div>
              </div>

              {/* Contact & Security Credentials */}
              <div className="pt-4 border-t border-[#c0c9bb]">
                <h3 className="text-base font-bold text-[#00450d] mb-3">Contact & Portal Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-xs font-bold text-[#1b1c1a]">
                      Institutional Email <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3.5 text-[#41493e]" />
                      <input
                        id="email"
                        type="email"
                        required
                        placeholder="a.sterling@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 rounded-lg border border-[#717a6d] pl-10 pr-3 bg-[#faf9f5] text-xs focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="password" className="block text-xs font-bold text-[#1b1c1a]">
                      Portal Password <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3.5 text-[#41493e]" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-11 rounded-lg border border-[#717a6d] pl-10 pr-10 bg-[#faf9f5] text-xs focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#717a6d] hover:text-[#00450d] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Navigation Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#c0c9bb]">
                <button
                  type="button"
                  onClick={() => router.push('/student/register/step-1')}
                  className="w-full sm:w-auto h-11 px-6 rounded-lg border border-[#00450d] text-[#00450d] font-bold text-xs flex items-center justify-center space-x-2 hover:bg-[#a0f399]/20 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-11 px-8 rounded-lg bg-[#00450d] text-white font-bold text-xs flex items-center justify-center space-x-2 hover:bg-[#006017] active:scale-95 transition-all shadow-md"
                >
                  <span>{loading ? 'Saving...' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#1b5e20]/10 border border-[#a0f399] rounded-2xl p-6 sticky top-24 space-y-4">
              <h4 className="text-base font-bold text-[#00450d]">Why this matters</h4>
              <p className="text-xs text-[#41493e] leading-relaxed">
                Your voting eligibility is determined by your faculty and program affiliation. Candidates represent specific departmental and school seats.
              </p>

              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-xs text-[#41493e]">
                  <div className="w-6 h-6 rounded-full bg-[#a0f399] text-[#217128] flex items-center justify-center shrink-0 font-bold">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>Encrypted portal access</span>
                </li>
                <li className="flex items-center space-x-3 text-xs text-[#41493e]">
                  <div className="w-6 h-6 rounded-full bg-[#a0f399] text-[#217128] flex items-center justify-center shrink-0 font-bold">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <span>Automatic ballot matching</span>
                </li>
                <li className="flex items-center space-x-3 text-xs text-[#41493e]">
                  <div className="w-6 h-6 rounded-full bg-[#a0f399] text-[#217128] flex items-center justify-center shrink-0 font-bold">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <span>Election day notifications</span>
                </li>
              </ul>

              <div className="pt-4 border-t border-[#c0c9bb]">
                <div className="relative rounded-xl overflow-hidden h-36 shadow-sm">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3rkn0Vdelmx6v8Kl4IM23mHo0nlPndfzbQjvc9alC9YyvCNSSMOhxjDihYUEnTc9nCd_IB-9X_BTc18epsXT8QipeqGK5WggCkrm7JiwPpJe7-g96J92zaz2KUvr4K0rO3n2flK7lHSlX8AnNVHCmAfpcOG65luiZEwGfK1PMD5uIaWNZtU8f_-7LqRY6zi7OyMSzZOY7o2-_RAm0w8sLRRBiRhIs11TGZQDULUofSPW5W1RtBR8a"
                    alt="University Campus Library"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                    <p className="text-white text-[11px] italic font-medium">
                      "Shape the future of your university through your vote."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
