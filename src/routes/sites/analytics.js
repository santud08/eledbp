import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const analyticsRouter = Router();

analyticsRouter.post(
  "/embed/statistics",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.analyticValidation.addStatistics,
  siteController.analyticController.addStatistics,
);

analyticsRouter.post(
  "/embed/search-statistics",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.analyticValidation.addSearchStatistics,
  siteController.analyticController.addSearchStatistics,
);

export { analyticsRouter };
