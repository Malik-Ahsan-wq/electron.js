import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

export default function Button({ variant = 'primary', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
