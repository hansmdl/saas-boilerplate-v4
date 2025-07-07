import * as React from "react";
import { clsx } from "clsx";

export type ButtonVariant = "default" | "outline" | "ghost" | "link" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
  link: "underline-offset-4 hover:underline text-primary",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", loading, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(base, variants[variant], className)}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";
