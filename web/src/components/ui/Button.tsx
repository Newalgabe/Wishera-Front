import React from 'react';
import { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 dark:from-purple-500 dark:via-indigo-500 dark:to-purple-600 text-white shadow-lg hover:shadow-xl focus:ring-indigo-500 dark:focus:ring-purple-500 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:via-indigo-600 dark:hover:to-purple-700',
    secondary: 'bg-gradient-to-r from-gray-100 via-gray-50 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg focus:ring-gray-500 border border-gray-200 dark:border-gray-600 hover:from-gray-200 hover:via-gray-100 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:via-gray-500 dark:hover:to-gray-600',
    danger: 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600 dark:from-pink-500 dark:via-red-500 dark:to-pink-600 text-white shadow-lg hover:shadow-xl focus:ring-red-500 dark:focus:ring-pink-500 hover:from-red-600 hover:via-pink-600 hover:to-red-700 dark:hover:from-pink-600 dark:hover:via-red-600 dark:hover:to-pink-700',
    success: 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 dark:from-emerald-500 dark:via-green-500 dark:to-emerald-600 text-white shadow-lg hover:shadow-xl focus:ring-green-500 dark:focus:ring-emerald-500 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 dark:hover:from-emerald-600 dark:hover:via-green-600 dark:hover:to-emerald-700',
    warning: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 dark:from-orange-500 dark:via-yellow-500 dark:to-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-yellow-500 dark:focus:ring-orange-500 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-700 dark:hover:from-orange-600 dark:hover:via-yellow-600 dark:hover:to-orange-700',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 border border-transparent hover:border-gray-200 dark:hover:border-gray-700',
    outline: 'bg-transparent text-indigo-600 dark:text-purple-400 border-2 border-indigo-600 dark:border-purple-400 hover:bg-indigo-50 dark:hover:bg-purple-900/20 focus:ring-indigo-500 dark:focus:ring-purple-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm font-medium',
    md: 'px-4 py-2.5 text-sm font-semibold',
    lg: 'px-6 py-3 text-base font-semibold',
    xl: 'px-8 py-4 text-lg font-bold'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

