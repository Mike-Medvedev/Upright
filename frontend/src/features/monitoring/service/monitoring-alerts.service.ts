import {
  defaultMonitoringAlertPreferences,
  monitoringAlertPreferencesSchema,
  type BrowserNotificationPermissionState,
  type MonitoringAlertPreferences,
} from "@/features/monitoring/monitoring.types";

const MONITORING_ALERT_PREFERENCES_STORAGE_KEY = "upright.monitoring.alert-preferences";
const BAD_POSTURE_NOTIFICATION_TAG = "upright-bad-posture-alert";
const BAD_POSTURE_AUDIO_URL = `${import.meta.env.BASE_URL}bad_posture.mp3`;
/** Short silent clip. Used only to unlock playback on a user gesture — not the alert clip. */
const SILENT_PRIME_AUDIO_URL = `${import.meta.env.BASE_URL}silent.mp3`;

let badPostureAudio: HTMLAudioElement | null = null;
let silentPrimeAudio: HTMLAudioElement | null = null;

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

function getSilentPrimeAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  if (!silentPrimeAudio) {
    silentPrimeAudio = new Audio(SILENT_PRIME_AUDIO_URL);
    silentPrimeAudio.preload = "auto";
  }

  return silentPrimeAudio;
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

  /**
   * Run during a user gesture (e.g. start camera, enable sound). Mobile browsers require
   * activation before audio can play; iOS also ignores `volume` on media elements, so we must
   * not prime with the real alert file — use a silent clip instead.
   */
  primeVoiceAlert() {
    const silent = getSilentPrimeAudio();
    if (!silent) {
      return false;
    }

    silent.currentTime = 0;
    void silent
      .play()
      .then(() => {
        silent.pause();
        silent.currentTime = 0;
      })
      .catch(() => {});

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
