import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const seasonRouter = Router();

seasonRouter.get(
  "/tv/season-episode-details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.seasonValidation.seasonEpisodeDetails,
  siteController.seasonController.seasonEpisodeDetails,
);

seasonRouter.get(
  "/webtoons/season-episode-details-list/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.webtoonsDetailsValidation.seasonEpisodeDetailsList,
  siteController.webtoonsDetailsController.seasonEpisodeDetailsList,
);

export { seasonRouter };
