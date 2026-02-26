import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1F2937] mb-2">Payment cancelled</h1>
        <p className="text-[#6B7280] mb-8">
          No worries — your payment was not completed and you have not been charged. You can try again whenever you&apos;re ready.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="w-full py-3 rounded-xl bg-[#0D9488] text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
