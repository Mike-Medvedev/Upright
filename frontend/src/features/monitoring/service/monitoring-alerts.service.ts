import {
  defaultMonitoringAlertPreferences,
  monitoringAlertPreferencesSchema,
  type BrowserNotificationPermissionState,
  type MonitoringAlertPreferences,
} from "@/features/monitoring/monitoring.types";

const MONITORING_ALERT_PREFERENCES_STORAGE_KEY = "upright.monitoring.alert-preferences";
const BAD_POSTURE_NOTIFICATION_TAG = "upright-bad-posture-alert";
const BAD_POSTURE_AUDIO_URL = `${import.meta.env.BASE_URL}bad_posture.mp3`;

let badPostureAudio: HTMLAudioElement | null = null;

function getBadPostureAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  if (!badPostureAudio) {
    badPostureAudio = new Audio(BAD_POSTURE_AUDIO_URL);
    badPostureAudio.preload = "auto";
  }

  return badPostureAudio;
}

function hasVoiceAlertSupport() {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
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
    const audio = getBadPostureAudio();
    if (!audio) {
      return false;
    }

    const previousVolume = audio.volume;
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = previousVolume;
      })
      .catch(() => {
        audio.volume = previousVolume;
      });

    return true;
  },

  speakBadPostureAlert() {
    if (!hasVoiceAlertSupport()) {
      return false;
    }

    const audio = getBadPostureAudio();
    if (!audio) {
      return false;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => {});
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
