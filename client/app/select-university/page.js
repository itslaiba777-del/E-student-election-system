'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectUniversityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-6 text-center text-xs text-[#717a6d]">
      Redirecting to portal hub...
    </div>
  );
}
