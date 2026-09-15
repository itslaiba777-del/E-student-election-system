'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-emerald-200 text-sm">
      Redirecting to Unified Authentication Portal...
    </div>
  );
}
