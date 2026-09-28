'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentFlow } from '../../../../context/StudentFlowContext';
import CandidateRegistrationStepIndicator from '../../../../components/CandidateRegistrationStepIndicator';
import {
  Camera,
  RefreshCw,
  SwitchCamera,
  X,
  CheckCircle2,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function CandidateStep3FaceScanPage() {
  const router = useRouter();
  const { capturedFaceImage, setCapturedFaceImage } = useStudentFlow();

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [loading, setLoading] = useState(false);

  const startCamera = async (mode = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: mode },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error('Webcam access error:', err);
      setCameraError('Unable to access camera feed. Please check browser permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!capturedFaceImage) {
      startCamera(facingMode);
    }
    return () => stopCamera();
  }, [facingMode]);

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedFaceImage(dataUrl);
    stopCamera();
  };

  const handleRetakePhoto = () => {
    setCapturedFaceImage(null);
    startCamera(facingMode);
  };

  const handleContinue = () => {
    if (!capturedFaceImage) return;
    setLoading(true);
    stopCamera();
    setTimeout(() => {
      router.push('/candidate/register/step-4');
    }, 400);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex flex-col justify-between">
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        <CandidateRegistrationStepIndicator currentStep={3} />

        <div className="w-full max-w-2xl bg-white border border-[#c0c9bb] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
          <div className="mb-6">
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-[#acf4a4] text-[#002203] text-[10px] font-extrabold uppercase tracking-wider rounded-full mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Candidate Biometric Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b1c1a]">
              Candidate Face Scanning
            </h1>
            <p className="text-xs text-[#41493e] mt-1">
              Capture your biometric face profile. Your scanned photo will be hashed, stored on disk, and committed to git repo.
            </p>
          </div>

          {/* Viewfinder Canvas */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-4 border-[#00450d] overflow-hidden bg-[#1b1c1a] flex items-center justify-center shadow-lg mb-6">
            {capturedFaceImage ? (
              <img src={capturedFaceImage} alt="Captured Face" className="w-full h-full object-cover" />
            ) : isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="text-white p-4 flex flex-col items-center">
                <User className="w-16 h-16 opacity-40 mb-2" />
                <p className="text-xs text-slate-300">{cameraError || 'Camera inactive'}</p>
              </div>
            )}
          </div>

          {/* Camera Actions */}
          <div className="w-full max-w-md space-y-4">
            {!capturedFaceImage ? (
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="px-4 py-2 bg-[#f4f4f0] border border-[#c0c9bb] text-[#1b1c1a] font-bold text-xs rounded-xl flex items-center space-x-1.5 hover:bg-[#e9e8e4]"
                >
                  <SwitchCamera className="w-4 h-4 text-[#00450d]" />
                  <span>Switch Camera</span>
                </button>

                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-6 py-2 bg-[#00450d] text-white font-bold text-xs rounded-xl flex items-center space-x-2 hover:bg-[#006017] shadow-md"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="px-4 py-2 bg-[#f4f4f0] border border-[#c0c9bb] text-[#1b1c1a] font-bold text-xs rounded-xl flex items-center space-x-1.5 hover:bg-[#e9e8e4]"
                  >
                    <RefreshCw className="w-4 h-4 text-[#00450d]" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={loading}
                    className="px-6 py-2 bg-[#00450d] text-white font-bold text-xs rounded-xl flex items-center space-x-2 hover:bg-[#006017] shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Processing...' : 'Confirm & Continue'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
