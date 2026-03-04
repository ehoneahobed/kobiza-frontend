import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In — Kobiza',
  description: 'Sign in or create an account to access Kobiza — the all-in-one platform for creators.',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
