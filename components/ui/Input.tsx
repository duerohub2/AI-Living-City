import { InputHTMLAttributes, forwardRef } from 'react';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} {...props} className={`w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 outline-none focus:border-accent ${className}`} />
  )
);
Input.displayName = 'Input';
