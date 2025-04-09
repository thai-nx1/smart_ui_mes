/**
 * Common UI Components
 * File này chứa các thành phần UI dùng chung trong toàn bộ ứng dụng
 */
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import { Label } from "./label";
import { Calendar } from 'lucide-react';
import { useTranslation } from "react-i18next";

// Định nghĩa variants cho AppButton
const appButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium font-['Roboto'] tracking-wide ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-gray-400 bg-background hover:bg-primary/5 hover:text-primary hover:border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-blue-500 text-white hover:bg-blue-500/90 shadow-sm",
        success: "bg-green-600 text-white hover:bg-green-600/90 shadow-sm",
        warning: "bg-orange-400 text-white hover:bg-orange-400/90 shadow-sm",
        danger: "bg-red-500 text-white hover:bg-red-500/90 shadow-sm",
        text: "bg-transparent text-primary hover:bg-primary/5 p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 rounded-md px-4",
        lg: "h-11 rounded-md px-6",
        xl: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10 p-2",
        "icon-sm": "h-8 w-8 p-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// AppButton - Button component với style định nghĩa dựa trên thiết kế mới
export interface AppButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof appButtonVariants> {
  asChild?: boolean;
}

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <Button
        className={cn(appButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
AppButton.displayName = "AppButton";

// Định nghĩa variants cho AppCard
const appCardVariants = cva(
  "rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-border",
        primary: "border-primary",
        error: "border-red-500",
        success: "border-green-600",
        warning: "border-orange-400",
        elevated: "border-transparent shadow-md",
        outlined: "border-gray-200 shadow-none",
      },
      size: {
        default: "p-0",
        sm: "p-0 text-sm",
        lg: "p-0 text-base",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// AppCard - Card component với style theo thiết kế mới
export interface AppCardProps
  extends VariantProps<typeof appCardVariants> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
  ({ className, variant, size, title, description, footer, headerAction, children, ...props }, ref) => {
    return (
      <Card 
        className={cn(appCardVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {(title || description || headerAction) && (
          <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
            <div>
              {title && <CardTitle className="text-base font-medium">{title}</CardTitle>}
              {description && <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </CardHeader>
        )}
        <CardContent className="px-4 py-3">{children}</CardContent>
        {footer && <CardFooter className="px-4 py-3 border-t">{footer}</CardFooter>}
      </Card>
    );
  }
);
AppCard.displayName = "AppCard";

// CustomBadge - Badge với style theo thiết kế mới
interface CustomBadgeProps {
  variant?: "default" | "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "outline";
  status?: boolean; // Có hay không có một status indicator (dot)
  className?: string;
  children?: React.ReactNode;
}

const AppBadge = ({ className, variant = "default", status, children }: CustomBadgeProps) => {
  let badgeClassName = "";
  
  switch(variant) {
    case "primary":
      badgeClassName = "bg-blue-500/10 text-blue-500 border-blue-500/30";
      break;
    case "secondary":
      badgeClassName = "bg-gray-300/10 text-gray-700 border-gray-300/30";
      break;
    case "success":
      badgeClassName = "bg-green-600/10 text-green-600 border-green-600/30";
      break;
    case "danger":
      badgeClassName = "bg-red-500/10 text-red-500 border-red-500/30";
      break;
    case "warning":
      badgeClassName = "bg-orange-400/10 text-orange-400 border-orange-400/30";
      break;
    case "info":
      badgeClassName = "bg-blue-400/10 text-blue-400 border-blue-400/30";
      break;
    case "outline":
      badgeClassName = "bg-transparent border border-gray-400 text-gray-700";
      break;
    default:
      badgeClassName = "bg-primary/10 text-primary border-primary/30";
      break;
  }
  
  return (
    <Badge 
      className={cn("px-3 py-1.5 border text-xs font-medium rounded-full", badgeClassName, 
        status && "flex items-center gap-1", className)}
    >
      {status && <span className="size-2 rounded-full bg-current" />}
      {children}
    </Badge>
  );
};
AppBadge.displayName = "AppBadge";

// AppInput - Input component với style theo thiết kế mới
export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  required?: boolean;
}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  ({ className, label, error, icon, iconPosition = "left", required, ...props }, ref) => {
    const { t } = useTranslation();
    const id = props.id || `input-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1 mb-1.5">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <Input
            id={id}
            className={cn(
              "h-10 border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/30 focus:ring-2",
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
              className
            )}
            ref={ref}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
AppInput.displayName = "AppInput";

// AppDateInput - DateInput component với style theo thiết kế mới
export interface AppDateInputProps extends AppInputProps {}

export const AppDateInput = React.forwardRef<HTMLInputElement, AppDateInputProps>(
  (props, ref) => {
    return (
      <AppInput
        type="date"
        icon={<Calendar className="h-4 w-4" />}
        {...props}
        ref={ref}
      />
    );
  }
);
AppDateInput.displayName = "AppDateInput";

// AppTextarea - Textarea component với style theo thiết kế mới
export interface AppTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const AppTextarea = React.forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ className, label, error, required, ...props }, ref) => {
    const id = props.id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1 mb-1.5">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Textarea
          id={id}
          className={cn(
            "min-h-[100px] border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/30 focus:ring-2 resize-none",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
AppTextarea.displayName = "AppTextarea";

// AppCheckbox - Checkbox component với style theo thiết kế mới
export interface AppCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const AppCheckbox = React.forwardRef<HTMLInputElement, AppCheckboxProps>(
  ({ className, label, error, ...props }, ref) => {
    const id = props.id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id={id}
            type="checkbox"
            className={cn(
              "h-5 w-5 rounded text-blue-500 border-gray-300 shadow-sm focus:ring-blue-500/30 focus:ring-2",
              error && "border-red-500 focus:ring-red-500/30",
              className
            )}
            ref={ref}
            {...props}
          />
          {label && (
            <Label htmlFor={id} className="text-sm font-medium cursor-pointer text-gray-700">
              {label}
            </Label>
          )}
        </div>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
AppCheckbox.displayName = "AppCheckbox";

// AppSelect - Select component với style theo thiết kế mới
export interface AppSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}

export const AppSelect = React.forwardRef<HTMLSelectElement, AppSelectProps>(
  ({ className, label, error, options, required, ...props }, ref) => {
    const id = props.id || `select-${Math.random().toString(36).substring(2, 9)}`;
    
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1 mb-1.5">
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <Select defaultValue={props.defaultValue?.toString()}>
          <SelectTrigger 
            className={cn(
              "h-10 border-gray-300 rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500/30 focus:ring-2",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/30",
              className
            )}
            id={id}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-gray-200 shadow-md">
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer hover:bg-blue-50"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
AppSelect.displayName = "AppSelect";

// AppTable - Table component với style theo thiết kế mới
export interface AppTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  data: React.ReactNode[][];
  fixedHeader?: boolean;
  stickyFirstColumn?: boolean;
  stickyLastColumn?: boolean;
  alternateRows?: boolean;
  responsive?: boolean;
}

export const AppTable = React.forwardRef<HTMLTableElement, AppTableProps>(
  ({ className, headers, data, fixedHeader = true, stickyFirstColumn = false, stickyLastColumn = false, alternateRows = true, responsive = true, ...props }, ref) => {
    return (
      <div className={cn("w-full rounded-md border border-gray-200 shadow-sm", responsive && "overflow-x-auto", className)}>
        <table className="w-full border-collapse min-w-[650px]" ref={ref} {...props}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {headers.map((header, index) => (
                <th 
                  key={index} 
                  className={cn(
                    "p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap",
                    index === headers.length - 1 && "border-r-0",
                    fixedHeader && "sticky top-0 z-10 bg-gray-50",
                    stickyFirstColumn && index === 0 && "sticky left-0 z-20 bg-gray-50",
                    stickyLastColumn && index === headers.length - 1 && "sticky right-0 z-20 bg-gray-50"
                  )}
                >
                  <div className="flex items-center">
                    <span>{header}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIndex) => {
              const rowBgClass = alternateRows ? (
                rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
              ) : "bg-white";
              
              return (
                <tr 
                  key={rowIndex} 
                  className={cn("transition-colors duration-150 hover:bg-blue-50", rowBgClass)}
                >
                  {row.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex} 
                      className={cn(
                        "p-3 text-sm relative text-gray-700", 
                        cellIndex === row.length - 1 && "border-r-0",
                        stickyFirstColumn && cellIndex === 0 && "sticky left-0 z-10",
                        stickyLastColumn && cellIndex === row.length - 1 && "sticky right-0 z-10"
                      )}
                    >
                      <div className={cn(
                        "relative",
                        (stickyFirstColumn && cellIndex === 0) || (stickyLastColumn && cellIndex === row.length - 1) 
                          ? `px-2 py-1 ${rowBgClass}` : ""
                      )}>
                        {cell}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
);
AppTable.displayName = "AppTable";

// Các components đã được export ở trên thông qua export const, không cần export lại