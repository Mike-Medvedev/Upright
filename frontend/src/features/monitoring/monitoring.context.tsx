import { createContext, useContext } from "react";
import { ConfigurationError } from "@/lib/errors";
import type { MonitoringContextValue } from "@/features/monitoring/monitoring.types";

export const MonitoringContext = createContext<MonitoringContextValue | null>(null);

export function useMonitoring() {
  const context = useContext(MonitoringContext);

  if (!context) {
    throw new ConfigurationError("Monitoring context must be used within MonitoringProvider.");
  }

  return context;
}
