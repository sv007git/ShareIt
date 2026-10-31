import React from 'react';
import { cn } from '../../utils/formatters';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-surface-300 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-surface-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-surface-900 border border-surface-700/80 rounded-xl px-4 py-2.5 text-sm text-surface-100 placeholder-surface-500 transition-colors duration-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-accent-rose focus:border-accent-rose focus:ring-accent-rose',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-surface-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-accent-rose">{error}</p>}
        {helperText && !error && <p className="text-xs text-surface-400">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
