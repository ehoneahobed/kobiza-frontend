'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getMe, updateMe, forgotPassword, upgradeToCreator, clearToken, AuthUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';

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

  // Privacy
  const [showActivityGraph, setShowActivityGraph] = useState(true);

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Upgrade to creator
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setName(u.name);
        setAvatarUrl(u.avatarUrl ?? '');
        setShowActivityGraph(u.showActivityGraph);
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

  const handleUpgradeToCreator = async () => {
    setUpgrading(true);
    setUpgradeError('');
    try {
      await upgradeToCreator();
      router.push('/dashboard?welcome=1');
    } catch (err: any) {
      setUpgradeError(err.message ?? 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
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
          <Link href="/home/messages" className="text-white/60 hover:text-white text-sm transition-colors">
            ✉ Messages
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
            <ImageUpload
              label="Avatar"
              value={avatarUrl}
              onChange={(url) => setAvatarUrl(url)}
              purpose="avatar"
              aspectRatio={1}
              maxSizeMB={2}
              shape="round"
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

        {/* Privacy section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-[#1F2937] text-lg mb-1">Privacy</h2>
          <p className="text-sm text-[#6B7280] mb-5">Control what other community members can see.</p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1F2937]">Activity Graph</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Show your activity heatmap on your profile in community member lists.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showActivityGraph}
              onClick={async () => {
                const prev = showActivityGraph;
                setShowActivityGraph(!prev);
                try {
                  const updated = await updateMe({ showActivityGraph: !prev });
                  setUser(updated);
                } catch {
                  setShowActivityGraph(prev);
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showActivityGraph ? 'bg-[#0D9488]' : 'bg-[#D1D5DB]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showActivityGraph ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
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

        {/* Become a Creator — only for members */}
        {user?.role === 'MEMBER' && (
          <div className="rounded-xl shadow-sm overflow-hidden bg-gradient-to-br from-[#1F2937] to-[#0D9488]">
            <div className="p-6">
              <h2 className="font-bold text-white text-lg mb-1">Become a Creator</h2>
              <p className="text-white/70 text-sm mb-4">
                Start building your own community, selling courses, and earning on Kobiza.
              </p>

              {!showUpgradeConfirm ? (
                <button
                  onClick={() => setShowUpgradeConfirm(true)}
                  className="bg-[#F59E0B] hover:bg-amber-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                >
                  Get Started as a Creator
                </button>
              ) : (
                <div className="bg-white/10 backdrop-blur rounded-xl p-5 space-y-4">
                  <p className="text-white font-semibold text-sm">Ready to upgrade?</p>
                  <ul className="text-white/80 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-0.5">&#x2713;</span>
                      <span>Free to start &mdash; no credit card required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-0.5">&#x2713;</span>
                      <span>Create 1 community with courses, coaching &amp; downloads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F59E0B] mt-0.5">&#x2713;</span>
                      <span>All your existing enrollments &amp; data are preserved</span>
                    </li>
                  </ul>

                  {upgradeError && (
                    <p className="text-sm text-red-300 bg-red-500/20 rounded-lg px-4 py-2">
                      {upgradeError}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleUpgradeToCreator}
                      disabled={upgrading}
                      className="bg-[#F59E0B] hover:bg-amber-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2"
                    >
                      {upgrading && (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      Confirm &amp; Upgrade
                    </button>
                    <button
                      onClick={() => { setShowUpgradeConfirm(false); setUpgradeError(''); }}
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
