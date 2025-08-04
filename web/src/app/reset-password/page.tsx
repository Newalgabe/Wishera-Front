"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "../api";
import Notification from "../../components/Notification";
import { useLanguage } from "../../contexts/LanguageContext";

function AnimatedBlobs() {
  return (
    <>
      <motion.div className="absolute -top-24 -left-24 w-96 h-96 bg-green-400 opacity-30 rounded-full blur-3xl z-0" animate={{ y: [0, 30, 0], x: [0, 20, 0] }} transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute top-40 -right-32 w-80 h-80 bg-blue-400 opacity-20 rounded-full blur-3xl z-0" animate={{ y: [0, -20, 0], x: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute bottom-0 left-1/2 w-72 h-72 bg-purple-400 opacity-20 rounded-full blur-3xl z-0" animate={{ y: [0, 20, 0], x: [0, 10, 0] }} transition={{ duration: 14, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute top-10 left-1/3 w-40 h-40 bg-yellow-300 opacity-20 rounded-full blur-2xl z-0" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, repeatType: "mirror" }} />
      <motion.div className="absolute bottom-10 right-1/4 w-32 h-32 bg-green-300 opacity-20 rounded-full blur-2xl z-0" animate={{ scale: [1, 0.95, 1] }} transition={{ duration: 9, repeat: Infinity, repeatType: "mirror" }} />
    </>
  );
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

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
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setIsValidToken(false);
      setNotification({
        type: 'error',
        message: t('resetPassword.invalidTokenMessage'),
        isVisible: true
      });
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, t]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setNotification({
        type: 'error',
        message: t('resetPassword.passwordMismatchMessage'),
        isVisible: true
      });
      return;
    }

    if (newPassword.length < 6) {
      setNotification({
        type: 'error',
        message: t('resetPassword.passwordLengthMessage'),
        isVisible: true
      });
      return;
    }

    setLoading(true);
    setNotification({ type: 'success', message: '', isVisible: false });
    
    try {
      await resetPassword(token, newPassword);
      setNotification({
        type: 'success',
        message: t('resetPassword.passwordResetSuccessMessage'),
        isVisible: true
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || t('resetPassword.errorMessage'),
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  }, [token, newPassword, confirmPassword, router, t]);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
        <AnimatedBlobs />
        <motion.div
          className="relative z-10 bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700 backdrop-blur-lg transition-colors duration-300"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center transition-colors duration-300">{t('resetPassword.invalidLinkTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6 transition-colors duration-300">{t('resetPassword.invalidLinkDescription')}</p>
          <div className="text-center">
            <Link href="/forgot-password" className="text-indigo-500 dark:text-purple-400 hover:underline font-medium transition-colors duration-300">
              {t('resetPassword.requestNewLink')}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
      <AnimatedBlobs />
      <motion.div
        className="relative z-10 bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700 backdrop-blur-lg transition-colors duration-300"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center transition-colors duration-300">{t('resetPassword.title')}</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 transition-colors duration-300">{t('resetPassword.subtitle')}</p>
        
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input 
            type="password" 
            placeholder={t('resetPassword.newPasswordPlaceholder')}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-emerald-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="new-password" 
            required 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder={t('resetPassword.confirmNewPasswordPlaceholder')}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 dark:focus:ring-emerald-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="new-password" 
            required 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            className="mt-2 py-3 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 dark:from-emerald-500 dark:to-green-500 text-white font-semibold text-lg shadow-md hover:scale-105 transition-transform" 
            disabled={loading}
          >
            {loading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
          {t('resetPassword.rememberPassword')}{' '}
          <Link href="/login" className="text-green-500 dark:text-emerald-400 hover:underline font-medium transition-colors duration-300">{t('resetPassword.backToLogin')}</Link>
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