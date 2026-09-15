import './globals.css';
import Navbar from '../components/Navbar';
import { StudentFlowProvider } from '../context/StudentFlowContext';
import { ToastProvider } from '../context/ToastContext';
import { BrandingProvider } from '../context/BrandingContext';

export const metadata = {
  title: 'University E-Election System',
  description: 'Secure university student e-voting system with face recognition and OTP verification.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[#faf9f5] text-[#1b1c1a]">
        <BrandingProvider>
          <ToastProvider>
            <StudentFlowProvider>
              <Navbar />
              <main className="flex-1 w-full mx-auto">
                {children}
              </main>
            </StudentFlowProvider>
          </ToastProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
