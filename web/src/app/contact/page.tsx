"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../contexts/LanguageContext";

function AnimatedBackground() {
  return (
    <>
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400 opacity-20 rounded-full blur-3xl z-0"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: "mirror" }}
      />
      <motion.div
        className="absolute top-40 -right-32 w-80 h-80 bg-pink-400 opacity-15 rounded-full blur-3xl z-0"
        animate={{ y: [0, -20, 0], x: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "mirror" }}
      />
    </>
  );
}

function ContactForm() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create mailto link for email functionality
      const mailtoLink = `mailto:hello@wishlistapp.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="backdrop-blur-lg bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl p-8 transition-colors duration-300"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8 }}
    >
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors duration-300">{t('contact.sendMessage')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
            {t('contact.form.name')}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
            placeholder={t('contact.form.namePlaceholder')}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
            {t('contact.form.email')}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
            placeholder={t('contact.form.emailPlaceholder')}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
          {t('contact.form.subject')}
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        >
          <option value="">{t('contact.form.subjectPlaceholder')}</option>
          <option value="general">{t('contact.form.subjects.general')}</option>
          <option value="support">{t('contact.form.subjects.support')}</option>
          <option value="feature">{t('contact.form.subjects.feature')}</option>
          <option value="bug">{t('contact.form.subjects.bug')}</option>
          <option value="partnership">{t('contact.form.subjects.partnership')}</option>
        </select>
      </div>
      
      <div className="mb-6">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">
          {t('contact.form.message')}
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-purple-400 focus:border-transparent transition-colors resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
          placeholder={t('contact.form.messagePlaceholder')}
        />
      </div>
      
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PaperAirplaneIcon className="w-5 h-5" />
        {isSubmitting ? t('contact.form.sending') : t('contact.form.sendButton')}
      </motion.button>
      
      {submitStatus === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-xl text-green-800 dark:text-green-200 text-sm transition-colors duration-300"
        >
          {t('contact.form.successMessage')}
        </motion.div>
      )}
      
      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl text-red-800 dark:text-red-200 text-sm transition-colors duration-300"
        >
          {t('contact.form.errorMessage')}
        </motion.div>
      )}
    </motion.form>
  );
}

function ContactInfo() {
  const { t } = useLanguage();
  const contactMethods = [
    {
      icon: EnvelopeIcon,
      titleKey: "contact.methods.email.title",
      valueKey: "contact.methods.email.value",
      descriptionKey: "contact.methods.email.description"
    },
    {
      icon: ChatBubbleLeftRightIcon,
      titleKey: "contact.methods.chat.title",
      valueKey: "contact.methods.chat.value",
      descriptionKey: "contact.methods.chat.description"
    },
    {
      icon: MapPinIcon,
      titleKey: "contact.methods.office.title",
      valueKey: "contact.methods.office.value",
      descriptionKey: "contact.methods.office.description"
    }
  ];

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 transition-colors duration-300">{t('contact.getInTouch')}</h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
          {t('contact.getInTouchDescription')}
        </p>
      </div>
      
      <div className="space-y-4">
        {contactMethods.map((method, idx) => {
          const Icon = method.icon;
          return (
            <motion.div
              key={method.titleKey}
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/40 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 transition-colors duration-300"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 dark:from-purple-500 dark:to-indigo-500 flex items-center justify-center shadow-lg">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 transition-colors duration-300">{t(method.titleKey)}</h4>
                <p className="text-indigo-600 dark:text-purple-400 font-medium mb-1 transition-colors duration-300">{t(method.valueKey)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{t(method.descriptionKey)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border border-indigo-100 dark:border-gray-600 transition-colors duration-300">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-300">{t('contact.needHelp.title')}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 transition-colors duration-300">
          {t('contact.needHelp.description')}
        </p>
        <Link
          href="/about"
          className="inline-flex items-center gap-2 text-indigo-600 dark:text-purple-400 font-medium hover:text-indigo-700 dark:hover:text-purple-300 transition-colors"
        >
          {t('contact.needHelp.viewFaq')}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}

export default function Contact() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-8 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 overflow-hidden transition-colors duration-300">
        <AnimatedBackground />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 transition-colors duration-300">
              {t('contact.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed transition-colors duration-300">
              {t('contact.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <ContactInfo />
            <ContactForm />
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
} 