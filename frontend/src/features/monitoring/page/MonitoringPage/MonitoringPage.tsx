import { Alert, Badge, Box, Button, Group, Loader, Stack, Text } from "@mantine/core";
import { IconRefresh, IconPlayerPause, IconPlayerPlay, IconPlayerStop } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getLocalCameraStream,
  initWebRtcStream,
  type WebRtcStreamConnection,
} from "@/infra/webrtc-stream";
import { MONITORING_ERROR_COPY, MONITORING_SESSION_COPY, type MonitoringSessionState } from "@/features/monitoring/monitoring.types";
import {
  loadCalibrationSnapshot,
  saveCalibrationSnapshot,
  shouldSkipCalibrationWizard,
} from "@/features/monitoring/service/monitoring.service";
import "./MonitoringPage.css";

const CALIBRATION_STEPS = [
  {
    heading: "Sit upright",
    body: "Sit the way you usually work—feet on the floor, screen at a comfortable height.",
  },
  {
    heading: "Hold still",
    body: "We’ll use this frame as your upright reference. Relax your shoulders.",
  },
  {
    heading: "You’re set",
    body: "Baseline saved for this camera position. You can recalibrate anytime if you move your laptop or chair.",
  },
] as const;

function stopMediaStreamTracks(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop());
}

function getInputVideoDimensions(connection: WebRtcStreamConnection): { width: number; height: number } {
  const local = connection.localStream();
  const track = local?.getVideoTracks()[0];
  const settings = track?.getSettings();

  if (settings?.width && settings?.height) {
    return { width: settings.width, height: settings.height };
  }

  return { width: 0, height: 0 };
}

