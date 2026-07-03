import './globals.css';
import { ThemeProvider } from '@/components/ThemeContext';
import SplashScreen from '@/components/SplashScreen';
import Navbar from '@/components/Navbar';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: 'AuraMuse - AI Actress & Image Gallery',
  description: 'Premium organize dashboard and interactive gallery for AI generated actresses and stories.',
  manifest: '/manifest.json',
  appleWebAppCapable: 'yes',
  appleWebAppStatusBarStyle: 'black-translucent',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/logo.png" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#a855f7" />
      </head>
      <body>
        <ThemeProvider>
          <SplashScreen />
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
