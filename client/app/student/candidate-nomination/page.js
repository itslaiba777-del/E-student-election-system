'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentSidebar from '../../../components/StudentSidebar';
import { candidateAPI, electionAPI } from '../../../lib/api';
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
  Award,
  UserCheck,
  Send,
} from 'lucide-react';

export default function CandidateNominationPage() {
  const router = useRouter();

  const [elections, setElections] = useState([]);
  const [selectedElectionId, setSelectedElectionId] = useState('');
  const [selectedElection, setSelectedElection] = useState(null);

  const [candidateId, setCandidateId] = useState(null);
  const [party, setParty] = useState('');
  const [slogan, setSlogan] = useState('');
  const [motto, setMotto] = useState('');
  const [bio, setBio] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [experience, setExperience] = useState('');

  const [symbolFile, setSymbolFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [existingSymbolUrl, setExistingSymbolUrl] = useState(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(null);

  const [status, setStatus] = useState('pending');
  const [isLocked, setIsLocked] = useState(false);
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

      // Check existing nomination details
      const myRes = await candidateAPI.getMyNomination();
      if (myRes.data?.candidate) {
        const cand = myRes.data.candidate;
        setCandidateId(cand.id);
        setParty(cand.party || '');
        setSlogan(cand.slogan || '');
        setMotto(cand.motto || '');
        setBio(cand.bio || '');
        setManifesto(cand.manifesto || '');
        setExperience(cand.experience || '');
        setStatus(cand.status || 'pending');
        setExistingSymbolUrl(cand.symbol_image_url);
        setExistingPhotoUrl(cand.photo_url);
        setIsDeadlinePassed(myRes.data.is_deadline_passed);

        if (cand.status === 'pending' || cand.status === 'approved') {
          setIsLocked(true);
        }

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
    if (isDeadlinePassed || isLocked) {
      alert('Candidate details are locked pending Admin approval or deadline expiry.');
      return;
    }

    if (!termsAgreed && !candidateId) {
      alert('⚠️ Please check the Election Rules & Terms agreement checkbox before uploading information!');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('party', party);
      formData.append('slogan', slogan);
      formData.append('motto', motto);
      formData.append('bio', bio);
      formData.append('manifesto', manifesto);
      formData.append('experience', experience);
      if (photoFile) formData.append('photo', photoFile);
      if (symbolFile) formData.append('symbol', symbolFile);

      if (candidateId) {
        await candidateAPI.updateDetails(candidateId, formData);
      } else {
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
      }

      setStatus('pending');
      setIsLocked(true);
      setMessage({
        type: 'success',
        text: 'Candidate information uploaded successfully! Submitted for Admin Approval.',
      });

      // Refresh nomination data to get newly committed URLs
      const updatedRes = await candidateAPI.getMyNomination();
      if (updatedRes.data?.candidate) {
        setExistingSymbolUrl(updatedRes.data.candidate.symbol_image_url);
        setExistingPhotoUrl(updatedRes.data.candidate.photo_url);
      }
    } catch (err) {
      console.error('Submit nomination error:', err);
      const errMsg = err.response?.data?.message || 'Error saving candidate information.';
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
                <span>Upload Candidate Details</span>
              </span>

              {status === 'approved' ? (
                <span className="px-2.5 py-0.5 bg-[#a0f399] text-[#005312] text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Approved Candidate</span>
                </span>
              ) : status === 'pending' && isLocked ? (
                <span className="px-2.5 py-0.5 bg-[#ffdcc8] text-[#341100] text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Waiting for Approval</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-[#e9e8e4] text-[#1b1c1a] text-[10px] font-extrabold rounded-full uppercase tracking-wider flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>Draft Profile</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1a] mt-2">
              Upload Candidate Details
            </h1>
            <p className="text-xs text-[#717a6d]">
              Enter Party Name, Slogan, Party Motto, Short Bio, Manifesto, Past Experience, Symbol Image & Campaign Ballot Photo.
            </p>
          </div>
        </div>

        {/* Status Banner */}
        {status === 'approved' ? (
          <div className="p-5 rounded-2xl bg-[#e8f5e9] border-2 border-[#a0f399] text-[#005312] flex items-center space-x-3 shadow-xs">
            <CheckCircle2 className="w-6 h-6 text-[#005312] shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Approved Candidate</h3>
              <p className="text-xs mt-0.5 font-medium">
                Approved candidate status confirmed! Your election symbol & campaign ballot photo are active across SuperAdmin, Admin, and Voter lists via GitHub.
              </p>
            </div>
          </div>
        ) : status === 'pending' && isLocked ? (
          <div className="p-5 rounded-2xl bg-[#fff8f1] border-2 border-[#ffdcc8] text-[#341100] flex items-center space-x-3 shadow-xs">
            <Clock className="w-6 h-6 text-[#d97706] shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Waiting for Approval</h3>
              <p className="text-xs mt-0.5 font-medium">
                Candidate information uploaded! Profile is locked pending Admin review. If approved, you will be an Approved Candidate; if rejected, your profile remains as a normal Voter.
              </p>
            </div>
          </div>
        ) : null}

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

        {/* Upload Candidate Details Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#c0c9bb] rounded-2xl p-6 shadow-sm space-y-6">
          {/* Target Election Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <Flag className="w-4 h-4 text-[#00450d]" />
              <span>Target Election</span>
            </label>
            <select
              value={selectedElectionId}
              onChange={handleElectionChange}
              disabled={isLocked || isDeadlinePassed}
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed"
            >
              {elections.map((el) => (
                <option key={el.id} value={el.id}>
                  {el.title} ({el.scope})
                </option>
              ))}
            </select>
          </div>

          {/* Election Post Details Card */}
          {selectedElection && (
            <div className="p-4 bg-[#e8f5e9] border border-[#a0f399] rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#a0f399] pb-2">
                <div>
                  <span className="text-[10px] font-extrabold text-[#005312] uppercase tracking-wider block">Target Election Post</span>
                  <h3 className="text-xs font-black text-[#00450d]">{selectedElection.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-[#00450d] text-white text-[11px] font-bold rounded-lg">
                    🏆 Seat: {selectedElection.position_title || 'President'}
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#00450d] text-[#00450d] text-[11px] font-extrabold rounded-lg">
                    🪑 {selectedElection.total_seats || 20} Seats
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 1. Party / Alliance Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#00450d]" />
              <span>Party Name *</span>
            </label>
            <input
              type="text"
              required
              value={party}
              onChange={(e) => setParty(e.target.value)}
              disabled={isLocked || isDeadlinePassed}
              placeholder="Enter Party / Alliance Name..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 2. Slogan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#00450d]" />
              <span>Slogan *</span>
            </label>
            <input
              type="text"
              required
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              disabled={isLocked || isDeadlinePassed}
              placeholder="Enter Party Slogan..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 3. Party Motto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <Flag className="w-4 h-4 text-[#00450d]" />
              <span>Party Motto *</span>
            </label>
            <input
              type="text"
              required
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              disabled={isLocked || isDeadlinePassed}
              placeholder="Enter Party Motto..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 4. Short Bio / About Me */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#00450d]" />
              <span>Short Bio / About Me *</span>
            </label>
            <textarea
              rows={3}
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLocked || isDeadlinePassed}
              placeholder="Write about yourself..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 5. Manifesto */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-[#00450d]" />
              <span>Manifesto *</span>
            </label>
            <textarea
              rows={4}
              required
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value)}
              disabled={isLocked || isDeadlinePassed}
              placeholder="Write candidate manifesto..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 6. Past Experience / Achievements (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-[#00450d]" />
              <span>Pichla Experience ya Achievements (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              disabled={isLocked || isDeadlinePassed}
              placeholder="Leadership roles, society memberships, or past achievements..."
              className="w-full px-3 py-2.5 text-xs border border-[#c0c9bb] rounded-xl focus:ring-2 focus:ring-[#00450d] bg-white outline-none disabled:bg-[#f4f4f0] disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* 7 & 8. Image Uploads: Party Symbol Image & Campaign Ballot Photo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[#c0c9bb]/60">
            {/* Party Symbol Image */}
            <div className="space-y-2 bg-[#faf9f5] p-4 rounded-2xl border border-[#c0c9bb]">
              <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-[#00450d]" />
                <span>Party Symbol Image (GitHub Commit) *</span>
              </label>
              <p className="text-[11px] text-[#717a6d]">
                Upload your party symbol image. Will be committed to GitHub and shown everywhere via GitHub link.
              </p>

              {existingSymbolUrl && !symbolFile && (
                <div className="p-2 border border-[#c0c9bb] rounded-xl flex items-center space-x-3 bg-white">
                  <img src={existingSymbolUrl.startsWith('http') ? existingSymbolUrl : `http://localhost:5000${existingSymbolUrl}`} alt="Symbol" className="w-12 h-12 object-contain rounded-md" />
                  <div>
                    <span className="text-[11px] text-[#00450d] font-bold block">Party Symbol Saved</span>
                    <span className="text-[9px] text-[#005312] bg-[#a0f399] px-1.5 py-0.5 rounded font-bold">Committed to GitHub</span>
                  </div>
                </div>
              )}

              {!isLocked && !isDeadlinePassed && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSymbolFile(e.target.files[0])}
                  className="w-full text-xs text-[#717a6d] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#00450d] file:text-white hover:file:bg-[#006017] cursor-pointer"
                />
              )}
            </div>

            {/* Campaign Ballot Photo */}
            <div className="space-y-2 bg-[#faf9f5] p-4 rounded-2xl border border-[#c0c9bb]">
              <label className="text-xs font-bold text-[#1b1c1a] flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-[#00450d]" />
                <span>Campaign / Ballot Photo (GitHub Commit) *</span>
              </label>
              <p className="text-[11px] text-[#717a6d]">
                Upload photo for voting ballot list. Will be committed to GitHub and shown across Admin, SuperAdmin, & Voter list.
              </p>

              {existingPhotoUrl && !photoFile && (
                <div className="p-2 border border-[#c0c9bb] rounded-xl flex items-center space-x-3 bg-white">
                  <img src={existingPhotoUrl.startsWith('http') ? existingPhotoUrl : `http://localhost:5000${existingPhotoUrl}`} alt="Ballot Photo" className="w-12 h-12 object-cover rounded-full border border-[#00450d]" />
                  <div>
                    <span className="text-[11px] text-[#00450d] font-bold block">Ballot Photo Saved</span>
                    <span className="text-[9px] text-[#005312] bg-[#a0f399] px-1.5 py-0.5 rounded font-bold">Committed to GitHub</span>
                  </div>
                </div>
              )}

              {!isLocked && !isDeadlinePassed && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="w-full text-xs text-[#717a6d] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#00450d] file:text-white hover:file:bg-[#006017] cursor-pointer"
                />
              )}
            </div>
          </div>

          {/* Terms & Conditions Agreement */}
          {!isLocked && (
            <div className="p-4 bg-[#f4f4f0] border border-[#00450d] rounded-2xl space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-[#00450d] focus:ring-[#00450d] border-[#00450d] rounded accent-[#00450d]"
                />
                <span className="text-xs font-bold text-[#005312] leading-snug">
                  I confirm that all uploaded candidate details are accurate and agree to submit my nomination for Admin approval.
                </span>
              </label>
            </div>
          )}

          {/* Upload Information Action Button */}
          <div className="pt-4 border-t border-[#c0c9bb] flex items-center justify-end">
            <button
              type="submit"
              disabled={isLocked || isDeadlinePassed || submitting}
              className={`px-8 h-12 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 ${
                isLocked || isDeadlinePassed
                  ? 'bg-[#e9e8e4] text-[#717a6d] cursor-not-allowed border border-[#c0c9bb]'
                  : 'bg-[#00450d] hover:bg-[#006017] text-white active:scale-95'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Profile Locked (Waiting for Approval)</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Uploading to GitHub...' : 'Upload Information'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
