'use client';

import { useState, useEffect } from 'react';

interface Props {
  message: string;
  storageKey: string;
}

export default function WelcomeCard({ message, storageKey }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-teal-50 border border-[#0D9488]/20 rounded-xl p-5 relative">
      <button
        onClick={dismiss}
        className="absolute top-3 right-4 text-[#6B7280] hover:text-[#1F2937] text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">👋</span>
        <div>
          <p className="font-semibold text-[#1F2937] text-sm mb-1">Welcome!</p>
          <p className="text-sm text-[#6B7280] whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </div>
  );
}
