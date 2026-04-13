import { streams } from "@roboflow/inference-sdk";

class CameraClient {
  private stream: MediaStream | null = null;
  async getCamera() {
    this.stream = await streams.useCamera({
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    });
    return this.stream;
  }

  stop() {
    if (this.stream) this.stream.getTracks().forEach((track) => track.stop());
    else console.warn("Attemoted to stop null camera stream");
  }
}
export const cameraClient = new CameraClient();
