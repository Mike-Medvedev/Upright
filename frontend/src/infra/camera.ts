import { streams } from "@roboflow/inference-sdk";
export async function getLocalCameraStream(): Promise<MediaStream> {
  return streams.useCamera({
    video: {
      facingMode: { ideal: "user" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: false,
  });
}
