import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  maxHeight?: string;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  className,
  contentClassName,
  maxHeight = '50vh',
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('rounded-md border', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 p-2 text-left font-medium bg-muted/50 dark:bg-muted/30 hover:bg-muted/70 transition-colors rounded-t-md"
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        {title}
      </button>
      {open && (
        <div
          className={cn('overflow-auto border-t', contentClassName)}
          style={{ maxHeight }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
