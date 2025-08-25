import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'avatar' | 'button' | 'input' | 'list';
  lines?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  lines = 3, 
  className = '' 
}) => {
  const baseClasses = 'loading-skeleton rounded-xl';
  
  const variants = {
    card: 'w-full h-48 p-6',
    text: 'h-4 w-full',
    avatar: 'w-12 h-12 rounded-full',
    button: 'h-10 w-24 rounded-xl',
    input: 'h-12 w-full rounded-2xl',
    list: 'h-16 w-full rounded-2xl'
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  if (type === 'text') {
    return (
      <motion.div 
        className={`space-y-3 ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variants.text}`}
            variants={itemVariants}
            style={{
              width: index === lines - 1 ? '60%' : '100%'
            }}
          />
        ))}
      </motion.div>
    );
  }

  if (type === 'list') {
    return (
      <motion.div 
        className={`space-y-4 ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variants.list} flex items-center gap-4 p-4`}
            variants={itemVariants}
          >
            <div className={`${baseClasses} w-12 h-12 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-3/4`} />
              <div className={`${baseClasses} h-3 w-1/2`} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variants[type]} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
};

export default LoadingSkeleton;

