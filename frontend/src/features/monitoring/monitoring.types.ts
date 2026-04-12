import { z } from "zod/v4";

/**
 * Monitoring session states (UI ↔ WebRTC):
 * idle → connecting (Start) → needsCalibration | monitoring (stream ready + skip rules)
 * → calibrating (wizard) → monitoring → paused ↔ monitoring → idle (Stop).
 * Error can replace connecting if init fails.
 */
/** UI session states for the monitoring hero card (see plan: state machine). */
export type MonitoringSessionState =
  | "idle"
  | "connecting"
  | "needsCalibration"
  | "calibrating"
  | "monitoring"
  | "paused"
  | "error";

/** Calibration snapshot persisted locally (validated on read). */
export const calibrationSnapshotSchema = z.object({
  baselineHeight: z.number(),
  calibratedAt: z.string(),
  videoWidth: z.number().optional(),
  videoHeight: z.number().optional(),
});

export type CalibrationSnapshot = z.infer<typeof calibrationSnapshotSchema>;

/** Copy and CTAs per session state (single source for UX documentation). */
export const MONITORING_SESSION_COPY: Record<
  Exclude<MonitoringSessionState, "error">,
  { title: string; description: string; primaryCta: string; secondaryCta?: string }
> = {
  idle: {
    title: "Ready when you are",
    description: "Start monitoring to check your posture while you work. Your camera preview runs here.",
    primaryCta: "Start monitoring",
  },
  connecting: {
    title: "Starting live posture tracking",
    description: "Starting live posture tracking",
    primaryCta: "Starting…",
  },
  needsCalibration: {
    title: "Calibrate your baseline",
    description:
      "A quick calibration helps account for camera angle and how you sit. It only takes a few seconds.",
    primaryCta: "Start calibration",
  },
  calibrating: {
    title: "Calibration",
    description: "Follow the steps below while watching your preview.",
    primaryCta: "Next",
  },
  monitoring: {
    title: "Monitoring",
    description: "Sit naturally—we’ll nudge you if you slouch.",
    primaryCta: "Pause",
    secondaryCta: "Stop",
  },
  paused: {
    title: "Paused",
    description: "Monitoring is paused. Resume when you’re back at your desk.",
    primaryCta: "Resume",
    secondaryCta: "Stop",
  },
};

export const MONITORING_ERROR_COPY = {
  title: "Couldn’t start monitoring",
  description: "Check camera permissions and try again.",
  primaryCta: "Try again",
} as const;

/** Default slouch-alert behavior (tiers + cooldown; wire to onData later). */
/** Future Settings toggles (posture + alerts); UI placeholders only until wired. */
export const SETTINGS_POSTURE_PLACEHOLDERS = [
  { id: "slouch_sensitivity", label: "Slouch sensitivity", description: "How strict posture detection is." },
  { id: "alert_sound", label: "Alert sound", description: "Optional audio when posture drifts." },
  {
    id: "alert_cooldown",
    label: "Time between nudges",
    description: "Minimum gap between visible slouch reminders.",
  },
  { id: "water_reminders", label: "Water reminders", description: "Coming later." },
  { id: "screen_time", label: "Screen time breaks", description: "Coming later." },
] as const;

export const MONITORING_ALERT_DEFAULTS = {
  /** Minimum time between user-visible slouch alerts (ms). */
  cooldownMs: 45_000,
  /** Escalation: subtle → standard toast → persistent overlay (thresholds TBD in model layer). */
  tiers: ["subtle", "standard", "persistent"] as const,
  /** When prefers-reduced-motion, prefer static badges over pulsing animations. */
  respectReducedMotion: true,
} as const;
