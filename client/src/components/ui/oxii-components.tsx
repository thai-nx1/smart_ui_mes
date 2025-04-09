import React from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input, InputProps } from '@/components/ui/input';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Oxii Search Bar Component inspired by Material Design
export interface OxiiSearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  value?: string;
  rounded?: 'full' | 'md' | 'lg';
  variant?: 'primary' | 'ghost' | 'outlined';
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const OxiiSearchBar = React.forwardRef<HTMLInputElement, OxiiSearchBarProps>(
  ({ className, onSearch, onClear, placeholder = 'Search', value, rounded = 'full', variant = 'outlined', leadingIcon, trailingIcon, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(value || '');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      props.onChange?.(e);
    };
    
    const handleClear = () => {
      setInputValue('');
      onClear?.();
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(inputValue);
      }
      props.onKeyDown?.(e);
    };
    
    // Determine classes based on variant and rounded props
    const variantClasses = {
      primary: 'bg-primary/10 border-primary/20 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary shadow-sm',
      ghost: 'bg-background hover:bg-muted/50 focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/40',
      outlined: 'bg-background border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40'
    };
    
    const roundedClasses = {
      full: 'rounded-full',
      md: 'rounded-md',
      lg: 'rounded-lg'
    };
    
    return (
      <div className={cn(
        'flex items-center w-full px-3 h-10 border transition-all duration-200',
        variantClasses[variant],
        roundedClasses[rounded],
        className
      )}>
        {leadingIcon && (
          <div className="mr-2 text-muted-foreground">
            {leadingIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none border-none focus:ring-0 placeholder:text-muted-foreground/70 text-sm py-2"
          {...props}
        />
        
        {inputValue && (
          <button 
            type="button" 
            onClick={handleClear}
            className="ml-1 text-muted-foreground hover:text-foreground focus:outline-none"
          >
            {trailingIcon || (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }
);

OxiiSearchBar.displayName = 'OxiiSearchBar';

// Oxii FAB (Floating Action Button) - various sizes
export interface OxiiFabProps extends Omit<ButtonProps, 'size'> {
  fabSize?: 'small' | 'default' | 'large';
  extended?: boolean;
  icon: React.ReactNode;
  label?: string;
}

export function OxiiFab({ className, fabSize = 'default', extended, icon, label, ...props }: OxiiFabProps) {
  const sizeClasses = {
    small: extended ? 'h-10 px-4' : 'h-10 w-10',
    default: extended ? 'h-14 px-6' : 'h-14 w-14',
    large: extended ? 'h-16 px-6' : 'h-16 w-16'
  };
  
  const iconSizes = {
    small: 'h-5 w-5',
    default: 'h-6 w-6',
    large: 'h-7 w-7'
  };
  
  return (
    <Button
      className={cn(
        'rounded-full shadow-lg text-primary-foreground',
        'fixed bottom-6 right-6 z-50',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:scale-105',
        sizeClasses[fabSize],
        className
      )}
      {...props}
    >
      <span className={cn(iconSizes[fabSize], extended && 'mr-2')}>
        {icon}
      </span>
      {extended && label && <span>{label}</span>}
    </Button>
  );
}

// Oxii Badge - Styled like Material Design badges
export function OxiiBadge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <Badge
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' && 'bg-primary/15 text-primary hover:bg-primary/20',
        variant === 'secondary' && 'bg-secondary/15 text-secondary hover:bg-secondary/20',
        variant === 'outline' && 'bg-transparent border-primary/30 text-primary',
        className
      )}
      variant={variant}
      {...props}
    />
  );
}

// Oxii Card - Material Design inspired card matching Figma design
export interface OxiiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  hover?: boolean;
}

export function OxiiCard({ className, children, variant = 'elevated', hover = false, ...props }: OxiiCardProps) {
  const variantClasses = {
    elevated: 'bg-card shadow-md border-transparent elevation-1',
    filled: 'bg-secondary/10 border-transparent',
    outlined: 'bg-transparent border border-border'
  };
  
  return (
    <Card
      className={cn(
        'rounded-lg transition-all duration-300 overflow-hidden',
        variantClasses[variant],
        hover && 'hover:shadow-lg hover:-translate-y-1 hover:elevation-3',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

// Re-export with Oxii naming for consistency
export const OxiiCardHeader = CardHeader;
export const OxiiCardTitle = CardTitle;
export const OxiiCardDescription = CardDescription;
export const OxiiCardContent = CardContent;
export const OxiiCardFooter = CardFooter;

// Oxii Dialog - Material Design inspired dialog
export function OxiiDialog({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      {children}
    </Dialog>
  );
}

export const OxiiDialogTrigger = DialogTrigger;

export function OxiiDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        'rounded-xl border-none p-0 shadow-2xl max-w-md',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-200',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-200',
        className
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function OxiiDialogHeader({ className, ...props }: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        'p-6 pb-4 border-b',
        className
      )}
      {...props}
    />
  );
}

export const OxiiDialogTitle = DialogTitle;
export const OxiiDialogDescription = DialogDescription;

export function OxiiDialogFooter({ className, ...props }: React.ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn(
        'flex justify-end gap-2 p-6 pt-4 border-t',
        className
      )}
      {...props}
    />
  );
}

// Oxii Button - Material Design inspired button variants matching Figma design
export function OxiiButton({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        'font-medium transition-all duration-200 relative overflow-hidden',
        'active:translate-y-0.5 active:shadow-inner',
        // Enhanced hover and focus effects
        variant === 'default' && 'hover:shadow-md hover:bg-primary/95 focus:ring-2 focus:ring-primary/20',
        variant === 'outline' && 'border-primary/30 text-primary hover:bg-primary/5 focus:ring-2 focus:ring-primary/20',
        variant === 'ghost' && 'hover:bg-muted/80 focus:ring-2 focus:ring-muted/50',
        variant === 'secondary' && 'hover:shadow-sm hover:bg-secondary/95 focus:ring-2 focus:ring-secondary/20',
        variant === 'destructive' && 'hover:shadow-md hover:bg-destructive/95 focus:ring-2 focus:ring-destructive/20',
        // Sizing based on Figma design
        size === 'default' && 'rounded-md',
        size === 'sm' && 'rounded-md text-xs',
        size === 'lg' && 'rounded-md text-base',
        size === 'icon' && 'rounded-md',
        'oxii-ripple',
        className
      )}
      variant={variant}
      size={size}
      {...props}
    />
  );
}

