'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '../../../components/StudentSidebar';
import { studentAPI, candidateAPI } from '../../../lib/api';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  Award,
  Calendar,
  CheckCircle2,
  Edit3,
  Vote,
  Sparkles,
  ChevronRight,
  Clock,
  CreditCard,
} from 'lucide-react';

export default function StudentProfilePage() {
  const router = useRouter();

  const [student, setStudent] = useState({
    full_name: 'Student User',
    email: 'student@university.edu',
    cnic: '61101-1234567-1',
    registration_number: '2024-QAU-123',
    mobile_number: '+92 300 1234567',
    university_name: 'Quaid-i-Azam University',
    faculty_name: 'Faculty of Natural Sciences',
    department_name: 'Computer Science',
    program_name: 'BS Computer Science',
    user_role: 'voter',
    status: 'active',
    created_at: '2024-01-15',
    face_encoding: null,
  });

  const [nomination, setNomination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Load user profile from localStorage if available
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setStudent((prev) => ({ ...prev, ...parsed }));
        } catch (e) {}
      }

      const res = await studentAPI.getProfile();
      if (res.data?.student) {
        setStudent((prev) => ({ ...prev, ...res.data.student }));
      }

      // Check if student has a candidate nomination
      const nomRes = await candidateAPI.getMyNomination();
      if (nomRes.data?.candidate) {
        setNomination(nomRes.data.candidate);
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-5xl overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-[#00450d] text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                Digital ID & Profile
              </span>
              <span className="px-2.5 py-0.5 bg-[#a0f399] text-[#005312] text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{student.status.toUpperCase()}</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] mt-2">
              {student.full_name}
            </h1>
            <p className="text-xs text-[#717a6d]">
              Verified Student Account • {student.university_name}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/student/dashboard')}
              className="px-4 py-2 bg-white border border-[#c0c9bb] text-[#1b1c1a] font-bold text-xs rounded-xl hover:bg-[#faf9f5] transition-all shadow-2xs flex items-center space-x-1.5"
            >
              <Vote className="w-4 h-4 text-[#00450d]" />
              <span>Go to Elections</span>
            </button>

            {student.user_role === 'candidate' || nomination ? (
              <button
                onClick={() => router.push('/student/candidate-nomination')}
                className="px-4 py-2 bg-[#00450d] text-white font-bold text-xs rounded-xl hover:bg-[#006017] transition-all shadow-md flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#acf4a4]" />
                <span>Candidate Portal</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Profile Card & Digital ID Badge Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Photo & Role Card (4 Cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-16 bg-[#00450d]" />

              {/* Profile Captured Photo Display */}
              <div className="relative mt-4 w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#e9e8e4] flex items-center justify-center">
                {student.profile_image_url ? (
                  <img
                    src={student.profile_image_url.startsWith('http') ? student.profile_image_url : `http://localhost:5000${student.profile_image_url}`}
                    alt={student.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : student.face_encoding ? (
                  <div className="w-full h-full bg-[#00450d]/10 flex flex-col items-center justify-center text-[#00450d] p-2">
                    <User className="w-12 h-12" />
                    <span className="text-[9px] font-bold mt-1 bg-[#a0f399] px-2 py-0.5 rounded-full text-[#005312]">
                      Face Biometric Verified
                    </span>
                  </div>
                ) : (
                  <User className="w-16 h-16 text-[#717a6d]" />
                )}
              </div>

              <h2 className="text-lg font-bold text-[#1b1c1a] mt-4">{student.full_name}</h2>
              <p className="text-xs text-[#00450d] font-semibold">{student.registration_number}</p>

              <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 bg-[#f4f4f0] border border-[#c0c9bb] rounded-full text-xs font-bold text-[#1b1c1a]">
                <ShieldCheck className="w-4 h-4 text-[#1b6d24]" />
                <span className="capitalize">{student.user_role} Account</span>
              </div>

              <div className="mt-6 w-full pt-4 border-t border-[#c0c9bb]/60 space-y-2 text-left text-xs">
                <div className="flex items-center justify-between text-[#717a6d]">
                  <span>Member Since</span>
                  <span className="font-semibold text-[#1b1c1a]">
                    {new Date(student.created_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#717a6d]">
                  <span>Biometric Status</span>
                  <span className="font-bold text-[#005312] bg-[#a0f399] px-2 py-0.5 rounded-md text-[10px]">
                    REGISTERED
                  </span>
                </div>
              </div>
            </div>

            {/* Candidate Quick Status Card */}
            {nomination && (
              <div className="bg-[#00450d] text-white rounded-2xl p-6 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#acf4a4]">
                    Candidate Nomination
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      nomination.status === 'approved'
                        ? 'bg-[#a0f399] text-[#005312]'
                        : nomination.status === 'rejected'
                        ? 'bg-[#ffb4ab] text-[#690005]'
                        : 'bg-[#ffdcc8] text-[#341100]'
                    }`}
                  >
                    {nomination.status}
                  </span>
                </div>
                <h3 className="text-base font-bold">{nomination.party || 'Independent Candidate'}</h3>
                
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[#acf4a4] font-bold">
                    <span>Contesting Post:</span>
                    <span className="text-white font-black">{nomination.position_title || 'President'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#acf4a4] font-bold">
                    <span>Total Seats:</span>
                    <span className="text-white font-black">🪑 {nomination.total_seats || 20} Seats</span>
                  </div>
                </div>

                <p className="text-xs text-[#acf4a4] line-clamp-2 italic">
                  "{nomination.manifesto || 'No manifesto added yet.'}"
                </p>
                <button
                  onClick={() => router.push('/student/candidate-nomination')}
                  className="w-full mt-2 py-2 bg-white text-[#00450d] font-bold text-xs rounded-xl hover:bg-[#faf9f5] transition-all flex items-center justify-center space-x-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Candidate Profile</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: General Information Grid (8 Cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Student General Information */}
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-[#00450d] uppercase tracking-wider flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-[#00450d]" />
                <span>General Student Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60 space-y-1">
                  <span className="text-[11px] font-semibold text-[#717a6d] flex items-center space-x-1">
                    <User className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>Full Name</span>
                  </span>
                  <p className="text-sm font-bold text-[#1b1c1a]">{student.full_name}</p>
                </div>

                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60 space-y-1">
                  <span className="text-[11px] font-semibold text-[#717a6d] flex items-center space-x-1">
                    <CreditCard className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>CNIC Number</span>
                  </span>
                  <p className="text-sm font-bold text-[#1b1c1a]">{student.cnic}</p>
                </div>

                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60 space-y-1">
                  <span className="text-[11px] font-semibold text-[#717a6d] flex items-center space-x-1">
                    <GraduationCap className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>Registration Number</span>
                  </span>
                  <p className="text-sm font-bold text-[#1b1c1a]">{student.registration_number}</p>
                </div>

                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60 space-y-1">
                  <span className="text-[11px] font-semibold text-[#717a6d] flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>Email Address</span>
                  </span>
                  <p className="text-sm font-bold text-[#1b1c1a] truncate">{student.email}</p>
                </div>

                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60 space-y-1">
                  <span className="text-[11px] font-semibold text-[#717a6d] flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>Mobile Number</span>
                  </span>
                  <p className="text-sm font-bold text-[#1b1c1a]">{student.mobile_number}</p>
                </div>

                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60 space-y-1">
                  <span className="text-[11px] font-semibold text-[#717a6d] flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-[#00450d]" />
                    <span>University</span>
                  </span>
                  <p className="text-sm font-bold text-[#1b1c1a]">{student.university_name}</p>
                </div>
              </div>
            </div>

            {/* Academic Division */}
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#00450d] uppercase tracking-wider flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#00450d]" />
                <span>Academic Department & Degree Program</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#e8f5e9] rounded-xl border border-[#a0f399]">
                  <span className="text-[10px] font-extrabold text-[#005312] uppercase block">🏢 Department Name</span>
                  <p className="text-xs font-black text-[#00450d] mt-1">
                    {student.faculty_name ? student.faculty_name.replace('Faculty of ', '').replace('School of ', '') + ' Department' : student.department_name || 'Computer Science Department'}
                  </p>
                </div>

                <div className="p-3.5 bg-[#faf9f5] rounded-xl border border-[#c0c9bb]/60">
                  <span className="text-[10px] font-extrabold text-[#717a6d] uppercase">🎓 Degree / Program Name</span>
                  <p className="text-xs font-bold text-[#1b1c1a] mt-1">
                    {student.department_name ? student.department_name : (student.program_name || 'BS Computer Science (BSCS)')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
