import { useCallback, useMemo, useState } from "react";
import { MonitoringContext } from "@/features/monitoring/context/monitoring.context";
import { monitoringAlertsService } from "@/features/monitoring/service/monitoring-alerts.service";
import type {
  MonitoringAlertPreferences,
  MonitoringContextValue,
  MonitoringUiState,
} from "@/features/monitoring/monitoring.types";

const initialState: MonitoringUiState = {
  isCameraActive: false,
  status: "idle",
  calibrationProgress: 0,
  errorMessage: null,
};

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MonitoringUiState>(initialState);
  const [alertPreferences, setAlertPreferences] = useState<MonitoringAlertPreferences>(() =>
    monitoringAlertsService.loadPreferences(),
  );

  const startCamera = useCallback(() => {
    setState({
      isCameraActive: true,
      status: "connecting",
      calibrationProgress: 0,
      errorMessage: null,
    });

    if (alertPreferences.soundEnabled) {
      monitoringAlertsService.primeVoiceAlert();
    }

    if (alertPreferences.desktopNotificationsEnabled) {
      void monitoringAlertsService.requestDesktopNotificationPermission();
    }
  }, [alertPreferences.desktopNotificationsEnabled, alertPreferences.soundEnabled]);

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

  const updateAlertPreferences = useCallback((nextState: Partial<MonitoringAlertPreferences>) => {
    setAlertPreferences((currentPreferences) => {
      const nextPreferences = {
        ...currentPreferences,
        ...nextState,
      };

      if (
        nextPreferences.desktopNotificationsEnabled === currentPreferences.desktopNotificationsEnabled &&
        nextPreferences.soundEnabled === currentPreferences.soundEnabled
      ) {
        return currentPreferences;
      }

      monitoringAlertsService.savePreferences(nextPreferences);

      return nextPreferences;
    });
  }, []);

  const api = useMemo<MonitoringContextValue>(
    () => ({
      alertPreferences,
      updateAlertPreferences,
      state,
      startCamera,
      stopCamera,
      syncState,
      reset,
    }),
    [alertPreferences, reset, startCamera, state, stopCamera, syncState, updateAlertPreferences],
  );

  return <MonitoringContext.Provider value={api}>{children}</MonitoringContext.Provider>;
}
