'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CandidateRegistrationStepIndicator from '../../../../components/CandidateRegistrationStepIndicator';
import { Sparkles, ShieldCheck, Lock, Info, ArrowRight, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';

export default function CandidateStep1IdentityPage() {
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

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'candidate_registration_step_1',
          JSON.stringify({ cnic, registration_number: regNo })
        );
      }

      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        router.push('/candidate/register/step-2');
      }, 600);
    }, 1000);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Step Indicator */}
        <CandidateRegistrationStepIndicator currentStep={1} />

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Info Card (Bento Style) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#00450d] text-white p-6 rounded-2xl relative overflow-hidden h-72 md:h-80 flex flex-col justify-end shadow-sm">
              <div className="absolute top-4 right-4 opacity-20">
                <Sparkles className="w-24 h-24 text-[#acf4a4]" />
              </div>
              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-[#acf4a4] text-[#002203] text-[10px] font-extrabold uppercase tracking-wider rounded-full mb-2">
                  <UserCheck className="w-3 h-3" />
                  <span>Candidate Registration</span>
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
                  Contest In Elections
                </h1>
                <p className="text-xs text-[#a0f399] leading-relaxed">
                  Register as an official candidate for student elections. Submit your candidate profile, party mark, slogan, and manifesto.
                </p>
              </div>
            </div>

            <div className="bg-[#f4f4f0] border border-[#c0c9bb] p-4 rounded-xl flex items-start space-x-3">
              <Info className="w-5 h-5 text-[#00450d] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#1b1c1a]">Official Candidate Database</h4>
                <p className="text-[11px] text-[#41493e] mt-0.5 leading-normal">
                  Candidate entries are verified against university student records before being placed on the official election ballot.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form Card */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-[#c0c9bb] shadow-sm space-y-6">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#00450d]" />
                <h2 className="text-xl font-bold text-[#1b1c1a]">Candidate Identity Verification</h2>
              </div>
              <p className="text-xs text-[#717a6d] mt-1">
                Please enter your CNIC and University Registration Number to initiate candidate nomination.
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
                  Government CNIC Number <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="cnic"
                  type="text"
                  required
                  placeholder="xxxxx-xxxxxxx-x"
                  value={cnic}
                  onChange={handleCnicChange}
                  className="w-full h-11 px-4 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                />
              </div>

              {/* Registration Number Field */}
              <div className="space-y-1.5">
                <label htmlFor="reg_no" className="block text-xs font-bold text-[#1b1c1a]">
                  University Registration Number <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="reg_no"
                  type="text"
                  required
                  placeholder="e.g. FA22-BCS-056 or 2024-QAU-123"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full h-11 px-4 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                />
              </div>

              <div className="bg-[#efeeea] border-l-4 border-[#00450d] p-3 rounded-r-lg flex items-center space-x-2">
                <Lock className="w-4 h-4 text-[#00450d] shrink-0" />
                <span className="text-xs font-bold text-[#005312]">Verified Candidate Identity Protocol</span>
              </div>

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
                      <span>Proceed to Candidate Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
