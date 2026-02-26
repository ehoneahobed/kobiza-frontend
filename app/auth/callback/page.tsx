'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveToken, getMe } from '@/lib/auth';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      router.replace('/login?error=oauth_failed');
      return;
    }
    saveToken(token);
    getMe()
      .then((user) => router.replace(user.role === 'CREATOR' ? '/dashboard' : '/home'))
      .catch(() => router.replace('/login?error=oauth_failed'));
  }, [params, router]);

  return null;
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6B7280]">Signing you in…</p>
        <Suspense>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
