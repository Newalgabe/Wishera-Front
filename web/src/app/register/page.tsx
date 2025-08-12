"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { register } from "../api";
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

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification({ type: 'success', message: '', isVisible: false });
    
    try {
      const data = await register(username, email, password);
      localStorage.setItem("token", data.token);
      if (data.userId) localStorage.setItem("userId", data.userId);
      if (data.username) localStorage.setItem("username", data.username);
      setNotification({
        type: 'success',
        message: t('auth.registerSuccess'),
        isVisible: true
      });
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || t('auth.registerFailed'),
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  }, [username, email, password, router]);

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white dark:from-gray-900 dark:to-gray-800 relative overflow-hidden transition-colors duration-300">
      <AnimatedBlobs />
      <motion.div
        className="relative z-10 bg-white/80 dark:bg-gray-800/80 shadow-xl rounded-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700 backdrop-blur-lg transition-colors duration-300"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center transition-colors duration-300">{t('auth.registerTitle')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Name" 
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-orange-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="name" 
            required 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
          <input 
            type="email" 
            placeholder={t('auth.email')}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-orange-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder={t('auth.password')}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-orange-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="new-password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            className="mt-2 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-400 dark:from-orange-500 dark:to-red-500 text-white font-semibold text-lg shadow-md hover:scale-105 transition-transform" 
            disabled={loading}
          >
            {loading ? t('auth.signingUp') : t('navigation.signup')}
          </button>
        </form>
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-yellow-500 dark:text-orange-400 hover:underline font-medium transition-colors duration-300">{t('navigation.login')}</Link>
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