import express, { json } from "express";
import "dotenv/config";
import { TypedRouter, swagger } from "meebo";
import config from "./config.js";

const app = express();

const router = TypedRouter(express.Router());

router.get(
  "/",
  { skipValidation: true, summary: "Hello World", tags: ["Hello"] },
  (req, res) => {
    res.json({ Hello: "World" });
  },
);

app.use(json());
app.use(router);
app.use(swagger());

const server = app.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
