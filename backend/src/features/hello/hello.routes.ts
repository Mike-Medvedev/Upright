import express from "express";
import { TypedRouter } from "meebo";
import { z } from "zod";
import { HelloController } from "./hello.controller";

export const helloRouter = TypedRouter(express.Router(), {
  tag: "Hello",
  basePath: "/api/v1",
});

helloRouter.get("/", {
  operationId: "getHello",
  summary: "Hello World",
  response: z.record(z.string(), z.any()),
}, HelloController.getHello);
