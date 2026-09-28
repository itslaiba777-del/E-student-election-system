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
  Sparkles,
  CheckCircle2,
  Flag,
  Vote,
  Clock,
  Award,
  FileText,
} from 'lucide-react';

export default function CandidateProfilePage() {
  const router = useRouter();

  const [student, setStudent] = useState({
    full_name: 'Abdullah Akram',
    email: 'candidate.abdullah@university.edu',
    cnic: '3456787654567',
    registration_number: 'FA22BCS056',
    mobile_number: '03096932637',
    father_name: 'Muhammad Akram',
    university_name: 'COMSATS University Islamabad',
    department_name: 'Department of Computer Science',
    program_name: 'BS Computer Science',
    user_role: 'candidate',
    status: 'active',
    created_at: new Date().toISOString(),
    profile_image_url: null,
  });

  const [nomination, setNomination] = useState({
    party: 'Insaf Student Federation',
    manifesto: 'Promoting student welfare, campus digital tools, and transparent elections.',
    symbol_image_url: null,
    status: 'approved',
    election_title: 'President Student Council 2026',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // 1. Fetch user account profile
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setStudent((prev) => ({
            ...prev,
            ...parsed,
            university_name: parsed.university_name || 'COMSATS University Islamabad',
            department_name: parsed.department_name || 'Department of Computer Science',
            program_name: parsed.program_name || 'BS Computer Science',
            father_name: parsed.father_name || 'Muhammad Akram',
            mobile_number: parsed.mobile_number || '03096932637',
            profile_image_url: parsed.profile_image_url || prev.profile_image_url,
          }));
        } catch (e) {}
      }

      const res = await studentAPI.getProfile();
      if (res.data?.student) {
        const fetched = res.data.student;
        setStudent((prev) => ({
          ...prev,
          ...fetched,
          university_name: fetched.university_name || 'COMSATS University Islamabad',
          department_name: fetched.department_name || 'Department of Computer Science',
          program_name: fetched.program_name || 'BS Computer Science',
          father_name: fetched.father_name || 'Muhammad Akram',
          mobile_number: fetched.mobile_number || '03096932637',
          profile_image_url: fetched.profile_image_url || prev.profile_image_url,
        }));
      }

      // 2. Fetch candidate nomination details
      const nomRes = await candidateAPI.getMyNomination();
      if (nomRes.data?.candidate) {
        setNomination(nomRes.data.candidate);
      }
    } catch (err) {
      console.warn('Candidate profile fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl overflow-x-hidden">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#00450d] text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#acf4a4]" />
                <span>Candidate Profile & Digital ID</span>
              </span>

              <span className="px-3 py-1 bg-[#a0f399] text-[#005312] text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{nomination?.status ? nomination.status.toUpperCase() : 'ACTIVE CANDIDATE'}</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] mt-2">
              {student.full_name}
            </h1>
            <p className="text-xs text-[#717a6d]">
              Contesting Candidate • {student.university_name}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/student/candidate-nomination')}
              className="px-4 py-2 bg-[#00450d] text-white font-bold text-xs rounded-xl hover:bg-[#006017] transition-all shadow-md flex items-center space-x-1.5"
            >
              <Sparkles className="w-4 h-4 text-[#acf4a4]" />
              <span>Edit Nomination Info</span>
            </button>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Photo & Role Card */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-16 bg-[#00450d]" />

              <div className="relative mt-4 w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#e9e8e4] flex items-center justify-center">
                {student.profile_image_url ? (
                  <img
                    src={student.profile_image_url.startsWith('http') ? student.profile_image_url : `http://localhost:5000${student.profile_image_url}`}
                    alt={student.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-[#717a6d]" />
                )}
              </div>

              <h2 className="text-lg font-bold text-[#1b1c1a] mt-4">{student.full_name}</h2>
              <p className="text-xs text-[#00450d] font-semibold">{student.registration_number}</p>

              <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 bg-[#f4f4f0] border border-[#c0c9bb] rounded-full text-xs font-bold text-[#1b1c1a]">
                <Sparkles className="w-4 h-4 text-[#00450d]" />
                <span>Candidate Account</span>
              </div>

              <div className="mt-6 w-full pt-4 border-t border-[#c0c9bb] space-y-2 text-left text-xs">
                <div className="flex items-center justify-between text-[#717a6d]">
                  <span>Biometric Status</span>
                  <span className="font-bold text-[#005312] bg-[#a0f399] px-2 py-0.5 rounded text-[10px]">
                    VERIFIED & SAVED TO GIT
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#717a6d]">
                  <span>Candidate Status</span>
                  <span className="font-bold text-[#00450d]">
                    {nomination?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Candidate Details Bento Cards */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Candidate Nomination Campaign Info Card */}
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#c0c9bb]">
                <Flag className="w-5 h-5 text-[#00450d]" />
                <h2 className="text-base font-bold text-[#1b1c1a]">Candidate Campaign & Nomination Info</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Party / Panel Name</p>
                  <p className="font-extrabold text-sm text-[#00450d]">{nomination?.party || 'Insaf Student Federation'}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Target Election / Position</p>
                  <p className="font-bold text-[#1b1c1a]">{nomination?.election_title || 'President Student Council 2026'}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase mb-1">Electoral Symbol Logo</p>
                  {nomination?.symbol_image_url ? (
                    <img
                      src={nomination.symbol_image_url.startsWith('http') ? nomination.symbol_image_url : `http://localhost:5000${nomination.symbol_image_url}`}
                      alt="Party Symbol"
                      className="w-16 h-16 object-contain border border-[#c0c9bb] rounded p-1"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-[#f4f4f0] border border-[#c0c9bb] rounded flex items-center justify-center text-xs font-bold text-[#00450d]">
                      SYMBOL
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase mb-1">Candidate Manifesto</p>
                  <p className="text-xs bg-[#faf9f5] p-3 border border-[#c0c9bb] rounded-lg text-[#1b1c1a] leading-relaxed">
                    {nomination?.manifesto || 'Promoting student welfare, campus digital tools, and transparent elections.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Candidate Identity & Personal Details Card */}
            <div className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#c0c9bb]">
                <User className="w-5 h-5 text-[#00450d]" />
                <h2 className="text-base font-bold text-[#1b1c1a]">Personal Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Candidate Full Name</p>
                  <p className="font-bold text-[#1b1c1a]">{student.full_name}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Father's Name</p>
                  <p className="font-bold text-[#1b1c1a]">{student.father_name}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">CNIC</p>
                  <p className="font-mono font-bold text-[#1b1c1a]">{student.cnic}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Registration Number</p>
                  <p className="font-mono font-bold text-[#1b1c1a]">{student.registration_number}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Mobile Number</p>
                  <p className="font-semibold text-[#1b1c1a]">{student.mobile_number}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Email Address</p>
                  <p className="font-semibold text-[#1b1c1a]">{student.email}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Department</p>
                  <p className="font-bold text-[#1b1c1a]">{student.department_name}</p>
                </div>

                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase">Program</p>
                  <p className="font-bold text-[#1b1c1a]">{student.program_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
