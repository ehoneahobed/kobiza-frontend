'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { verifyCertificate, CertificateVerification } from '@/lib/courses';

export default function VerifyCertificatePage() {
  const { certificateNumber } = useParams();
  const [cert, setCert] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyCertificate(certificateNumber as string)
      .then(setCert)
      .catch(() => setError('Certificate not found or invalid.'))
      .finally(() => setLoading(false));
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
        {error || !cert ? (
          <>
            <div className="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1F2937] mb-2">Invalid Certificate</h1>
            <p className="text-sm text-[#6B7280]">{error}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 mx-auto mb-4 bg-[#0D9488]/10 rounded-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1F2937] mb-1">Valid Certificate</h1>
            <p className="text-sm text-[#6B7280] mb-6">This certificate is authentic and verified.</p>

            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
              <div>
                <p className="text-xs text-[#6B7280]">Student</p>
                <p className="text-sm font-medium text-[#1F2937]">{cert.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Course</p>
                <p className="text-sm font-medium text-[#1F2937]">{cert.courseTitle}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Instructor</p>
                <p className="text-sm font-medium text-[#1F2937]">{cert.creatorName}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Issued</p>
                <p className="text-sm font-medium text-[#1F2937]">
                  {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">Certificate ID</p>
                <p className="text-sm font-mono text-[#1F2937]">{cert.certificateNumber}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
