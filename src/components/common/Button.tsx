import React from 'react';
import { cn } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'surface';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 focus:ring-brand-500 border border-transparent',
      secondary: 'bg-surface-800 hover:bg-surface-700 text-surface-100 border border-surface-700 focus:ring-brand-500',
      danger: 'bg-accent-rose hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 focus:ring-rose-500 border border-transparent',
      ghost: 'bg-transparent hover:bg-surface-800/60 text-surface-200 hover:text-white focus:ring-surface-700',
      outline: 'bg-transparent border border-surface-700 hover:border-brand-500 text-surface-200 hover:text-white focus:ring-brand-500',
      surface: 'bg-surface-900/80 hover:bg-surface-800 text-surface-200 hover:text-white border border-surface-800 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
      md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
      lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5',
      icon: 'p-2.5 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
