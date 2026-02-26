'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, updateMe, forgotPassword, clearToken, AuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function MemberSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setName(u.name);
        setAvatarUrl(u.avatarUrl ?? '');
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      const updated = await updateMe({
        name: name.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      setUser(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user) return;
    setResetLoading(true);
    try {
      await forgotPassword(user.email);
      setResetSent(true);
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      {/* Nav */}
      <header className="bg-[#1F2937] sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/home" className="text-white/60 hover:text-white text-sm transition-colors">
            ← My Learning
          </Link>
          <span className="text-white font-semibold ml-auto">Account Settings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-[#1F2937] text-lg mb-1">Profile</h2>
          <p className="text-sm text-[#6B7280] mb-5">Update how you appear in communities.</p>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#0D9488]/10 flex items-center justify-center font-bold text-[#0D9488] text-xl overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                (name || user?.name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-medium text-[#1F2937] text-sm">{user?.name}</p>
              <p className="text-xs text-[#6B7280]">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Avatar URL"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://... (profile photo URL)"
            />

            {profileError && (
              <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {profileError}
              </p>
            )}
            {profileSuccess && (
              <p className="text-sm text-[#0D9488] bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
                ✓ Profile updated successfully.
              </p>
            )}

            <Button type="submit" loading={saving}>
              Save Profile
            </Button>
          </form>
        </div>

        {/* Password section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-[#1F2937] text-lg mb-1">Password</h2>
          <p className="text-sm text-[#6B7280] mb-5">
            We&apos;ll send a password reset link to{' '}
            <strong className="text-[#1F2937]">{user?.email}</strong>.
          </p>

          {resetSent ? (
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
              <span className="text-[#0D9488]">✓</span>
              <p className="text-sm text-[#0D9488]">
                Password reset email sent. Check your inbox.
              </p>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={handleSendPasswordReset}
              loading={resetLoading}
            >
              Send Password Reset Email
            </Button>
          )}
        </div>

        {/* Account section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-[#1F2937] text-lg mb-1">Account</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#1F2937]">Signed in as <strong>{user?.email}</strong></p>
              <p className="text-xs text-[#6B7280] mt-0.5">Role: {user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-[#EF4444] hover:underline font-medium"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
