'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationStepIndicator from '../../../../components/RegistrationStepIndicator';
import { BadgeCheck, ShieldCheck, Lock, Info, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Step1IdentityVerificationPage() {
  const router = useRouter();

  const [cnic, setCnic] = useState('');
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // CNIC Masking logic: xxxxx-xxxxxxx-x
  const handleCnicChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 13) raw = raw.slice(0, 13);

    let formatted = '';
    if (raw.length > 0) formatted += raw.slice(0, 5);
    if (raw.length > 5) formatted += '-' + raw.slice(5, 12);
    if (raw.length > 12) formatted += '-' + raw.slice(12, 13);

    setCnic(formatted);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanCnic = cnic.replace(/\D/g, '');
    if (cleanCnic.length < 13) {
      setError('Please enter a complete 13-digit CNIC number.');
      return;
    }

    if (!regNo.trim()) {
      setError('Please enter your official University Registration Number.');
      return;
    }

    setLoading(true);

    // Simulated verification & console log before backend API step
    console.log('Identity Verification Requested:', { cnic, registration_number: regNo });

    setTimeout(() => {
      // Store in transient session storage for registration flow steps
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'registration_step_1',
          JSON.stringify({ cnic, registration_number: regNo })
        );
      }

      setLoading(false);
      setSuccess(true);

      console.log('Verification successful. Moving to Step 2.');
      setTimeout(() => {
        router.push('/student/register/step-2');
      }, 600);
    }, 1200);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Step Indicator */}
        <RegistrationStepIndicator currentStep={1} />

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Info Card (Bento Style) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#1b5e20] text-white p-6 rounded-2xl relative overflow-hidden h-72 md:h-80 flex flex-col justify-end shadow-sm">
              <div className="absolute top-4 right-4 opacity-20">
                <ShieldCheck className="w-24 h-24 text-[#88d982]" />
              </div>
              <div className="relative z-10 space-y-2">
                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                  Securing Your Voice
                </h1>
                <p className="text-xs text-[#a0f399] leading-relaxed">
                  Verification ensures every vote cast in the Campus Vote system is unique, legitimate, and belongs to an official student of the university.
                </p>
              </div>
            </div>

            <div className="bg-[#f4f4f0] border border-[#c0c9bb] p-4 rounded-xl flex items-start space-x-3">
              <Info className="w-5 h-5 text-[#1b6d24] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#1b1c1a]">Data Privacy Guaranteed</h4>
                <p className="text-[11px] text-[#41493e] mt-0.5 leading-normal">
                  Your identity details are encrypted and compared against official registrar records only. We do not store unhashed sensitive credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form Card */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#c0c9bb] shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1b1c1a]">Identity Verification</h2>
              <p className="text-xs text-[#717a6d] mt-1">
                Please provide your official identification details to proceed with the registration.
              </p>
            </div>

            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg border border-[#ba1a1a]/20 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-5">
              {/* CNIC Field */}
              <div className="space-y-1.5">
                <label htmlFor="cnic" className="block text-xs font-bold text-[#1b1c1a]">
                  CNIC Number <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-[#717a6d] absolute left-3.5 top-3.5" />
                  <input
                    id="cnic"
                    type="text"
                    required
                    placeholder="xxxxx-xxxxxxx-x"
                    value={cnic}
                    onChange={handleCnicChange}
                    className="w-full h-11 pl-10 pr-4 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#717a6d]">
                  Enter your 13-digit Computerized National Identity Card number.
                </p>
              </div>

              {/* Registration Number Field */}
              <div className="space-y-1.5">
                <label htmlFor="reg_no" className="block text-xs font-bold text-[#1b1c1a]">
                  University Registration Number <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-[#717a6d] absolute left-3.5 top-3.5" />
                  <input
                    id="reg_no"
                    type="text"
                    required
                    placeholder="e.g. 2024-QAU-123 or CS-2024-001"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#1b6d24] font-medium">Format example: 2024-QAU-123</p>
              </div>

              {/* Security Notice */}
              <div className="bg-[#efeeea] border-l-4 border-[#1b6d24] p-3 rounded-r-lg flex items-center space-x-2">
                <Lock className="w-4 h-4 text-[#1b6d24] shrink-0" />
                <span className="text-xs font-bold text-[#005312]">Encrypted Submission</span>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || success}
                  className={`w-full h-11 font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md ${
                    success
                      ? 'bg-[#1b6d24] text-white'
                      : 'bg-[#00450d] hover:bg-[#006017] text-white'
                  }`}
                >
                  {loading ? (
                    <span>Verifying Identity...</span>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Identity Verified! Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify identity</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-[#717a6d] mt-3">
                  Need help?{' '}
                  <a href="#" className="text-[#00450d] font-bold hover:underline">
                    Contact Student Support
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
