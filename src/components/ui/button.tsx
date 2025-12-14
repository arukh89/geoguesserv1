import type * as React from "react"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
}

const variants = {
  default:
    "bg-[rgba(0,255,65,0.12)] text-[var(--accent)] border-[rgba(0,255,65,0.4)] hover:bg-[rgba(0,255,65,0.18)] font-semibold",
  secondary:
    "bg-transparent text-[var(--accent)] border-[rgba(0,255,65,0.3)] hover:bg-[rgba(0,255,65,0.08)] font-medium",
  outline: "bg-transparent text-[var(--accent)] border-[var(--accent)] hover:bg-[rgba(0,255,65,0.08)] font-medium",
} as const

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
} as const

export const Button: React.FC<ButtonProps> = ({ className = "", variant = "default", size = "md", ...rest }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded border transition mx-ring shadow-[var(--shadow)] disabled:opacity-50 disabled:cursor-not-allowed"
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()} {...rest} />
}

export default Button
