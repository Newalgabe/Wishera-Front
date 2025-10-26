"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { verifyEmail } from "../api";
import { useLanguage } from "../../contexts/LanguageContext";

function AnimatedBlobs() {
  return (
    <>
      <motion.div className="absolute -top-24 -left-24 w-96 h-96 bg-green-400 opacity-30 rounded-full blur-3xl z-0" animate={{ y: [0, 30, 0], x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute top-40 -right-32 w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl z-0" animate={{ y: [0, -20, 0], x: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-400 opacity-20 rounded-full blur-3xl z-0" animate={{ y: [0, 20, 0], x: [0, 10, 0] }} transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }} />
    </>
  );
}

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully! You can now log in.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
      <AnimatedBlobs />
      <motion.div
        className="relative z-10 bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700 backdrop-blur-lg transition-colors duration-300"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">
                Verifying Email
              </h1>
              <p className="text-gray-600 dark:text-gray-400 transition-colors duration-300">
                {message}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="inline-block rounded-full h-16 w-16 bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">
                Email Verified!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 transition-colors duration-300">
                Redirecting to login...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="inline-block rounded-full h-16 w-16 bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors duration-300">
                Verification Failed
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors duration-300">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <Link 
                  href="/register"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:scale-105 transition-transform"
                >
                  Register Again
                </Link>
                <Link 
                  href="/login"
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

