import { createRequire } from "node:module";
import config from "@/configs/config";

const require = createRequire(import.meta.url);
const { InferenceHTTPClient } = require("@roboflow/inference-sdk");
// import { InferenceHTTPClient } from "@roboflow/inference-sdk";

export const WebrtcService = {
  async initializeWebrtcSession(body: { offer: unknown; wrtcParams: Record<string, unknown> }) {
    const { offer, wrtcParams } = body;

    const client = InferenceHTTPClient.init({
      apiKey: config.ROBOFLOW_API_KEY,
    });

    const answer = await client.initializeWebrtcWorker({
      offer,
      workspaceName: wrtcParams.workspaceName,
      workflowId: wrtcParams.workflowId,
      config: {
        streamOutputNames: wrtcParams.streamOutputNames,
        dataOutputNames: wrtcParams.dataOutputNames,
        workflowsParameters: wrtcParams.workflowsParameters,
        requestedPlan: wrtcParams.requestedPlan,
        requestedRegion: wrtcParams.requestedRegion,
        processingTimeout: wrtcParams.processingTimeout,
      },
    });

    return answer;
  },
};
