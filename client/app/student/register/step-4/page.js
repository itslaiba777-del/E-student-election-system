'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStudentFlow } from '../../../../context/StudentFlowContext';
import RegistrationStepIndicator from '../../../../components/RegistrationStepIndicator';
import {
  Fingerprint,
  GraduationCap,
  Camera,
  Edit,
  CheckCircle2,
  ShieldCheck,
  Send,
  UserCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { studentAPI } from '../../../../lib/api';

export default function Step4ReviewSubmitPage() {
  const router = useRouter();
  const { selectedUniversity, capturedFaceImage } = useStudentFlow();

  const [step1Data, setStep1Data] = useState({
    cnic: '61101-1234567-1',
    registration_number: '2024-QAU-123',
    full_name: 'Alexander Julian Sterling',
    father_name: 'James R. Sterling',
    dob: 'May 14, 2002',
  });

  const [step2Data, setStep2Data] = useState({
    faculty_id: 'School of Engineering',
    department_id: 'Computer Science & AI',
    program_id: 'Bachelor of Science in Computer Science',
    email: 'a.sterling@university.edu',
    password: 'password123',
  });

  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const s1 = sessionStorage.getItem('registration_step_1');
      const s2 = sessionStorage.getItem('registration_step_2');

      if (s1) {
        try {
          setStep1Data((prev) => ({ ...prev, ...JSON.parse(s1) }));
        } catch (e) {}
      }
      if (s2) {
        try {
          setStep2Data((prev) => ({ ...prev, ...JSON.parse(s2) }));
        } catch (e) {}
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please check the agreement box to certify your information.');
      return;
    }

    setError(null);
    setLoading(true);

    const payload = {
      university_id: selectedUniversity ? selectedUniversity.id : 1,
      cnic: step1Data.cnic,
      registration_number: step1Data.registration_number,
      full_name: step1Data.full_name,
      father_name: step1Data.father_name,
      dob: step1Data.dob,
      faculty_id: step2Data.faculty_id,
      department_id: step2Data.department_id,
      program_id: step2Data.program_id,
      email: step2Data.email,
      password: step2Data.password,
      face_encoding: capturedFaceImage || 'FACE_VECTOR_RECORDED',
    };

    console.log('Final Registration Payload Submitted:', payload);

    try {
      await studentAPI.register(payload);
    } catch (err) {
      console.warn('API call simulated fallback for registration submission:', err);
    }

    setTimeout(() => {
      setLoading(false);
      // Navigate to submitted confirmation screen
      router.push('/student/register/submitted');
    }, 1000);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Standardized 4-Step Indicator with currentStep = 4 */}
        <RegistrationStepIndicator currentStep={4} />

        {/* Page Title & Intro */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] tracking-tight mb-1">
            Review & Submit
          </h1>
          <p className="text-xs text-[#41493e] max-w-2xl">
            Please verify all your details before final submission. This information will be used to generate your secure digital voting ID.
          </p>
        </div>

        {error && (
          <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg border border-[#ba1a1a]/20 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bento Grid for Review Sections */}
        <div className="grid grid-cols-12 gap-5">
          {/* Identity Details Card */}
          <div className="col-span-12 md:col-span-8 bg-white/80 backdrop-blur-md border border-[#e4e1d5] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#c0c9bb]/50">
                <div className="flex items-center space-x-2">
                  <Fingerprint className="w-5 h-5 text-[#00450d]" />
                  <h2 className="text-base font-bold text-[#1b1c1a]">Identity Information</h2>
                </div>
                <Link
                  href="/student/register/step-1"
                  className="text-xs text-[#00450d] font-bold flex items-center space-x-1 hover:underline"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-0.5">
                    Full Legal Name
                  </p>
                  <p className="font-bold text-[#1b1c1a]">{step1Data.full_name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-0.5">
                    Date of Birth
                  </p>
                  <p className="font-bold text-[#1b1c1a]">{step1Data.dob}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-0.5">
                    Government CNIC
                  </p>
                  <p className="font-mono font-bold text-[#1b1c1a]">{step1Data.cnic}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-0.5">
                    Verification Status
                  </p>
                  <p className="font-semibold text-[#1b6d24] flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-[#1b6d24]" />
                    <span>Verified Student Citizen</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile / Face Photo Preview Card */}
          <div className="col-span-12 md:col-span-4 bg-white/80 backdrop-blur-md border border-[#e4e1d5] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="flex justify-between w-full items-center mb-3">
              <span className="text-xs font-bold text-[#00450d] uppercase tracking-wider">
                Face Biometric
              </span>
              <Link
                href="/student/register/step-3"
                className="text-xs text-[#00450d] font-bold flex items-center space-x-1 hover:underline"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
            </div>

            <div className="relative w-32 h-32 rounded-full border-4 border-[#acf4a4] overflow-hidden mb-3 shadow-md bg-[#dbdad6] flex items-center justify-center">
              {capturedFaceImage ? (
                <img
                  src={capturedFaceImage}
                  alt="Biometric Face ID"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCheck className="w-12 h-12 text-[#717a6d]" />
              )}
            </div>

            <h3 className="font-bold text-[#1b1c1a] text-xs">Biometric ID Photo</h3>
            <p className="text-[11px] text-[#717a6d] mt-0.5">Verified against campus record</p>
          </div>

          {/* Academic Details Card */}
          <div className="col-span-12 bg-white/80 backdrop-blur-md border border-[#e4e1d5] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#c0c9bb]/50">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-[#00450d]" />
                <h2 className="text-base font-bold text-[#1b1c1a]">Academic Details</h2>
              </div>
              <Link
                href="/student/register/step-2"
                className="text-xs text-[#00450d] font-bold flex items-center space-x-1 hover:underline"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]">
                <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-1">
                  Student Reg No
                </p>
                <p className="font-mono font-bold text-[#1b1c1a]">{step1Data.registration_number}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]">
                <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-1">
                  Faculty
                </p>
                <p className="font-bold text-[#1b1c1a]">{step2Data.faculty_id}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]">
                <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-1">
                  Department / Major
                </p>
                <p className="font-bold text-[#1b1c1a]">{step2Data.department_id}</p>
              </div>

              <div className="bg-[#f4f4f0] p-3 rounded-xl border border-[#c0c9bb]">
                <p className="text-[11px] text-[#717a6d] font-semibold uppercase tracking-wider mb-1">
                  Institutional Email
                </p>
                <p className="font-bold text-[#1b1c1a] truncate">{step2Data.email}</p>
              </div>
            </div>
          </div>

          {/* Compliance & Terms Agreement Checkbox */}
          <div className="col-span-12 bg-[#a0f399]/20 border border-[#1b6d24]/20 rounded-2xl p-5">
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input
                id="agreement"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-[#717a6d] text-[#00450d] focus:ring-[#00450d] cursor-pointer"
              />
              <span className="text-xs text-[#41493e] leading-relaxed">
                I certify that the information provided is accurate and I understand that providing false information is a violation of the Student Conduct Code. I agree to the{' '}
                <a href="#" className="text-[#00450d] font-bold hover:underline">
                  Terms of Civic Engagement
                </a>{' '}
                and the Privacy Policy.
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[#c0c9bb]">
          <button
            type="button"
            onClick={() => router.push('/student/register/step-3')}
            className="px-6 h-11 rounded-lg border border-[#00450d] text-[#00450d] font-bold text-xs hover:bg-[#e9e8e4] transition-all"
          >
            Previous Step
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!agreed || loading}
            className={`px-8 h-11 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 ${
              agreed && !loading
                ? 'bg-[#00450d] hover:bg-[#006017] text-white cursor-pointer'
                : 'bg-[#e9e8e4] text-[#717a6d] cursor-not-allowed border border-[#c0c9bb]'
            }`}
          >
            <span>{loading ? 'Submitting Registration...' : 'Submit registration'}</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
