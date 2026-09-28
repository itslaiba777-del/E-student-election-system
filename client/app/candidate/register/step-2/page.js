'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CandidateRegistrationStepIndicator from '../../../../components/CandidateRegistrationStepIndicator';
import { academicAPI, electionAPI } from '../../../../lib/api';
import {
  Sparkles,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Upload,
  Flag,
  FileText,
  Vote,
  Award,
} from 'lucide-react';

export default function CandidateStep2NominationPage() {
  const router = useRouter();

  // Personal & Academic Details
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('1');

  // Candidate Nomination Fields
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('1');
  const [partyName, setPartyName] = useState('');
  const [partySlogan, setPartySlogan] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [symbolImage, setSymbolImage] = useState(null);
  const [symbolPreview, setSymbolPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const deptRes = await academicAPI.getAllDepartments();
      if (deptRes.data?.departments) {
        setDepartments(deptRes.data.departments);
      }

      const elecRes = await electionAPI.getAll();
      if (elecRes.data?.elections && elecRes.data.elections.length > 0) {
        setElections(elecRes.data.elections);
        setSelectedElection(elecRes.data.elections[0].id.toString());
      }
    } catch (e) {
      console.warn('Initial data load warning:', e);
    }
  };

  const handleSymbolUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSymbolImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSymbolPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your Full Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!partyName.trim()) {
      setError('Please enter your Party / Panel Name (or Independent).');
      return;
    }

    setLoading(true);

    const candidateStep2Data = {
      full_name: fullName,
      father_name: fatherName || 'Muhammad Akram',
      mobile_number: mobileNumber || '03096932637',
      email: email,
      password: password,
      department_id: selectedDept,
      election_id: selectedElection,
      party_name: partyName,
      party_slogan: partySlogan,
      manifesto: manifesto,
      symbol_url: symbolPreview || '/uploads/default-symbol.png',
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('candidate_registration_step_2', JSON.stringify(candidateStep2Data));
    }

    setTimeout(() => {
      setLoading(false);
      router.push('/candidate/register/step-3');
    }, 600);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <CandidateRegistrationStepIndicator currentStep={2} />

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#c0c9bb] shadow-sm space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-[#00450d]" />
              <h1 className="text-2xl font-bold text-[#1b1c1a]">Candidate Nomination & Academic Profile</h1>
            </div>
            <p className="text-xs text-[#717a6d] mt-1">
              Provide your personal details, election position, party name, party symbol, and candidate manifesto.
            </p>
          </div>

          {error && (
            <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg border border-[#ba1a1a]/20 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Candidate Personal Details */}
            <div className="border-b border-[#c0c9bb] pb-6 space-y-4">
              <h3 className="text-xs font-bold text-[#00450d] uppercase tracking-wider flex items-center space-x-1">
                <span>1. Personal & Contact Information</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abdullah Akram"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Father's Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Akram"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="03096932637"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="candidate@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Account Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-10 pl-3 pr-10 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#717a6d]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Candidate Nomination & Election Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#00450d] uppercase tracking-wider flex items-center space-x-1">
                <Flag className="w-4 h-4" />
                <span>2. Candidate Nomination & Election Campaign Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Select Election Position *</label>
                  <select
                    value={selectedElection}
                    onChange={(e) => setSelectedElection(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs font-medium"
                  >
                    {elections.length > 0 ? (
                      elections.map((el) => (
                        <option key={el.id} value={el.id}>
                          {el.title} ({el.scope})
                        </option>
                      ))
                    ) : (
                      <option value="1">President Student Council 2026</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Party / Panel Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Insaf Student Federation / Independent"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Party Slogan</label>
                  <input
                    type="text"
                    placeholder="e.g. Empowering Student Rights with Integrity"
                    value={partySlogan}
                    onChange={(e) => setPartySlogan(e.target.value)}
                    className="w-full h-10 px-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Candidate Manifesto</label>
                  <textarea
                    rows={4}
                    placeholder="Write your main campaign goals and commitments for the students..."
                    value={manifesto}
                    onChange={(e) => setManifesto(e.target.value)}
                    className="w-full p-3 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs leading-relaxed"
                  />
                </div>

                {/* Electoral Symbol Image Upload */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1b1c1a]">Party / Election Symbol Image</label>
                  <div className="flex items-center space-x-4 bg-[#faf9f5] border border-[#c0c9bb] p-3 rounded-lg">
                    {symbolPreview ? (
                      <img src={symbolPreview} alt="Symbol Preview" className="w-14 h-14 object-contain rounded border border-[#c0c9bb]" />
                    ) : (
                      <div className="w-14 h-14 bg-[#e9e8e4] rounded flex items-center justify-center text-[#717a6d]">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSymbolUpload}
                        className="text-xs text-[#717a6d] file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[#00450d] file:text-white hover:file:bg-[#006017] cursor-pointer"
                      />
                      <p className="text-[11px] text-[#717a6d] mt-1">Upload electoral symbol logo (PNG, JPG, SVG).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#c0c9bb]">
              <button
                type="button"
                onClick={() => router.push('/candidate/register/step-1')}
                className="px-5 py-2.5 bg-[#f4f4f0] border border-[#c0c9bb] text-[#1b1c1a] font-bold text-xs rounded-lg hover:bg-[#e9e8e4]"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#00450d] text-white font-bold text-xs rounded-lg hover:bg-[#006017] flex items-center space-x-2 shadow-md"
              >
                <span>Proceed to Biometric Face Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
