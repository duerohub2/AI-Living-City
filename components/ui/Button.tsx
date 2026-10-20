import { ButtonHTMLAttributes } from 'react';
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`px-4 py-2 rounded-lg bg-accent text-white font-medium disabled:opacity-50 ${className}`} />;
}
