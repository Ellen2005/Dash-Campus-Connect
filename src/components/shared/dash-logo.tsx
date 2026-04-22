import { cn } from "@/lib/utils";

interface DashLogoProps {
  size?: number;
  className?: string;
}

export function DashLogo({ size = 36, className }: DashLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="dash-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary))"/>
          <stop offset="100%" stopColor="hsl(var(--primary) / 0.7)"/>
        </linearGradient>
        <linearGradient id="dash-stroke" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="hsl(var(--primary-foreground))"/>
          <stop offset="100%" stopColor="hsl(var(--primary-foreground) / 0.85)"/>
        </linearGradient>
        <filter id="dash-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#dash-bg)"/>
      <rect width="64" height="64" rx="16" fill="white" fillOpacity="0.06"/>

      <path
        d="M15 12 L15 52"
        stroke="url(#dash-stroke)"
        strokeWidth="5.5"
        strokeLinecap="round"
        filter="url(#dash-glow)"
      />
      <path
        d="M15 12 C15 12 38 12 42 12 C52 12 54 20 54 32 C54 44 52 52 42 52 C38 52 15 52 15 52"
        stroke="url(#dash-stroke)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#dash-glow)"
      />
      <path
        d="M15 32 L37 32"
        stroke="url(#dash-stroke)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
    </svg>
  );
}
