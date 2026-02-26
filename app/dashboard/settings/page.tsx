'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyProfile, updateMyProfile, CreatorProfile } from '@/lib/creator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [form, setForm] = useState({
    name: '',
    bio: '',
    slug: '',
    brandColor: '#0D9488',
    logoUrl: '',
    coverUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        setProfile(p);
        setForm({
          name: p.user.name ?? '',
          bio: p.bio ?? '',
          slug: p.slug ?? '',
          brandColor: p.brandColor ?? '#0D9488',
          logoUrl: p.logoUrl ?? '',
          coverUrl: p.coverUrl ?? '',
        });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const updated = await updateMyProfile({
        name: form.name || undefined,
        bio: form.bio || undefined,
        slug: form.slug || undefined,
        brandColor: form.brandColor || undefined,
        logoUrl: form.logoUrl || undefined,
        coverUrl: form.coverUrl || undefined,
      });
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F2937]">Profile & Storefront</h1>
        <p className="text-[#6B7280] mt-1">
          Customize how your storefront looks at{' '}
          <a
            href={`/${form.slug}`}
            target="_blank"
            className="text-[#0D9488] hover:underline"
          >
            Kobiza.com/{form.slug}
          </a>
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[#1F2937] mb-4">Identity</h2>
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1F2937]">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell your audience who you are and what you teach…"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-[#6B7280] px-4 py-3 text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent resize-none"
              />
              <p className="text-xs text-[#6B7280] text-right">{form.bio.length}/500</p>
            </div>
          </div>
        </div>

        {/* Storefront URL */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[#1F2937] mb-4">Storefront URL</h2>
          <div className="flex items-center gap-2">
            <span className="text-[#6B7280] text-sm whitespace-nowrap">Kobiza.com/</span>
            <Input
              label=""
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))
              }
              placeholder="your-name"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            Only lowercase letters, numbers, and hyphens. Min 3 characters.
          </p>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-[#1F2937] mb-4">Branding</h2>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-[#1F2937]">Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                  className="h-10 w-16 rounded-lg border border-[#6B7280] cursor-pointer p-1"
                />
                <span className="text-sm text-[#6B7280]">{form.brandColor}</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, brandColor: '#0D9488' }))}
                  className="text-xs text-[#6B7280] hover:text-[#0D9488]"
                >
                  Reset to Kobiza Teal
                </button>
              </div>
            </div>
            <Input
              label="Logo URL"
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              placeholder="https://..."
            />
            <Input
              label="Cover Image URL"
              type="url"
              value={form.coverUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#EF4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-[#0D9488] bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
            ✓ Changes saved successfully.
          </p>
        )}

        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
