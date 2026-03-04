'use client';

import { useEffect, useState } from 'react';
import { getMyProfile, CreatorProfile } from '@/lib/creator';
import { getRecipientCount, sendBroadcast } from '@/lib/broadcast';

export default function BroadcastPage() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [communityId, setCommunityId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  useEffect(() => {
    if (!communityId) {
      setRecipientCount(null);
      return;
    }
    setLoadingCount(true);
    getRecipientCount(communityId)
      .then((r) => setRecipientCount(r.count))
      .catch(() => setRecipientCount(0))
      .finally(() => setLoadingCount(false));
  }, [communityId]);

  const handleSend = async () => {
    if (!communityId || !subject.trim() || !body.trim()) return;
    if (!confirm(`Send this email to ${recipientCount ?? 0} members?`)) return;
    setSending(true);
    setError('');
    setResult(null);
    try {
      const res = await sendBroadcast(communityId, subject.trim(), body.trim());
      setResult(res);
      setSubject('');
      setBody('');
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const communities = profile?.communities ?? [];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Broadcast Email</h1>

      {/* Community selector */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <label className="block text-sm font-medium text-[#1F2937] mb-2">
          Select Community
        </label>
        <select
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#0D9488] bg-white"
        >
          <option value="">Choose a community…</option>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {loadingCount && (
          <p className="text-xs text-[#6B7280] mt-2">Loading recipients…</p>
        )}
        {!loadingCount && recipientCount !== null && (
          <p className="text-xs text-[#6B7280] mt-2">
            {recipientCount} member{recipientCount !== 1 ? 's' : ''} will receive this email
          </p>
        )}
      </div>

      {/* Email form */}
      {communityId && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Body (HTML supported)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email content here. HTML tags are supported for formatting."
              rows={10}
              className="w-full rounded-lg border border-[#D1D5DB] px-4 py-2.5 text-sm text-[#1F2937] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-y"
            />
          </div>

          {/* Preview */}
          {body.trim() && (
            <div className="mb-4">
              <p className="text-sm font-medium text-[#1F2937] mb-2">Preview</p>
              <div
                className="border border-[#D1D5DB] rounded-lg p-4 text-sm text-[#1F2937] bg-[#F9FAFB]"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={!subject.trim() || !body.trim() || sending || recipientCount === 0}
            className="bg-[#0D9488] text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : `Send Broadcast${recipientCount !== null ? ` to ${recipientCount} member${recipientCount !== 1 ? 's' : ''}` : ''}`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-[#0D9488]">
          Broadcast sent to {result.sent} member{result.sent !== 1 ? 's' : ''}!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-[#EF4444]">
          {error}
        </div>
      )}
    </div>
  );
}
