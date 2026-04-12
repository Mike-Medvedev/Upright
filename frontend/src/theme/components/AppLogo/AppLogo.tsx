import { useId } from "react";
import "./AppLogo.css";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  const gradId = useId().replaceAll(":", "");

  return (
    <svg
      aria-hidden="true"
      className={className ? `appLogo ${className}` : "appLogo"}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#cfb0ff" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="22" fill={`url(#${gradId})`} opacity="0.35" r="14" />
      <path
        d="M20 6c-2.5 3.5-6 10-6 16.5a6 6 0 1 0 12 0c0-6.5-3.5-13-6-16.5z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M12 18c-1.8 2.2-3 5.2-3 8a11 11 0 0 0 22 0c0-2.8-1.2-5.8-3-8-1.2 3.5-4 7.5-8 9.5-4-2-6.8-6-8-9.5z"
        fill={`url(#${gradId})`}
        opacity="0.88"
      />
      <path
        d="M20 10c-1.4 2-3.2 5.4-3.2 9.2a3.2 3.2 0 1 0 6.4 0c0-3.8-1.8-7.2-3.2-9.2z"
        fill="#e5d2ff"
        opacity="0.55"
      />
    </svg>
  );
}
