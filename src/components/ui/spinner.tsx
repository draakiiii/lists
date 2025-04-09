'use client';

import { cn } from "@/lib/utils";
import { LuLoader } from "react-icons/lu";

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <LuLoader className={cn("animate-spin text-indigo-600 dark:text-indigo-400", sizeClasses[size], className)} />
  );
}

export function LoadingOverlay({ text = '' }: { text?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center">
        <div className="absolute -inset-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 blur-sm"></div>
        <Spinner size="xl" className="relative z-10" />
      </div>
      {text && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 animate-pulse">{text}</p>
      )}
    </div>
  );
} 