import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Creators & Communities — Kobiza',
  description: 'Discover courses, communities, coaching, and downloads from creators worldwide.',
  openGraph: {
    title: 'Explore Creators & Communities — Kobiza',
    description: 'Discover courses, communities, coaching, and downloads from creators worldwide.',
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
