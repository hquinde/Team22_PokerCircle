import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";

const router = Router();

router.get(
  "/error",
  asyncHandler(async (req, res) => {
    throw new Error("Debug forced error");
  })
);

export default router;