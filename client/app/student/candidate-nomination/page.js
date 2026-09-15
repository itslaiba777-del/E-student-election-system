'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '../../../components/StudentSidebar';
import { candidateAPI, electionAPI, academicAPI } from '../../../lib/api';
import {
  Sparkles,
  ShieldCheck,
  Upload,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Flag,
  FileText,
  Save,
} from 'lucide-react';

export default function CandidateNominationPage() {
  const router = useRouter();

  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedElection, setSelectedElection] = useState(null);

  const [candidateId, setCandidateId] = useState(null);
  const [party, setParty] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [slogan, setSlogan] = useState('');
  const [symbolFile, setSymbolFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [existingSymbolUrl, setExistingSymbolUrl] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [applyEndDeadline, setApplyEndDeadline] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const elRes = await electionAPI.getAll();
      if (elRes.data?.elections) {
        setElections(elRes.data.elections);
        if (elRes.data.elections.length > 0) {
          setSelectedElectionId(elRes.data.elections[0].id.toString());
          setSelectedElection(elRes.data.elections[0]);
          checkDeadline(elRes.data.elections[0]);
        }
      }

      // Check existing nomination
      const myRes = await candidateAPI.getMyNomination();
      if (myRes.data?.candidate) {
        const cand = myRes.data.candidate;
        setCandidateId(cand.id);
        setParty(cand.party || '');
        setManifesto(cand.manifesto || '');
        setExistingSymbolUrl(cand.symbol_image_url);
        setExistingPhotoUrl(cand.photo_url);
        setIsDeadlinePassed(myRes.data.is_deadline_passed);
        if (cand.candidate_apply_end) {
          setApplyEndDeadline(new Date(cand.candidate_apply_end));
        }
      }
    } catch (err) {
      console.warn('Nomination data fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDeadline = (elec) => {
    if (!elec || !elec.candidate_apply_end) return;
    const end = new Date(elec.candidate_apply_end);
    setApplyEndDeadline(end);
    setIsDeadlinePassed(new Date() > end);
  };

  const handleElectionChange = (e) => {
    const id = e.target.value;
    setSelectedElectionId(id);
    const selected = elections.find((el) => el.id.toString() === id);
    setSelectedElection(selected);
    checkDeadline(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDeadlinePassed) {
      alert('Deadline has passed! Nomination editing is closed.');
      return;
    }

    if (!termsAgreed && !candidateId) {
      alert('⚠️ You must read and check the Election Rules & Terms & Conditions agreement checkbox before submitting your nomination!');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('party', party);
      formData.append('manifesto', slogan ? `[Slogan: ${slogan}] ${manifesto}` : manifesto);
      if (photoFile) formData.append('photo', photoFile);
      if (symbolFile) formData.append('symbol', symbolFile);

      if (candidateId) {
        // Update existing nomination details
        const res = await candidateAPI.updateDetails(candidateId, formData);
        setMessage({ type: 'success', text: 'Candidate details updated successfully!' });
      } else {
        // Create new nomination
        const studentStr = localStorage.getItem('user');
        const student = studentStr ? JSON.parse(studentStr) : {};

        formData.append('name', student.full_name || 'Candidate Name');
        formData.append('faculty_id', student.faculty_id || 1);
        formData.append('department_id', student.department_id || 1);
        formData.append('program_id', student.program_id || 1);
        formData.append('election_id', selectedElectionId);

        const res = await candidateAPI.nominate(formData);
        if (res.data?.candidate) {
          setCandidateId(res.data.candidate.id);
        }
        setMessage({ type: 'success', text: 'Nomination submitted successfully! Pending admin review.' });
      }
    } catch (err) {
      console.error('Submit nomination error:', err);
      const errMsg = err.response?.data?.message || 'Error saving candidate details.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans flex flex-col md:flex-row">
      <StudentSidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c0c9bb] pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 bg-[#00450d] text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#acf4a4]" />
                <span>Candidate Portal</span>
              </span>

              {isDeadlinePassed ? (
                <span className="px-2.5 py-0.5 bg-[#ba1a1a] text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>Editing Closed</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-[#a0f399] text-[#005312] text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Editing Open</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] mt-2">
              Candidate Nomination & Profile Details
            </h1>
            <p className="text-xs text-[#717a6d]">
              Manage your election mark / symbol, slogan, party name, and candidate manifesto.
            </p>
          </div>
        </div>

        {/* Deadline Alert Banner */}
        <div
          className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${
            isDeadlinePassed
              ? 'bg-[#ffdad6] border-[#ffb4ab] text-[#410002]'
              : 'bg-[#e8f5e9] border-[#a0f399] text-[#005312]'
          }`}
        >
          <div className="flex items-center space-x-3">
            {isDeadlinePassed ? (
              <Lock className="w-6 h-6 shrink-0 text-[#ba1a1a]" />
            ) : (
              <Clock className="w-6 h-6 shrink-0 text-[#005312]" />
            )}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">
                {isDeadlinePassed ? 'Nomination Deadline Ended' : 'Nomination Deadline Active'}
              </h3>
              <p className="text-xs mt-0.5">
                {isDeadlinePassed
                  ? 'Editing is disabled because the application deadline has passed.'
                  : applyEndDeadline
                  ? `You can edit your details until: ${applyEndDeadline.toLocaleString()}`
                  : 'You can update your candidate profile before election nominations close.'}
              </p>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-bold flex items-center space-x-2 ${
              message.type === 'success'
                ? 'bg-[#a0f399] text-[#005312]'
                : 'bg-[#ffdad6] text-[#ba1a1a]'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Nomination Form Card */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-6">
          {/* Election Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <Flag className="w-4 h-4 text-[#00450d]" />
              <span>Target Election</span>
            </label>
            <select
              value={selectedElectionId}
              onChange={handleElectionChange}
              disabled={isDeadlinePassed || candidateId !== null}
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0]"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.title} ({el.scope})
                </option>
              ))}
            </select>
          </div>

          {/* ELECTION POST, SEATS & TERMS AND CONDITIONS DISPLAY CARD */}
          {selectedElection && (
            <div className="p-5 bg-[#e8f5e9] border-2 border-[#a0f399] rounded-2xl space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#a0f399] pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-[#005312] uppercase tracking-wider block">
                    Target Election & Post Details
                  </span>
                  <h3 className="text-sm font-black text-[#00450d]">{selectedElection.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#00450d] text-white text-xs font-black rounded-lg">
                    🏆 Seat: {selectedElection.position_title || 'President'}
                  </span>
                  <span className="px-3 py-1 bg-white border border-[#00450d] text-[#00450d] text-xs font-extrabold rounded-lg">
                    🪑 Total Seats: {selectedElection.total_seats || 20} Seats
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-white border border-[#a0f399] rounded-xl flex items-center space-x-2.5">
                  <Award className="w-4 h-4 text-[#005312] shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-[#717a6d] uppercase block">Academic Criteria</span>
                    <span className="font-extrabold text-[#005312]">
                      Min Semester: {selectedElection.min_semester || 3}rd | Min CGPA: {selectedElection.min_cgpa_criteria || 3.0}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#a0f399] rounded-xl flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-[#005312] shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-[#717a6d] uppercase block">Nomination Deadline</span>
                    <span className="font-extrabold text-[#005312]">
                      {selectedElection.candidate_apply_end ? new Date(selectedElection.candidate_apply_end).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Box */}
              <div className="p-4 bg-white border border-[#a0f399] rounded-xl space-y-1.5">
                <h4 className="text-xs font-black text-[#005312] flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#005312]" />
                  <span>📜 Election Rules & Terms & Conditions</span>
                </h4>
                <p className="text-xs text-[#41493e] leading-relaxed whitespace-pre-line font-medium">
                  {selectedElection.terms_and_conditions || 'Candidates must be active enrolled students with clean academic standing and no disciplinary violations.'}
                </p>
              </div>
            </div>
          )}

          {/* Party Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00450d]" />
              <span>Party / Alliance / Group Name</span>
            </label>
            <input
              type="text"
              value={party}
              onChange={(e) => setParty(e.target.value)}
              disabled={isDeadlinePassed}
              placeholder="e.g. Progressive Student Front (PSF) or Independent"
              className="w-full px-3 me-2.5 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0]"
            />
          </div>

          {/* Campaign Slogan & Moto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#00450d]" />
              <span>Campaign Slogan / Moto</span>
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              disabled={isDeadlinePassed}
              placeholder="e.g. Empowering Student Voices for Tomorrow"
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0]"
            />
          </div>

          {/* Manifesto / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#00450d]" />
              <span>Candidate Manifesto & Key Objectives</span>
            </label>
            <textarea
              rows={4}
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              disabled={isDeadlinePassed}
              placeholder="Detail your goals for campus development, student representation, and academic welfare..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0]"
            />
          </div>

          {/* Media Uploads Grid: Symbol & Photo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#c0c9bb]/60">
            {/* Symbol Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-[#00450d]" />
                <span>Election Mark / Symbol Image</span>
              </label>

              {existingSymbolUrl && !symbolFile && (
                <div className="p-2 border border-[#c0c9bb] rounded-xl flex items-center space-x-3 bg-[#faf9f5]">
                  <img src={existingSymbolUrl} alt="Symbol" className="w-12 h-12 object-contain rounded-md" />
                  <span className="text-[11px] text-[#00450d] font-bold">Current Symbol Saved</span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSymbolFile(e.target.files[0])}
                disabled={isDeadlinePassed}
                className="w-full text-xs text-[#717a6d] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#00450d] file:text-white hover:file:bg-[#006017] cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-[#00450d]" />
                <span>Candidate Display Photo</span>
              </label>

              {existingPhotoUrl && !photoFile && (
                <div className="p-2 border border-[#c0c9bb] rounded-xl flex items-center space-x-3 bg-[#faf9f5]">
                  <img src={existingPhotoUrl} alt="Photo" className="w-12 h-12 object-cover rounded-full" />
                  <span className="text-[11px] text-[#00450d] font-bold">Current Photo Saved</span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                disabled={isDeadlinePassed}
                className="w-full text-xs text-[#717a6d] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#00450d] file:text-white hover:file:bg-[#006017] cursor-pointer disabled:opacity-50"
              />
            </div>
          </div>

          {/* TERMS & CONDITIONS MANDATORY AGREEMENT CHECKBOX */}
          {selectedElection && (
            <div className="p-5 bg-[#f4f4f0] border-2 border-[#00450d] rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center space-x-2 text-[#00450d]">
                <FileText className="w-5 h-5 text-[#00450d] shrink-0" />
                <h4 className="font-extrabold text-xs">📜 Election Rules & Terms & Conditions Agreement</h4>
              </div>

              <div className="p-3.5 bg-white border border-[#c0c9bb] rounded-xl text-xs text-[#1b1c1a] leading-relaxed space-y-1.5 font-medium max-h-36 overflow-y-auto shadow-2xs">
                <span className="font-extrabold text-[#00450d] block uppercase text-[10px]">Official Rules set by Admin:</span>
                <p className="whitespace-pre-line text-xs">
                  {selectedElection.terms_and_conditions || 'Candidates must be active enrolled students with clean academic standing and no disciplinary violations.'}
                </p>
              </div>

              <label className="flex items-start space-x-3 p-3.5 bg-white border-2 border-[#a0f399] rounded-xl cursor-pointer hover:bg-[#e8f5e9]/50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  disabled={isDeadlinePassed}
                  className="w-4 h-4 mt-0.5 text-[#00450d] focus:ring-[#00450d] border-[#00450d] rounded accent-[#00450d]"
                />
                <span className="text-xs font-black text-[#005312] leading-snug">
                  I hereby confirm that I have read, understood, and agree to strictly abide by all the Election Rules, Eligibility Criteria, and Terms & Conditions specified above by Admin.
                </span>
              </label>
            </div>
          )}

          {/* Submit / Lock Button */}
          <div className="pt-4 border-t border-[#c0c9bb] flex items-center justify-between">
            <div className="text-[11px] font-bold text-[#717a6d]">
              {!termsAgreed && !candidateId && !isDeadlinePassed && (
                <span className="text-[#ba1a1a] flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Check agreement box above to enable submit</span>
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isDeadlinePassed || submitting || (!termsAgreed && !candidateId)}
              className={`px-8 h-12 rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 ${
                isDeadlinePassed || (!termsAgreed && !candidateId)
                  ? 'bg-[#e9e8e4] text-[#717a6d] cursor-not-allowed border border-[#c0c9bb]'
                  : 'bg-[#00450d] hover:bg-[#006017] text-white active:scale-95'
              }`}
            >
              {isDeadlinePassed ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Editing Locked (Deadline Passed)</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving Details...' : 'Save Candidate Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
