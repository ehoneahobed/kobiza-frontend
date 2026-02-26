'use client';

import { useEffect, useState } from 'react';
import {
  listMyDownloadables,
  createDownloadable,
  updateDownloadable,
  deleteDownloadable,
  Downloadable,
  formatDownloadPrice,
} from '@/lib/downloadables';
import { getMyProfile } from '@/lib/creator';
import { CopyLinkButton } from '@/components/ui/CopyLinkButton';

// ── Types ───────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  description: string;
  fileUrl: string;
  coverUrl: string;
  price: string; // dollars string
  currency: string;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  fileUrl: '',
  coverUrl: '',
  price: '0',
  currency: 'USD',
  isPublished: false,
};

// ── Form modal ──────────────────────────────────────────────────────────────

function DownloadableModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Downloadable;
  onSave: (data: Omit<FormState, 'price'> & { price: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          title: initial.title,
          description: initial.description ?? '',
          fileUrl: '',
          coverUrl: initial.coverUrl ?? '',
          price: String(initial.price / 100),
          currency: initial.currency,
          isPublished: initial.isPublished,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required.');
    if (!initial && !form.fileUrl.trim()) return setError('File URL is required.');
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        price: Math.round(parseFloat(form.price || '0') * 100),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#F3F4F6]">
          <h2 className="text-lg font-bold text-[#1F2937]">
            {initial ? 'Edit Download' : 'New Download'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Ultimate Marketing Playbook"
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              placeholder="What will they get from this download?"
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
            />
          </div>

          {!initial && (
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">File URL *</label>
              <input
                value={form.fileUrl}
                onChange={(e) => set('fileUrl', e.target.value)}
                placeholder="https://..."
                type="url"
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
              <p className="text-xs text-[#6B7280] mt-1">
                Direct link to the file (PDF, ZIP, MP4, etc.)
              </p>
            </div>
          )}

          {initial && (
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">
                Replace File URL{' '}
                <span className="text-[#6B7280] font-normal">(leave blank to keep current)</span>
              </label>
              <input
                value={form.fileUrl}
                onChange={(e) => set('fileUrl', e.target.value)}
                placeholder="https://..."
                type="url"
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Cover Image URL</label>
            <input
              value={form.coverUrl}
              onChange={(e) => set('coverUrl', e.target.value)}
              placeholder="https://... (optional)"
              type="url"
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Price (0 = free)</label>
              <input
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1F2937] mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] bg-white"
              >
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
                <option value="GHS">GHS</option>
                <option value="KES">KES</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('isPublished', !form.isPublished)}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.isPublished ? 'bg-[#0D9488]' : 'bg-[#D1D5DB]'}`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </div>
            <span className="text-sm font-medium text-[#1F2937]">
              {form.isPublished ? 'Published' : 'Draft'}
            </span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#E5E7EB] text-sm font-medium text-[#6B7280] hover:border-[#0D9488] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#0D9488] text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Download card ───────────────────────────────────────────────────────────

function DownloadCard({
  dl,
  shareUrl,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  dl: Downloadable;
  shareUrl?: string;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Cover */}
      {dl.coverUrl ? (
        <img
          src={dl.coverUrl}
          alt={dl.title}
          className="w-full h-32 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-[#0D9488]/20 to-[#38BDF8]/20 flex items-center justify-center text-5xl">
          📥
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Status badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              dl.isPublished
                ? 'bg-teal-50 text-[#0D9488]'
                : 'bg-[#F3F4F6] text-[#6B7280]'
            }`}
          >
            {dl.isPublished ? '● Published' : '○ Draft'}
          </span>
          <span className="text-xs bg-[#F59E0B]/10 text-[#F59E0B] font-semibold px-2 py-0.5 rounded-full">
            {formatDownloadPrice(dl.price, dl.currency)}
          </span>
        </div>

        <h3 className="font-bold text-[#1F2937] text-sm line-clamp-2 mb-1">{dl.title}</h3>
        {dl.description && (
          <p className="text-xs text-[#6B7280] line-clamp-2 mb-3">{dl.description}</p>
        )}

        {dl._count !== undefined && (
          <p className="text-xs text-[#6B7280] mb-3">
            📥 {dl._count.accesses} {dl._count.accesses === 1 ? 'download' : 'downloads'}
          </p>
        )}

        {shareUrl && dl.isPublished && (
          <div className="mb-3">
            <CopyLinkButton url={shareUrl} className="w-full justify-center" />
          </div>
        )}
        <div className="mt-auto flex gap-2">
          <button
            onClick={onTogglePublish}
            className="flex-1 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#6B7280] hover:border-[#0D9488] hover:text-[#0D9488] transition-colors"
          >
            {dl.isPublished ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-medium hover:bg-teal-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="py-2 px-3 rounded-xl border border-red-200 text-red-500 text-xs hover:bg-red-50 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function DownloadsDashboardPage() {
  const [downloads, setDownloads] = useState<Downloadable[]>([]);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Downloadable | undefined>();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    Promise.all([listMyDownloadables(), getMyProfile()])
      .then(([dls, p]) => { setDownloads(dls); setSlug(p.slug); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: Omit<FormState, 'price'> & { price: number }) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      fileUrl: data.fileUrl || undefined,
      coverUrl: data.coverUrl || undefined,
      price: data.price,
      currency: data.currency,
      isPublished: data.isPublished,
    };

    if (editing) {
      const updated = await updateDownloadable(editing.id, payload);
      setDownloads((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } else {
      const created = await createDownloadable({
        ...payload,
        fileUrl: data.fileUrl,
      });
      setDownloads((prev) => [created, ...prev]);
    }
    setEditing(undefined);
  };

  const handleTogglePublish = async (dl: Downloadable) => {
    const updated = await updateDownloadable(dl.id, { isPublished: !dl.isPublished });
    setDownloads((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleDelete = async (dl: Downloadable) => {
    if (!confirm(`Delete "${dl.title}"? This cannot be undone.`)) return;
    await deleteDownloadable(dl.id);
    setDownloads((prev) => prev.filter((d) => d.id !== dl.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Downloads</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Sell or give away ebooks, templates, and other digital files.
          </p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowModal(true); }}
          className="flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
        >
          <span>+</span>
          <span>New Download</span>
        </button>
      </div>

      {/* Stats row */}
      {downloads.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Downloads"
            value={downloads.length}
            icon="📥"
          />
          <StatCard
            label="Published"
            value={downloads.filter((d) => d.isPublished).length}
            icon="✅"
          />
          <StatCard
            label="Total Accesses"
            value={downloads.reduce((acc, d) => acc + (d._count?.accesses ?? 0), 0)}
            icon="📊"
          />
        </div>
      )}

      {/* Empty state */}
      {downloads.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📥</div>
          <h2 className="text-xl font-bold text-[#1F2937] mb-2">No downloads yet</h2>
          <p className="text-[#6B7280] text-sm max-w-sm mx-auto mb-6">
            Publish your first digital product — an ebook, template, cheat sheet, or any file your
            audience will love.
          </p>
          <button
            onClick={() => { setEditing(undefined); setShowModal(true); }}
            className="bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
          >
            Create your first download
          </button>
        </div>
      )}

      {/* Grid */}
      {downloads.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.map((dl) => (
            <DownloadCard
              key={dl.id}
              dl={dl}
              shareUrl={slug ? `${origin}/${slug}/downloads/${dl.id}` : undefined}
              onEdit={() => { setEditing(dl); setShowModal(true); }}
              onTogglePublish={() => handleTogglePublish(dl)}
              onDelete={() => handleDelete(dl)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <DownloadableModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1F2937]">{value}</p>
        <p className="text-xs text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}
