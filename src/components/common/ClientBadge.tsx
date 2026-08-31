import React from 'react';
import { UserCheck } from 'lucide-react';

interface ClientBadgeProps {
  tier?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'subtle' | 'gold' | 'glass';
  className?: string;
  showIcon?: boolean;
}

export const ClientBadge: React.FC<ClientBadgeProps> = ({
  tier = 'Client',
  size = 'md',
  variant = 'gold',
  className = '',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5 font-bold',
    lg: 'text-xs px-3 py-1.5 gap-2 font-black',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const variantClasses = {
    gold: 'bg-amber-50 text-amber-900 border border-amber-300/70 shadow-2xs',
    solid: 'bg-slate-900 text-white shadow-xs',
    subtle: 'bg-slate-100 text-slate-800 border border-slate-200/70',
    glass: 'bg-white/80 backdrop-blur-md text-slate-800 border border-slate-200/80 shadow-2xs',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider transition-all select-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {showIcon && (
        <UserCheck className={`${iconSizes[size]} text-amber-700 shrink-0`} />
      )}
      <span>Client</span>
    </span>
  );
};

