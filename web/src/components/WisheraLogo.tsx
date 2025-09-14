"use client";
import { motion } from "framer-motion";
import { GiftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { GiftIcon as GiftIconSolid } from "@heroicons/react/24/solid";

interface WisheraLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export default function WisheraLogo({ 
  size = "md", 
  showText = true, 
  className = "" 
}: WisheraLogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl", 
    xl: "text-4xl"
  };

  const spacingClasses = {
    sm: "ml-2",
    md: "ml-3",
    lg: "ml-4",
    xl: "ml-5"
  };

  return (
    <motion.div 
      className={`flex items-center ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      {/* Logo Icon Container */}
      <div className="relative">
        {/* Background glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-sm opacity-30`} />
        
        {/* Main icon container with glassmorphism */}
        <div className={`
          relative ${sizeClasses[size]} 
          bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 
          rounded-xl 
          backdrop-blur-sm 
          border border-white/20 
          shadow-lg
          flex items-center justify-center
          overflow-hidden
        `}>
          {/* Animated sparkles background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          
          {/* Gift icon */}
          <GiftIconSolid 
            className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-9 w-9"} text-white drop-shadow-sm`}
          />
          
          {/* Floating sparkles */}
          <motion.div
            className="absolute top-1 right-1"
            animate={{
              rotate: [0, 360],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <SparklesIcon className={`${size === "sm" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-5 w-5"} text-yellow-300`} />
          </motion.div>
          
          <motion.div
            className="absolute bottom-1 left-1"
            animate={{
              rotate: [360, 0],
              scale: [1.2, 0.8, 1.2],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <SparklesIcon className={`${size === "sm" ? "h-1.5 w-1.5" : size === "md" ? "h-2 w-2" : size === "lg" ? "h-3 w-3" : "h-4 w-4"} text-pink-300`} />
          </motion.div>
        </div>
      </div>

      {/* Logo Text */}
      {showText && (
        <motion.span 
          className={`
            ${textSizeClasses[size]} 
            ${spacingClasses[size]}
            font-bold 
            bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
            bg-clip-text 
            text-transparent
            dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400
            drop-shadow-sm
          `}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Wishera
        </motion.span>
      )}
    </motion.div>
  );
}
