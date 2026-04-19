import "@/theme/components/AppLogo/AppLogo.css";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      alt=""
      className={className ? `appLogo ${className}` : "appLogo"}
      src="/upright-logo.png"
    />
  );
}
