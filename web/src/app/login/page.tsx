"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { login, resendVerificationEmail, AUTH_API_URL } from "../api";
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

export default function LoginPage() {
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
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      const uid = (data.userId || data.UserId) as string | undefined;
      const uname = (data.username || data.Username) as string | undefined;
      if (uid) localStorage.setItem("userId", uid);
      if (uname) localStorage.setItem("username", uname);
      setNotification({
        type: 'success',
        message: t('auth.loginSuccess'),
        isVisible: true
      });
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('auth.loginFailed');
      
      // Check if the error is about email verification
      if (errorMessage.toLowerCase().includes('verify your email') || 
          errorMessage.toLowerCase().includes('email address before logging in')) {
        try {
          // Automatically resend verification email
          await resendVerificationEmail(email);
          setNotification({
            type: 'success',
            message: `Email verification required. A confirmation link has been sent to ${email}. Please check your inbox and spam folder.`,
            isVisible: true
          });
        } catch (resendErr: any) {
          // If resend fails, just show the original error
          setNotification({
            type: 'error',
            message: errorMessage,
            isVisible: true
          });
        }
      } else {
        setNotification({
          type: 'error',
          message: errorMessage,
          isVisible: true
        });
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, router, t]);

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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center transition-colors duration-300">{t('auth.loginTitle')}</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder={t('auth.email')}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-purple-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder={t('auth.password')}
            className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-purple-400 bg-white/90 dark:bg-gray-700/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300" 
            autoComplete="current-password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          <button 
            type="submit" 
            className="mt-2 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 text-white font-semibold text-lg shadow-md hover:scale-105 transition-transform" 
            disabled={loading}
          >
            {loading ? t('auth.loggingIn') : t('navigation.login')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-indigo-500 dark:text-purple-400 hover:underline text-sm transition-colors duration-300">
            {t('auth.forgotPassword')}
          </Link>
        </div>
        
        <div className="mt-6">
          <a
            href={(() => {
              // Use AUTH_API_URL which ensures /api is included
              // The correct endpoint is: /api/externalauth/login/Google (lowercase)
              const authUrl = AUTH_API_URL().trim().replace(/\/+$/, '');
              
              // Get the frontend URL for the redirect URI
              // The backend will redirect here after OAuth completes
              const frontendUrl = typeof window !== 'undefined' 
                ? `${window.location.protocol}//${window.location.host}`
                : 'https://wishera.vercel.app'; // Fallback for SSR
              
              const redirectUri = `${frontendUrl}/oauth-complete`;
              
              // Correct Google OAuth endpoint (lowercase externalauth)
              // Note: The redirect_uri should be configured in the backend
              // If the backend supports passing it as a parameter, uncomment the next line:
              // const googleOAuthUrl = `${authUrl}/externalauth/login/Google?redirectUri=${encodeURIComponent(redirectUri)}`;
              
              // Otherwise, the backend should be configured with the redirect URI in Google Cloud Console
              const googleOAuthUrl = `${authUrl}/externalauth/login/Google`;
              
              console.log('🔍 Google OAuth URL:', googleOAuthUrl);
              console.log('🔍 Expected redirect URI:', redirectUri);
              console.log('⚠️  If you get redirect_uri_mismatch error, the backend needs to be configured with this redirect URI in Google Cloud Console');
              
              return googleOAuthUrl;
            })()}
            className="flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"
              alt="Google logo"
              className="h-5 w-5"
            />
            Continue with Google
          </a>
        </div>


        <div className="mt-6 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
          {t('auth.dontHaveAccount')}{' '}
          <Link href="/register" className="text-indigo-500 dark:text-purple-400 hover:underline font-medium transition-colors duration-300">{t('navigation.signup')}</Link>
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