import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice OS',
  description: 'Multi-tenant invoicing platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-black min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}