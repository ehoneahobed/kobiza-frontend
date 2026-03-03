'use client';

import { useEffect, useState } from 'react';

interface CourseCompletionModalProps {
  courseTitle: string;
  courseId: string;
  onClose: () => void;
}

// CSS-only confetti: 25 small colored divs with fall animation
function Confetti() {
  const colors = ['#0D9488', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];
  const [pieces] = useState(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    })),
  );

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
        {pieces.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: `${p.left}%`,
              top: '-10px',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.size > 9 ? '50%' : '2px',
              animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}
      </div>
    </>
  );
}

export default function CourseCompletionModal({ courseTitle, courseId, onClose }: CourseCompletionModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setShow(true));
  }, []);

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        {/* Card */}
        <div
          className={`relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transition-all duration-500 ${
            show ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {/* Trophy icon */}
          <div className="w-20 h-20 mx-auto mb-5 bg-[#F59E0B]/10 rounded-full flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M16 8H32V16C32 22.627 26.627 28 24 28C21.373 28 16 22.627 16 16V8Z" fill="#F59E0B" />
              <path d="M12 8H16V16C16 16 12 14 12 10V8Z" fill="#F59E0B" opacity="0.6" />
              <path d="M32 8H36V10C36 14 32 16 32 16V8Z" fill="#F59E0B" opacity="0.6" />
              <rect x="20" y="28" width="8" height="6" rx="1" fill="#D97706" />
              <rect x="16" y="34" width="16" height="4" rx="2" fill="#F59E0B" />
              <rect x="14" y="38" width="20" height="3" rx="1.5" fill="#D97706" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#1F2937] mb-2">
            Congratulations!
          </h2>
          <p className="text-[#6B7280] mb-6">
            You&apos;ve completed <span className="font-semibold text-[#1F2937]">{courseTitle}</span>
          </p>

          <div className="flex flex-col gap-3">
            <a
              href="/home"
              className="bg-[#0D9488] text-white font-semibold py-3 px-6 rounded-xl hover:bg-teal-700 transition-colors text-sm"
            >
              Back to Home
            </a>
            <button
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#1F2937] font-medium py-2 px-6 rounded-xl text-sm transition-colors"
            >
              Review Course
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
