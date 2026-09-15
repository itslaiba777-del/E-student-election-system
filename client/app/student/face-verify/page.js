'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { voteAPI } from '../../../lib/api';
import FaceCapture from '../../../components/FaceCapture';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function FaceVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const electionId = searchParams.get('election_id');

  const [faceData, setFaceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerifyFace = async () => {
    if (!faceData || !faceData.descriptor) {
      setError('Please capture your face photo first.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await voteAPI.verifyFace(electionId, faceData.descriptor);
      // Face Verified -> Proceed to Secret Voting Booth!
      router.push(`/student/vote?election_id=${electionId}`);
    } catch (err) {
      console.warn('Face verification failed:', err);
      // Route to dedicated Face Failed Lockout page
      router.push(`/student/vote-locked/face-failed?election_id=${electionId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 font-bold">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Step 2: Facial Biometric Verification</h1>
        <p className="text-xs text-slate-500">
          Capture your face to verify against your registered biometric profile. Maximum 1 attempt allowed.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <FaceCapture onCapture={(data) => setFaceData(data)} label="Verify Face Biometrics" />

        <button
          type="button"
          onClick={handleVerifyFace}
          disabled={loading || !faceData}
          className={`w-full font-semibold text-xs py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 ${
            faceData
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{loading ? 'Verifying Facial Features...' : 'Confirm & Proceed to Vote'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
