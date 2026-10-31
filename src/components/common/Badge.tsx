import React from 'react';
import { cn } from '../../utils/formatters';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'danger' | 'warning' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'sm',
  children,
  ...props
}) => {
  const variants = {
    brand: 'bg-brand-500/15 text-brand-400 border border-brand-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    neutral: 'bg-surface-800 text-surface-300 border border-surface-700/60',
  };

  const sizes = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded-full',
    md: 'text-xs font-semibold px-2.5 py-1 rounded-full',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 shrink-0', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
