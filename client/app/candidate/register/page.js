'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CandidateRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/candidate/register/step-1');
  }, [router]);

  return (
    <div className="text-center py-12 text-xs text-[#717a6d]">
      Redirecting to Step 1: Candidate Identity Verification...
    </div>
  );
}
