import { Paper, Loader, Text } from "@mantine/core";
import useLocalCamera from "@/features/monitoring/hooks/useLocalCamera";
import useInferencePipeline from "@/features/monitoring/hooks/useInferencePipeline";
import { InferenceOverlay } from "@/features/monitoring/components/InferenceOverlay";
import { useRef, useState } from "react";
import type { WebRTCOutputData } from "@roboflow/inference-sdk";
import { Buffer, InferencePipeline } from "@/features/monitoring/service/monitoring.service";
export function CameraPreview() {
  const { cameraStream, videoRef, isLoading, error } = useLocalCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /**
   * step1: Establish RTc connection to roboflow inference
   * step2: Show Camera weed with live inference active
   * User should be good distance in camera, not too close
   * User should be in frame not clipping or off to the side, key points must be visible
   * Once these are good User can calibrate by click calibrate, that button will be overlaid on the screen and start recording
   * During calibration, we will wait until we have n number of samples with a low std deviation
   * Once calibration is complete. The user will see Good posture if his nose-shoulder height is within threshold
   * User will see Slouch Detected if his node-shoulder height is outside it
   * We will be creating a buffer to measure data from rather than individual predictions
   */

  const [calibrationComplete, setCalibrationComplete] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrated] = useState<boolean>(false);
  const [postureHeightBaseline, setPostureHeightBaseline] = useState<number | null>(null);
  const pipeline = useRef(InferencePipeline());

  const buffer = useRef<WebRTCOutputData["serialized_output_data"][]>([]);

  /** Validates whether the user is an appropriate distance from the camera */
  function validateUserDistance(buffer: number[]) {}

  /** Validates whether the users upper body is detectible by object detection model */
  function validateUserInFrame(buffer: number[]) {}

  /** Begins determining users baseline vertical height between nose and shoulder */
  function startCalibration(buffer: number[]) {}

  /** Determines whether a user has good posture or is slouching*/
  function validatePosture(buffer: number[]) {}

  /** For each data we get we add to a buffer of max size 30
   * Then for each frame we need to validate whether posture is good or not
   */
  const { isConnected } = useInferencePipeline(cameraStream, (data) => {
    const isHealthyPosture = pipeline.current.process(data);

    console.log("Prediction:", data);
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.font = "24px Inter";
    ctx.fillStyle = isHealthyPosture ? "green" : "red";
    ctx.fillText(isHealthyPosture ? "Healthy" : "Slouching", 20, 40);
  });

  if (isLoading) return <Loader />;
  if (error) return <Text c="red">{error.message}</Text>;

  return (
    <Paper
      w="100%"
      radius="md"
      p={0}
      style={{ aspectRatio: "16/9", overflow: "hidden", position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <InferenceOverlay isConnected={isConnected} />
    </Paper>
  );
}
