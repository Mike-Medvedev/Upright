import type { Request, Response } from "express";
import { WebrtcService } from "./webrtc.service";

export const WebrtcController = {
  async initWebrtc(req: Request, res: Response) {
    const answer = await WebrtcService.initializeWebrtcSession(req.body);
    res.json(answer);
  },
};
