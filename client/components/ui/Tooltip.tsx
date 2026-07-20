'use client';

import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex group/tooltip">
      {children}
      <div
        className={cn(
          'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-150',
          positions[side]
        )}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
}
