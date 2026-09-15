'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle2, ArrowLeft, Vote } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendReset = (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Password reset requested for email:', email);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="bg-[#faf9f5] min-h-[calc(100vh-4rem)] text-[#1b1c1a] font-sans flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-[#c0c9bb] space-y-6">
        <div className="flex items-center space-x-2 text-[#00450d] font-bold text-sm">
          <Vote className="w-5 h-5" />
          <span>Campus Vote Portal</span>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-[#1b6d24] mx-auto" />
            <h1 className="text-xl font-bold text-[#1b1c1a]">Password Reset Sent!</h1>
            <p className="text-xs text-[#41493e] leading-relaxed">
              If an account exists for <span className="font-semibold">{email}</span>, a password reset link has been sent. Please check your inbox.
            </p>
            <button
              onClick={() => router.push('/student/login')}
              className="w-full h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>Back to Student Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendReset} className="space-y-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1b1c1a]">Reset Password</h1>
              <p className="text-xs text-[#717a6d] mt-1">
                Enter your registered institutional email address to receive a password reset link.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="reset-email" className="block text-xs font-bold text-[#1b1c1a]">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#717a6d]" />
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="a.sterling@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#faf9f5] border border-[#c0c9bb] rounded-lg text-xs focus:ring-2 focus:ring-[#00450d] focus:border-[#00450d] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#00450d] hover:bg-[#006017] text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Sending Link...' : 'Send reset link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/student/login"
                className="text-xs text-[#00450d] font-bold hover:underline inline-flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
