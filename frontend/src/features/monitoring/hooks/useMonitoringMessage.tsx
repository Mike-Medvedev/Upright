import type { InferenceError } from "@/lib/errors";
import { useState } from "react";
import {
  getInferenceHeaderState,
  getLivePostureHeaderState,
} from "../utils/monitoring-messages.utils";
import type { ValidationData } from "../monitoring.types";

export default function useMonitoringMessage() {
  const [headerMessage, setMessage] = useState<string | null>(null);
  const [headerMessageTone, setTone] = useState<"default" | "success" | "warning">("default");

  function resetHeaderMessage() {
    setMessage(null);
    setTone("default");
  }

  function setHeaderMessageError(error: InferenceError) {
    const nextHeaderState = getInferenceHeaderState(error);

    if (!nextHeaderState) {
      return;
    }

    setMessage(nextHeaderState.message);
    setTone(nextHeaderState.tone);
  }

  function setHeaderMessage(postureData: ValidationData) {
    const nextHeaderState = getLivePostureHeaderState(
      postureData.frameDistanceStatus,
      postureData.isHealthyPosture,
    );

    setMessage(nextHeaderState.message);
    setTone(nextHeaderState.tone);
  }

  return {
    headerMessage,
    headerMessageTone,
    resetHeaderMessage,
    setHeaderMessage,
    setHeaderMessageError,
  };
}
