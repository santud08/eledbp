import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const mediaRouter = Router();

mediaRouter.post(
  "/details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.mediaValidation.mediaDetails,
  siteController.mediaController.mediaDetails,
);

mediaRouter.post(
  "/season/tv/media-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.mediaValidation.seasonTvMediaDetails,
  siteController.mediaController.seasonTvMediaDetails,
);

mediaRouter.post(
  "/season/webtoons/media-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.mediaValidation.seasonWebtoonsMediaDetails,
  siteController.mediaController.seasonWebtoonsMediaDetails,
);

export { mediaRouter };
