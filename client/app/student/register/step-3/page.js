'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentFlow } from '../../../../context/StudentFlowContext';
import RegistrationStepIndicator from '../../../../components/RegistrationStepIndicator';
import {
  Camera,
  RefreshCw,
  SwitchCamera,
  X,
  CheckCircle2,
  Lock,
  Sun,
  Glasses,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function Step3FaceCapturePage() {
  const router = useRouter();
  const { capturedFaceImage, setCapturedFaceImage } = useStudentFlow();

  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front) or 'environment' (back)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize webcam feed
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
      setCameraError('Unable to access camera. Please allow browser camera permissions.');
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

  // Switch camera mode (front vs back)
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from webcam stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Draw video frame centered in canvas
    ctx.drawImage(videoRef.current, 0, 0, 480, 480);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setCapturedFaceImage(dataUrl);
    stopCamera();
  };

  // Retake photo handler
  const handleRetakePhoto = () => {
    setCapturedFaceImage(null);
    startCamera(facingMode);
  };

  // Confirm cancel registration
  const handleConfirmCancel = () => {
    stopCamera();
    router.push('/student/login-or-register');
  };

  // Continue to Step 4
  const handleContinue = () => {
    if (!capturedFaceImage) return;
    setLoading(true);
    stopCamera();
    setTimeout(() => {
      router.push('/student/register/step-4');
    }, 400);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex flex-col justify-between">
      {/* Top Bar with Cancel Action */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-[#00450d] font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Campus Vote Verification</span>
        </div>

        <button
          onClick={() => setShowCancelModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full hover:bg-[#e9e8e4] transition-colors text-xs font-semibold text-[#41493e]"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Standardized 4-Step Indicator */}
        <RegistrationStepIndicator currentStep={3} />

        {/* Viewfinder Main Canvas Card */}
        <div className="w-full max-w-2xl bg-white border border-[#c0c9bb] rounded-2xl p-6 sm:p-8 shadow-[0px_4px_12px_rgba(27,94,32,0.05)] flex flex-col items-center text-center">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1b1c1a] tracking-tight">
              Verify Identity
            </h1>
            <p className="text-xs text-[#41493e] mt-1">
              Secure biometric capture ensures one vote per student.
            </p>
          </div>

          {cameraError && (
            <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-lg border border-[#ba1a1a]/20 text-xs flex items-center space-x-2 mb-4 w-full">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Viewfinder Area */}
          <div className="relative mb-6">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-[#1b5e20] shadow-[0_0_0_8px_rgba(27,94,32,0.1)] bg-[#dbdad6] flex items-center justify-center">
              {/* Scan line effect when camera live */}
              {isCameraActive && !capturedFaceImage && (
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#1b5e20] to-transparent animate-pulse z-20 top-1/2 -translate-y-1/2" />
              )}

              {capturedFaceImage ? (
                /* Captured Photo Preview */
                <img
                  src={capturedFaceImage}
                  alt="Captured Student Face"
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Live Webcam Feed */
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Viewfinder Circular Guide Overlay */}
              {!capturedFaceImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-64 border-2 border-white/50 rounded-[100px] border-dashed" />
                </div>
              )}
            </div>

            {/* Status Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-1 rounded-full border border-[#a0f399] flex items-center space-x-2 shadow-sm text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  capturedFaceImage
                    ? 'bg-[#1b6d24]'
                    : isCameraActive
                    ? 'bg-[#00450d] animate-pulse'
                    : 'bg-[#ba1a1a]'
                }`}
              />
              <span className="font-bold text-[#00450d]">
                {capturedFaceImage
                  ? 'Photo Recorded'
                  : isCameraActive
                  ? 'Camera Ready'
                  : 'Camera Disconnected'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-[#1b1c1a]">
              {capturedFaceImage
                ? 'Review your biometric photo before proceeding'
                : 'Position your face clearly within the frame'}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-3">
              <div className="flex items-center space-x-1 text-xs text-[#41493e]">
                <Sun className="w-3.5 h-3.5" />
                <span>Good lighting</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-[#41493e]">
                <Glasses className="w-3.5 h-3.5" />
                <span>No glasses</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-[#41493e]">
                <User className="w-3.5 h-3.5" />
                <span>Stay centered</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            {capturedFaceImage ? (
              <>
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="w-full sm:w-auto px-6 h-11 bg-[#e9e8e4] hover:bg-[#e3e2df] text-[#1b1c1a] font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retake Photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                >
                  <span>{loading ? 'Proceeding...' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  disabled={!isCameraActive}
                  className="w-full sm:w-auto px-8 h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture photo</span>
                </button>

                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="w-full sm:w-auto px-6 h-11 bg-[#e9e8e4] hover:bg-[#e3e2df] text-[#1b1c1a] font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-all"
                >
                  <SwitchCamera className="w-4 h-4" />
                  <span>Switch Camera</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Encrypted Note */}
        <div className="mt-4 flex items-center space-x-2 text-xs text-[#717a6d] opacity-75">
          <Lock className="w-3.5 h-3.5" />
          <span>Biometric data is encrypted and used only for voter verification.</span>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#c0c9bb] text-center">
            <AlertCircle className="w-10 h-10 text-[#ba1a1a] mx-auto" />
            <div>
              <h3 className="font-bold text-[#1b1c1a] text-base">Cancel Registration?</h3>
              <p className="text-xs text-[#717a6d] mt-1">
                Are you sure you want to cancel registration? Your progress will be lost.
              </p>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-10 bg-[#e9e8e4] text-[#1b1c1a] font-semibold text-xs rounded-lg"
              >
                No, Keep Going
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 h-10 bg-[#ba1a1a] text-white font-bold text-xs rounded-lg"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
