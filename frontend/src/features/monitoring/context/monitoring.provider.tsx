import { useCallback, useMemo, useState } from "react";
import { MonitoringContext } from "@/features/monitoring/context/monitoring.context";
import type { MonitoringContextValue, MonitoringUiState } from "@/features/monitoring/monitoring.types";

const initialState: MonitoringUiState = {
  isCameraActive: false,
  status: "idle",
  calibrationProgress: 0,
  errorMessage: null,
};

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MonitoringUiState>(initialState);

  const startCamera = useCallback(() => {
    setState({
      isCameraActive: true,
      status: "connecting",
      calibrationProgress: 0,
      errorMessage: null,
    });
  }, []);

  const stopCamera = useCallback(() => {
    setState(initialState);
  }, []);

  const syncState = useCallback((nextState: Partial<MonitoringUiState>) => {
    setState((currentState) => {
      const nextMergedState = {
        ...currentState,
        ...nextState,
      };

      if (
        nextMergedState.isCameraActive === currentState.isCameraActive &&
        nextMergedState.status === currentState.status &&
        nextMergedState.calibrationProgress === currentState.calibrationProgress &&
        nextMergedState.errorMessage === currentState.errorMessage
      ) {
        return currentState;
      }

      return nextMergedState;
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const api = useMemo<MonitoringContextValue>(
    () => ({
      state,
      startCamera,
      stopCamera,
      syncState,
      reset,
    }),
    [reset, startCamera, state, stopCamera, syncState],
  );

  return <MonitoringContext.Provider value={api}>{children}</MonitoringContext.Provider>;
}
