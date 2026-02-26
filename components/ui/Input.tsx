'use client';

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-[#1F2937]">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-3 text-[#1F2937] placeholder-[#6B7280]
          focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent
          ${error ? 'border-[#EF4444]' : 'border-[#6B7280]'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
