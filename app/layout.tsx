import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tensai – AI-Powered Developer Platform',
  description: 'Connect GitHub repos, analyze codebases, and prepare for AI-driven workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
