import { cn } from '@/lib/utils';

const sizeClasses = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1',
  large: 'col-span-2 row-span-2',
  wide: 'col-span-3 row-span-1',
  tall: 'col-span-1 row-span-2',
};

export default function WidgetPanel({ title, size = 'medium', children, className, accentColor = 'blue' }) {
  const accent = {
    blue: 'border-t-neon-blue/60',
    green: 'border-t-neon-green/60',
    amber: 'border-t-neon-amber/60',
    red: 'border-t-neon-red/60',
    purple: 'border-t-neon-purple/60',
  };

  return (
    <div className={cn(
      'panel flex flex-col overflow-hidden',
      'border-t-2',
      accent[accentColor] || accent.blue,
      sizeClasses[size],
      className
    )}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</span>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${
              accentColor === 'green' ? 'bg-neon-green' :
              accentColor === 'amber' ? 'bg-neon-amber' :
              accentColor === 'red' ? 'bg-neon-red' : 'bg-neon-blue'
            } animate-pulse`} />
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden p-4">
        {children}
      </div>
    </div>
  );
}