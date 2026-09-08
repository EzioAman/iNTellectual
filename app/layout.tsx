import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InTellectual // Tactical Esports Platform (Created by Morfit)',
  description: 'State-of-the-art Valorant squad performance analytics, ValoPlant-grade tactical whiteboard, 2D round simulator, lineup vault, and coach management suite. Created by Morfit. All rights reserved.',
  authors: [{ name: 'Morfit' }],
  creator: 'Morfit',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+JP:wght@500;700;900&family=Syncopate:wght@700&family=Teko:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#06070a] text-[#ece8e1] min-h-screen antialiased selection:bg-[#ff4655] selection:text-white">
        {children}
      </body>
    </html>
  );
}
