import type { Request, Response } from "express";

export const HelloController = {
  getHello(_req: Request, res: Response) {
    res.json({ Hello: "World" });
  },
};
