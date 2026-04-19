import {
  defaultMonitoringAlertPreferences,
  monitoringAlertPreferencesSchema,
  type BrowserNotificationPermissionState,
  type MonitoringAlertPreferences,
} from "@/features/monitoring/monitoring.types";

const MONITORING_ALERT_PREFERENCES_STORAGE_KEY = "upright.monitoring.alert-preferences";
const BAD_POSTURE_NOTIFICATION_TAG = "upright-bad-posture-alert";
const BAD_POSTURE_ALERT_SPEECH_TEXT = "Bad posture detected";

function hasVoiceAlertSupport() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  );
}

function hasDesktopNotificationSupport() {
  return typeof window !== "undefined" && "Notification" in window;
}

function shouldShowDesktopNotification() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.visibilityState === "hidden" || !document.hasFocus();
}

function getPreferredAlertVoice() {
  if (!hasVoiceAlertSupport()) {
    return null;
  }

  const availableVoices = window.speechSynthesis.getVoices();

  return (
    availableVoices.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ??
    availableVoices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ??
    availableVoices[0] ??
    null
  );
}

export const monitoringAlertsService = {
  loadPreferences(): MonitoringAlertPreferences {
    if (typeof window === "undefined") {
      return defaultMonitoringAlertPreferences;
    }

    const rawPreferences = window.localStorage.getItem(MONITORING_ALERT_PREFERENCES_STORAGE_KEY);
    if (!rawPreferences) {
      return defaultMonitoringAlertPreferences;
    }

    try {
      const parsedPreferences = JSON.parse(rawPreferences) as unknown;
      const validatedPreferences = monitoringAlertPreferencesSchema.safeParse(parsedPreferences);

      if (!validatedPreferences.success) {
        return defaultMonitoringAlertPreferences;
      }

      return validatedPreferences.data;
    } catch {
      return defaultMonitoringAlertPreferences;
    }
  },

  savePreferences(preferences: MonitoringAlertPreferences) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(MONITORING_ALERT_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  },

  getDesktopNotificationPermission(): BrowserNotificationPermissionState {
    if (!hasDesktopNotificationSupport()) {
      return "unsupported";
    }

    return Notification.permission;
  },

  async requestDesktopNotificationPermission(): Promise<BrowserNotificationPermissionState> {
    if (!hasDesktopNotificationSupport()) {
      return "unsupported";
    }

    if (Notification.permission !== "default") {
      return Notification.permission;
    }

    return Notification.requestPermission();
  },

  primeVoiceAlert() {
    if (!hasVoiceAlertSupport()) {
      return false;
    }

    window.speechSynthesis.getVoices();
    return true;
  },

  speakBadPostureAlert() {
    if (!hasVoiceAlertSupport()) {
      return false;
    }

    const utterance = new SpeechSynthesisUtterance(BAD_POSTURE_ALERT_SPEECH_TEXT);
    const preferredVoice = getPreferredAlertVoice();

    utterance.lang = preferredVoice?.lang ?? "en-US";
    utterance.pitch = 1;
    utterance.rate = 1;
    utterance.volume = 1;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return true;
  },

  showBadPostureNotification() {
    if (!hasDesktopNotificationSupport() || Notification.permission !== "granted") {
      return false;
    }

    if (!shouldShowDesktopNotification()) {
      return false;
    }

    const notification = new Notification("Bad posture detected", {
      body: "Sit upright and reset your posture.",
      requireInteraction: true,
      silent: true,
      tag: BAD_POSTURE_NOTIFICATION_TAG,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  },
};