export function MonitoringPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<WebRtcStreamConnection | null>(null);
  const localPreviewStreamRef = useRef<MediaStream | null>(null);

  const [sessionState, setSessionState] = useState<MonitoringSessionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);

  const startLocalPreview = useCallback(async () => {
    const video = videoRef.current;
    if (!video || connectionRef.current) {
      return;
    }

    setPreviewReady(false);
    stopMediaStreamTracks(localPreviewStreamRef.current);
    localPreviewStreamRef.current = null;

    try {
      const stream = await getLocalCameraStream();
      localPreviewStreamRef.current = stream;
      video.srcObject = stream;
      await video.play().catch(() => undefined);
      setPreviewReady(true);
    } catch {
      video.srcObject = null;
      setPreviewReady(false);
    }
  }, []);

  const teardownInference = useCallback(async () => {
    const conn = connectionRef.current;
    connectionRef.current = null;

    if (conn) {
      await conn.cleanup().catch(() => undefined);
    }

    const el = videoRef.current;
    if (el) {
      el.srcObject = null;
    }
  }, []);

  useEffect(() => {
    void startLocalPreview();

    return () => {
      setPreviewReady(false);
      void (async () => {
        await teardownInference();
        stopMediaStreamTracks(localPreviewStreamRef.current);
        localPreviewStreamRef.current = null;
        const el = videoRef.current;
        if (el) {
          el.srcObject = null;
        }
      })();
    };
  }, [startLocalPreview, teardownInference]);

  const applyStreamAndDecideCalibration = useCallback(async () => {
    const video = videoRef.current;
    const conn = connectionRef.current;
    if (!video || !conn) {
      return;
    }

    await video.play().catch(() => undefined);

    await new Promise<void>((resolve) => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        resolve();
        return;
      }

      video.addEventListener("loadeddata", () => resolve(), { once: true });
    });

    const { width, height } = getInputVideoDimensions(conn);
    const snapshot = loadCalibrationSnapshot();

    if (width > 0 && height > 0 && shouldSkipCalibrationWizard(snapshot, { width, height })) {
      setSessionState("monitoring");
      return;
    }

    setSessionState("needsCalibration");
  }, []);

  const handleStart = useCallback(async () => {
    const video = videoRef.current;
    const previewStream = localPreviewStreamRef.current;
    if (!video || !previewStream) {
      return;
    }

    setErrorMessage(null);
    localPreviewStreamRef.current = null;
    setSessionState("connecting");

    try {
      const stored = loadCalibrationSnapshot();
      const workflowsParameters =
        stored !== null
          ? {
              is_calibrating: false,
              baseline_height: stored.baselineHeight,
              threshold_ratio: 0.8,
            }
          : undefined;

      const connection = await initWebRtcStream(video, {
        source: previewStream,
        workflowsParameters,
      });
      connectionRef.current = connection;

      await applyStreamAndDecideCalibration();
    } catch (e) {
      stopMediaStreamTracks(previewStream);
      await teardownInference();
      await startLocalPreview();
      setErrorMessage(e instanceof Error ? e.message : "Something went wrong.");
      setSessionState("error");
    }
  }, [applyStreamAndDecideCalibration, startLocalPreview, teardownInference]);

  const handleRetry = useCallback(async () => {
    setErrorMessage(null);
    setSessionState("idle");
    await startLocalPreview();
  }, [startLocalPreview]);

  const handleStop = useCallback(async () => {
    await teardownInference();
    setSessionState("idle");
    setCalibrationStep(0);
    await startLocalPreview();
  }, [startLocalPreview, teardownInference]);

  const handlePause = useCallback(() => {
    setSessionState("paused");
  }, []);

  const handleResume = useCallback(() => {
    setSessionState("monitoring");
  }, []);

  const handleBeginCalibration = useCallback(() => {
    setCalibrationStep(0);
    setSessionState("calibrating");
  }, []);

  const handleCalibrationNext = useCallback(() => {
    if (calibrationStep < CALIBRATION_STEPS.length - 1) {
      setCalibrationStep((s) => s + 1);
      return;
    }

    const conn = connectionRef.current;
    const { width, height } = conn ? getInputVideoDimensions(conn) : { width: 0, height: 0 };

    saveCalibrationSnapshot({
      baselineHeight: 100,
      calibratedAt: new Date().toISOString(),
      ...(width > 0 && height > 0 ? { videoWidth: width, videoHeight: height } : {}),
    });

    setSessionState("monitoring");
    setCalibrationStep(0);
  }, [calibrationStep]);

  const handleRecalibrate = useCallback(() => {
    setCalibrationStep(0);
    setSessionState("needsCalibration");
  }, []);

  const sessionCopy =
    sessionState === "error"
      ? MONITORING_ERROR_COPY
      : MONITORING_SESSION_COPY[sessionState as Exclude<MonitoringSessionState, "error">];

  const isLive = sessionState === "monitoring" || sessionState === "paused";
  const showTopBar =
    isLive || sessionState === "needsCalibration" || sessionState === "calibrating";

  const cardStateClass =
    sessionState === "monitoring"
      ? "monitoringPreviewCard monitoringPreviewCard_live"
      : sessionState === "paused"
        ? "monitoringPreviewCard monitoringPreviewCard_paused"
        : "monitoringPreviewCard";

  return (
    <Stack className="monitoringPage" gap={0}>
      <Box className={cardStateClass}>
        {showTopBar ? (
          <div className="monitoringPreviewTopBar">
            <Group gap="sm" wrap="wrap">
              <Text className="monitoringPreviewTopTitle" fw={600} size="sm">
                {sessionState === "calibrating"
                  ? (CALIBRATION_STEPS[calibrationStep]?.heading ?? MONITORING_SESSION_COPY.calibrating.title)
                  : sessionCopy.title}
              </Text>
              {isLive ? (
                <Badge
                  className="monitoringLiveBadge"
                  color="grape"
                  leftSection={
                    sessionState === "monitoring" ? (
                      <span aria-hidden className="monitoringLiveDot" />
                    ) : undefined
                  }
                  variant="light"
                >
                  {sessionState === "monitoring" ? "Live" : "Paused"}
                </Badge>
              ) : null}
              {sessionState === "needsCalibration" || sessionState === "calibrating" ? (
                <Badge color="yellow" variant="light">
                  Calibration
                </Badge>
              ) : null}
            </Group>

            {isLive ? (
              <Group gap="xs" wrap="wrap">
                <Button
                  leftSection={<IconRefresh size={16} />}
                  onClick={handleRecalibrate}
                  size="compact-sm"
                  variant="default"
                >
                  Recalibrate
                </Button>
                {sessionState === "monitoring" ? (
                  <Button
                    leftSection={<IconPlayerPause size={16} />}
                    onClick={handlePause}
                    size="compact-sm"
                    variant="light"
                  >
                    Pause
                  </Button>
                ) : (
                  <Button
                    color="grape"
                    leftSection={<IconPlayerPlay size={16} />}
                    onClick={handleResume}
                    size="compact-sm"
                    variant="filled"
                  >
                    Resume
                  </Button>
                )}
                <Button
                  color="red"
                  leftSection={<IconPlayerStop size={16} />}
                  onClick={() => void handleStop()}
                  size="compact-sm"
                  variant="light"
                >
                  Stop
                </Button>
              </Group>
            ) : null}
          </div>
        ) : null}

        <div className="monitoringVideoShell">
          <video
            ref={videoRef}
            aria-label="Camera preview"
            autoPlay
            className={`monitoringVideo${sessionState === "idle" ? " monitoringVideo_local" : ""}`}
            muted
            playsInline
          />

          {sessionState === "connecting" ? (
            <div className="monitoringVideoOverlay monitoringVideoOverlay_connecting">
              <Loader color="grape" size="lg" />
              <Text mt="md" size="sm">
                {MONITORING_SESSION_COPY.connecting.description}
              </Text>
            </div>
          ) : null}

          {sessionState === "paused" ? (
            <div className="monitoringVideoOverlay monitoringVideoOverlay_paused">
              <Text fw={600} size="lg">
                Paused
              </Text>
              <Text c="dimmed" mt="xs" size="sm">
                Resume when you are ready to track posture again.
              </Text>
            </div>
          ) : null}

          {sessionState === "needsCalibration" ? (
            <div className="monitoringVideoOverlay monitoringVideoOverlay_dim">
              <Stack align="center" gap="md" maw={420}>
                <Text fw={600} size="lg" ta="center">
                  {MONITORING_SESSION_COPY.needsCalibration.title}
                </Text>
                <Text c="dimmed" size="sm" ta="center">
                  {MONITORING_SESSION_COPY.needsCalibration.description}
                </Text>
                <Button color="grape" onClick={handleBeginCalibration} size="md">
                  {MONITORING_SESSION_COPY.needsCalibration.primaryCta}
                </Button>
              </Stack>
            </div>
          ) : null}

          {sessionState === "calibrating" ? (
            <div className="monitoringVideoOverlay monitoringVideoOverlay_dim">
              <Stack align="center" gap="md" maw={440}>
                <Text c="dimmed" size="sm" ta="center">
                  Step {calibrationStep + 1} of {CALIBRATION_STEPS.length}
                </Text>
                <Text fw={600} size="lg" ta="center">
                  {CALIBRATION_STEPS[calibrationStep]?.heading}
                </Text>
                <Text c="dimmed" size="sm" ta="center">
                  {CALIBRATION_STEPS[calibrationStep]?.body}
                </Text>
                <Button color="grape" onClick={handleCalibrationNext} size="md">
                  {calibrationStep < CALIBRATION_STEPS.length - 1 ? "Next" : "Finish"}
                </Button>
              </Stack>
            </div>
          ) : null}
        </div>

        <div
          aria-live="polite"
          className={`monitoringPreviewFooter ${sessionState === "idle" ? "monitoringPreviewFooter_idle" : ""}`}
        >
          {sessionState === "idle" ? (
            <Button
              color="grape"
              disabled={!previewReady}
              onClick={() => void handleStart()}
              size="md"
            >
              {MONITORING_SESSION_COPY.idle.primaryCta}
            </Button>
          ) : null}

          {sessionState === "error" ? (
            <Stack gap="sm">
              <Alert color="red" title={MONITORING_ERROR_COPY.title} variant="light">
                {errorMessage ?? MONITORING_ERROR_COPY.description}
              </Alert>
              <Button color="grape" onClick={() => void handleRetry()} variant="light">
                {MONITORING_ERROR_COPY.primaryCta}
              </Button>
            </Stack>
          ) : null}

        </div>
      </Box>
    </Stack>
  );
}
