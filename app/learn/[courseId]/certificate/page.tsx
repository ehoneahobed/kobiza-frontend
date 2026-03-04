'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getCertificate, CourseCertificate } from '@/lib/courses';

export default function CertificatePage() {
  const { courseId } = useParams();
  const [cert, setCert] = useState<CourseCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCertificate(courseId as string)
      .then(setCert)
      .catch((err) => setError(err.message ?? 'Certificate not available yet.'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center max-w-md">
          <p className="text-[#6B7280]">{error || 'Certificate not available.'}</p>
          <a href="/home" className="text-[#0D9488] text-sm font-medium mt-4 inline-block hover:underline">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 print:bg-white print:p-0">
      <div className="w-full max-w-2xl">
        {/* Certificate card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#0D9488]/20 p-10 sm:p-14 text-center print:shadow-none print:border-2 print:rounded-none">
          {/* Header ornament */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#0D9488]/10 rounded-full flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
                <path d="M16 8H32V16C32 22.627 26.627 28 24 28C21.373 28 16 22.627 16 16V8Z" fill="#0D9488" />
                <path d="M12 8H16V16C16 16 12 14 12 10V8Z" fill="#0D9488" opacity="0.6" />
                <path d="M32 8H36V10C36 14 32 16 32 16V8Z" fill="#0D9488" opacity="0.6" />
                <rect x="20" y="28" width="8" height="6" rx="1" fill="#0A7A70" />
                <rect x="16" y="34" width="16" height="4" rx="2" fill="#0D9488" />
                <rect x="14" y="38" width="20" height="3" rx="1.5" fill="#0A7A70" />
              </svg>
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-[#0D9488] font-semibold mb-2">
            Certificate of Completion
          </p>

          <div className="w-20 h-px bg-[#0D9488]/30 mx-auto mb-6" />

          <p className="text-sm text-[#6B7280] mb-1">This certifies that</p>
          <h1 className="text-3xl font-bold text-[#1F2937] mb-4">{cert.studentName}</h1>

          <p className="text-sm text-[#6B7280] mb-1">has successfully completed</p>
          <h2 className="text-xl font-semibold text-[#1F2937] mb-4">{cert.courseTitle}</h2>

          <p className="text-sm text-[#6B7280] mb-6">
            Taught by <span className="font-medium text-[#1F2937]">{cert.creatorName}</span>
          </p>

          <div className="w-20 h-px bg-[#0D9488]/30 mx-auto mb-4" />

          <div className="flex items-center justify-center gap-6 text-xs text-[#6B7280]">
            <span>{issuedDate}</span>
            <span className="text-[#0D9488]/40">|</span>
            <span className="font-mono">{cert.certificateNumber}</span>
          </div>

          <p className="text-[10px] text-[#9CA3AF] mt-6">
            Verify at kobiza.com/verify/{cert.certificateNumber}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mt-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-[#0D9488] text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-teal-700 transition-colors"
          >
            Print / Save PDF
          </button>
          <a
            href="/home"
            className="text-[#6B7280] font-medium px-6 py-2.5 rounded-xl text-sm hover:text-[#1F2937] transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