// Oxii Input - Material Design inspired input
export function OxiiInput({ className, ...props }: InputProps) {
  return (
    <Input
      className={cn(
        'rounded-md border-input bg-background px-4 py-2',
        'focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary',
        'transition-all duration-200',
        'placeholder:text-muted-foreground/70',
        className
      )}
      {...props}
    />
  );
}

// Oxii Tabs - Material Design inspired tabs
export interface OxiiTabsProps extends React.ComponentProps<typeof Tabs> {
  variant?: 'default' | 'pills' | 'underlined';
}

export function OxiiTabs({ className, variant = 'default', ...props }: OxiiTabsProps) {
  return (
    <Tabs
      className={cn(
        'w-full',
        className
      )}
      {...props}
    />
  );
}

export function OxiiTabsList({ className, ...props }: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn(
        'flex w-full bg-transparent p-0 mb-2',
        className
      )}
      {...props}
    />
  );
}

export function OxiiTabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        'flex-1 py-2 text-sm transition-all data-[state=active]:border-primary',
        'data-[state=active]:bg-background data-[state=active]:shadow-none',
        'data-[state=active]:text-primary data-[state=active]:font-medium',
        'border-b-2 border-transparent rounded-none',
        'hover:bg-muted/30',
        className
      )}
      {...props}
    />
  );
}

export function OxiiTabsContent({ className, ...props }: React.ComponentProps<typeof TabsContent>) {
  return (
    <TabsContent
      className={cn(
        'mt-2 ring-0 outline-none focus:ring-0 focus:outline-none',
        className
      )}
      {...props}
    />
  );
}

// Styled Chip component (similar to filter chip in Material Design) matching Figma design
export interface OxiiChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

export function OxiiChip({
  className,
  label,
  selected = false,
  onSelect,
  onRemove,
  icon,
  variant = 'default',
  size = 'md',
  ...props
}: OxiiChipProps) {
  const sizeClasses = {
    sm: 'text-xs h-7 px-2',
    md: 'text-sm h-8 px-3',
    lg: 'text-base h-10 px-4'
  };
  
  const variantClasses = {
    default: selected
      ? 'bg-primary/15 text-primary border-primary/30 shadow-sm'
      : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60 hover:shadow-sm',
    outlined: selected
      ? 'bg-transparent text-primary border-primary shadow-sm' 
      : 'bg-transparent text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/60',
    filled: selected
      ? 'bg-primary text-primary-foreground border-transparent shadow elevation-1' 
      : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80 hover:shadow-sm'
  };
  
  return (
    <div
      className={cn(
        'inline-flex items-center border rounded-full cursor-pointer select-none',
        'transition-all duration-200 font-medium overflow-hidden',
        'active:scale-95',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      onClick={onSelect}
      {...props}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          className={cn(
            'ml-1 rounded-full p-0.5 focus:outline-none',
            'hover:bg-background/20 transition-colors',
            'active:bg-background/40',
            selected ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
}