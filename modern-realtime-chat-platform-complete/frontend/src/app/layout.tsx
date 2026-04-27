import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css'; // Global Tailwind CSS imports
import { AuthProvider } from '../contexts/AuthContext'; // Auth Context Provider

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Real-time Chat App',
  description: 'A comprehensive real-time chat application built with Next.js and NestJS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* Wrap the entire app with AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}