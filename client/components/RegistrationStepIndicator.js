'use client';
import { Fingerprint, GraduationCap, Camera, FileText } from 'lucide-react';

export default function RegistrationStepIndicator({ currentStep = 1 }) {
  const steps = [
    { number: 1, label: 'Identity Verification', icon: Fingerprint },
    { number: 2, label: 'Academic Details', icon: GraduationCap },
    { number: 3, label: 'Face Capture', icon: Camera },
    { number: 4, label: 'Review & Submit', icon: FileText },
  ];

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-start w-full relative max-w-3xl mx-auto">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrent = step.number === currentStep;
          const isCompleted = step.number < currentStep;

          return (
            <div key={step.number} className="flex-1 flex flex-col items-center z-10 relative">
              {/* Connector line behind steps */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 transition-colors ${
                    step.number < currentStep ? 'bg-[#1b5e20]' : 'bg-[#c0c9bb]'
                  }`}
                />
              )}

              {/* Step Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all font-bold text-sm ${
                  isCurrent
                    ? 'bg-[#00450d] text-white ring-4 ring-[#00450d]/15 shadow-sm'
                    : isCompleted
                    ? 'bg-[#1b6d24] text-white'
                    : 'bg-[#e9e8e4] text-[#41493e]'
                }`}
              >
                {isCompleted ? '✓' : <Icon className="w-5 h-5" />}
              </div>

              {/* Step Title Label */}
              <span
                className={`text-xs text-center px-1 font-medium transition-colors ${
                  isCurrent
                    ? 'text-[#00450d] font-bold'
                    : isCompleted
                    ? 'text-[#1b6d24] font-semibold'
                    : 'text-[#717a6d]'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
