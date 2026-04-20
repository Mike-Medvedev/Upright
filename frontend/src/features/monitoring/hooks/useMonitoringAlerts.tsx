import { monitoringAlertsService } from "@/features/monitoring/service/monitoring-alerts.service";
import type {
  MonitoringAlertPreferences,
  MonitoringSessionStatus,
} from "@/features/monitoring/monitoring.types";
import { useEffect, useRef } from "react";

const BAD_POSTURE_ALERT_DELAY_MS = 5000;
const BAD_POSTURE_ALERT_COOLDOWN_MS = 5000;

export function useMonitoringAlerts(
  isActive: boolean,
  status: MonitoringSessionStatus,
  isHealthyPosture: boolean | null,
  alertPreferences: MonitoringAlertPreferences,
) {
  const latestAlertPreferencesRef = useRef(alertPreferences);
  const latestIsHealthyPostureRef = useRef<boolean | null>(null);
  const latestStatusRef = useRef<MonitoringSessionStatus>("idle");
  const unhealthySinceRef = useRef<number | null>(null);
  const lastAlertAtRef = useRef<number | null>(null);

  useEffect(() => {
    latestAlertPreferencesRef.current = alertPreferences;
  }, [alertPreferences]);

  useEffect(() => {
    latestIsHealthyPostureRef.current = isHealthyPosture;
  }, [isHealthyPosture]);

  useEffect(() => {
    latestStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!isActive || status !== "live" || isHealthyPosture !== false) {
      unhealthySinceRef.current = null;
      return;
    }

    if (unhealthySinceRef.current === null) {
      unhealthySinceRef.current = Date.now();
    }
  }, [isActive, isHealthyPosture, status]);

  useEffect(() => {
    if (!isActive) {
      unhealthySinceRef.current = null;
      lastAlertAtRef.current = null;
      return;
    }

    const intervalId = window.setInterval(() => {
      if (latestStatusRef.current !== "live" || latestIsHealthyPostureRef.current !== false) {
        return;
      }

      const preferences = latestAlertPreferencesRef.current;
      if (!preferences.soundEnabled && !preferences.desktopNotificationsEnabled) {
        return;
      }

      const now = Date.now();

      if (unhealthySinceRef.current === null) {
        unhealthySinceRef.current = now;
        return;
      }

      if (now - unhealthySinceRef.current < BAD_POSTURE_ALERT_DELAY_MS) {
        return;
      }

      if (
        lastAlertAtRef.current !== null &&
        now - lastAlertAtRef.current < BAD_POSTURE_ALERT_COOLDOWN_MS
      ) {
        return;
      }

      lastAlertAtRef.current = now;

      if (preferences.soundEnabled) {
        monitoringAlertsService.speakBadPostureAlert();
      }

      if (preferences.desktopNotificationsEnabled) {
        monitoringAlertsService.showBadPostureNotification();
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isActive]);
}
