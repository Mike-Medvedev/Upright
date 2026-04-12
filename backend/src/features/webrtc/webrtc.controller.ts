import type { Request, Response } from "express";
import { initializeWebrtcSession } from "./webrtc.service";

export const WebrtcController = {
  async initWebrtc(req: Request, res: Response) {
    const answer = await initializeWebrtcSession(req.body);
    res.json(answer);
  },
};
