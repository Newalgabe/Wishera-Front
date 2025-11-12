"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
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

  // Load saved username and email from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("registerUsername");
    const savedEmail = localStorage.getItem("registerEmail");
    
    if (savedUsername) setUsername(savedUsername);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username) {
      localStorage.setItem("registerUsername", username);
    }
  }, [username]);

  // Save email to localStorage whenever it changes
  useEffect(() => {
    if (email) {
      localStorage.setItem("registerEmail", email);
    }
  }, [email]);

  // Validate password security
  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      errors.push("Password must contain at least one special character");
    }
    
    return errors;
  };

  // Validate password on change
  useEffect(() => {
    if (password) {
      setPasswordErrors(validatePassword(password));
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setNotification({
        type: 'error',
        message: 'Passwords do not match',
        isVisible: true
      });
      return;
    }
    
    // Validate password security
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setNotification({
        type: 'error',
        message: errors[0],
        isVisible: true
      });
      return;
    }
    
    setLoading(true);
    setNotification({ type: 'success', message: '', isVisible: false });
    
    try {
      const data = await register(username, email, password);
      
      // Clear the saved registration form data after successful registration
      localStorage.removeItem("registerUsername");
      localStorage.removeItem("registerEmail");
      
      setNotification({
        type: 'success',
        message: 'Registration successful! Please check your email for the verification code.',
        isVisible: true
      });
      
      // Redirect to verify code page after showing success message
      setTimeout(() => {
        router.push(`/verify-code?email=${encodeURIComponent(email)}&type=verify`);
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.message || err.message || t('auth.registerFailed');
      setNotification({
        type: 'error',
        message: errorMessage,
        isVisible: true
      });
    } finally {
      setLoading(false);
    }
  }, [username, email, password, confirmPassword, router, t]);

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
            placeholder={t('auth.name')}
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
          <div>
            <input 
              type="password" 
              placeholder={t('auth.password')}
              className={`w-full px-4 py-3 rounded-lg border ${passwordErrors.length > 0 && password ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-orange-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300`}
              autoComplete="new-password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            {password && passwordErrors.length > 0 && (
              <div className="mt-2 space-y-1">
                {passwordErrors.map((error, index) => (
                  <p key={index} className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                    <span className="text-red-500">✕</span> {error}
                  </p>
                ))}
              </div>
            )}
            {password && passwordErrors.length === 0 && (
              <p className="mt-2 text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
                <span className="text-green-500">✓</span> Strong password
              </p>
            )}
          </div>
          <input 
            type="password" 
            placeholder={t('auth.confirmPassword')}
            className={`px-4 py-3 rounded-lg border ${confirmPassword && password !== confirmPassword ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-orange-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300`}
            autoComplete="new-password" 
            required 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500 dark:text-red-400 -mt-2">
              Passwords do not match
            </p>
          )}
          {confirmPassword && password === confirmPassword && password && (
            <p className="text-xs text-green-500 dark:text-green-400 -mt-2">
              Passwords match
            </p>
          )}
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