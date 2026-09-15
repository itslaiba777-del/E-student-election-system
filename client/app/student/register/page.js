'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/register/step-1');
  }, [router]);

  return (
    <div className="text-center py-12 text-xs text-[#717a6d]">
      Redirecting to Step 1: Identity Verification...
    </div>
  );
}
