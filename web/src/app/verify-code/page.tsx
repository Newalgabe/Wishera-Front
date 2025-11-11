"use client";
import { Suspense, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyLoginCode, verifyResetCode, resendLoginCode, forgotPassword } from "../api";
import Notification from "../../components/Notification";
import { useLanguage } from "../../contexts/LanguageContext";

function AnimatedBlobs() {
  return (
    <>
      <motion.div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 opacity-30 rounded-full blur-3xl z-0" animate={{ y: [0, 30, 0], x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute top-40 -right-32 w-80 h-80 bg-pink-400 opacity-20 rounded-full blur-3xl z-0" animate={{ y: [0, -20, 0], x: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-400 opacity-20 rounded-full blur-3xl z-0" animate={{ y: [0, 20, 0], x: [0, 10, 0] }} transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute top-10 left-1/3 w-40 h-40 bg-yellow-300 opacity-20 rounded-full blur-2xl z-0" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute bottom-10 right-1/4 w-32 h-32 bg-green-300 opacity-20 rounded-full blur-2xl z-0" animate={{ scale: [1, 0.95, 1] }} transition={{ duration: 9, repeat: Infinity, repeatType: "mirror" }} />
    </>
  );
}

function VerifyCodeInner() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const email = searchParams.get("email") || "";
  const codeType = searchParams.get("type") || "reset"; // 'reset' or 'login'

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    isVisible: boolean;
  }>({
    type: 'success',
    message: '',
    isVisible: false
  });

  useEffect(() => {
    if (!email) {
      setNotification({
        type: 'error',
        message: 'Email is required',
        isVisible: true
      });
      setTimeout(() => {
        if (codeType === 'reset') {
          router.push('/forgot-password');
        } else {
          router.push('/login');
        }
      }, 2000);
    }
  }, [email, codeType, router]);

  const handleCodeChange = (value: string, index: number) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '');
    if (digit.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = code.join('');
    if (codeString.length !== 6) {
      setNotification({
        type: 'error',
        message: 'Please enter the complete 6-digit code',
        isVisible: true
      });
      return;
    }

    setLoading(true);
    setNotification({ type: 'success', message: '', isVisible: false });

    try {
      if (codeType === 'login') {
        const data = await verifyLoginCode(email, codeString);
        localStorage.setItem("token", data.token);
        const uid = (data.userId || data.UserId) as string | undefined;
        const uname = (data.username || data.Username) as string | undefined;
        if (uid) localStorage.setItem("userId", uid);
        if (uname) localStorage.setItem("username", uname);
        
        setNotification({
          type: 'success',
          message: 'Sign in successful!',
          isVisible: true
        });
        
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        const data = await verifyResetCode(email, codeString);
        // Navigate to reset password screen with token
        router.push(`/reset-password?token=${data.token}`);
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Invalid or expired code',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  }, [code, email, codeType, router]);

  const handleResend = useCallback(async () => {
    setLoading(true);
    setNotification({ type: 'success', message: '', isVisible: false });

    try {
      if (codeType === 'login') {
        await resendLoginCode(email);
        setNotification({
          type: 'success',
          message: 'Code has been resent to your email',
          isVisible: true
        });
      } else {
        await forgotPassword(email);
        setNotification({
          type: 'success',
          message: 'Code has been resent to your email',
          isVisible: true
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to resend code',
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  }, [email, codeType]);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
      <AnimatedBlobs />
      <motion.div
        className="relative z-10 bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700 backdrop-blur-lg transition-colors duration-300"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center transition-colors duration-300">
          {codeType === 'login' ? 'Sign In Confirmation' : 'Verify Code'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-2 transition-colors duration-300">
          {codeType === 'login'
            ? 'Enter the 6-digit code sent to your email to complete sign in'
            : 'Enter the 6-digit code sent to your email'}
        </p>
        <p className="text-indigo-500 dark:text-purple-400 text-center mb-6 font-semibold transition-colors duration-300">
          {email}
        </p>
        
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-input-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-14 h-16 text-center text-2xl font-bold rounded-lg border-2 border-indigo-400 dark:border-purple-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-purple-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 transition-colors duration-300"
              />
            ))}
          </div>
          
          <button 
            type="submit" 
            className="mt-2 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 text-white font-semibold text-lg shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={loading || code.join('').length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-indigo-500 dark:text-purple-400 hover:underline text-sm transition-colors duration-300 disabled:opacity-50"
          >
            Didn't receive the code? Resend
          </button>
        </div>
        
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
          <Link href="/login" className="text-indigo-500 dark:text-purple-400 hover:underline font-medium transition-colors duration-300">
            Back to Login
          </Link>
        </div>
      </motion.div>
      
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <VerifyCodeInner />
    </Suspense>
  );
}

