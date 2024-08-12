import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import {
  validateApiKey,
  validateAccessToken,
  accessTokenIfAny,
  titleImageUpload,
  userAccessControl,
} from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const tvRouter = Router();

tvRouter.post(
  "/add-tv-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("tv", "", "add"),
  siteValidation.tvValidation.addTvPrimaryDetails,
  siteController.tvController.addTvPrimaryDetails,
);

tvRouter.post(
  "/add-season-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("tv", "", "add"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.tvValidation.addSeasonDetails,
  siteController.tvController.addSeasonDetails,
);

tvRouter.post(
  "/season-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.seasonRequestList,
  siteController.tvController.seasonRequestList,
);

tvRouter.post(
  "/save-episode-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("tv", "", "add"),
  siteValidation.tvValidation.saveEpisodeDetails,
  siteController.tvController.saveEpisodeDetails,
);

tvRouter.post(
  "/episode-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.episodeRequestList,
  siteController.tvController.episodeRequestList,
);

tvRouter.get(
  "/get-tv-primary-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tvValidation.getTvPrimaryDetails,
  siteController.tvController.getTvPrimaryDetails,
);

tvRouter.get(
  "/get-tv-request-season-details/:id",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.getTvRequestSeasonDetails,
  siteController.tvController.getTvRequestSeasonDetails,
);

tvRouter.get(
  "/get-tv-request-episode-details/:id",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.getTvRequestEpisodeDetails,
  siteController.tvController.getTvRequestEpisodeDetails,
);

tvRouter.get(
  "/tv/details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tvValidation.tvDetails,
  siteController.tvController.tvDetails,
);

tvRouter.get(
  "/tv/season/details/:id/:season_id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tvValidation.tvSeasonDetails,
  siteController.tvController.tvSeasonDetails,
);

tvRouter.post(
  "/tv/cast-crew-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tvValidation.tvCastCrewDetails,
  siteController.tvController.tvCastCrewDetails,
);

tvRouter.post(
  "/edit/tv-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("tv", "body.title_id", "edit"),
  siteValidation.tvValidation.editTvPrimaryDetails,
  siteController.tvController.editTvPrimaryDetails,
);

tvRouter.get(
  "/edit/get-tv-primary-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tvValidation.editGetTvPrimaryDetails,
  siteController.tvController.editGetTvPrimaryDetails,
);

tvRouter.post(
  "/edit/season-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("tv", "title_id", "edit", "formdata"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.tvValidation.editSeasonDetails,
  siteController.tvController.editSeasonDetails,
);

tvRouter.get(
  "/edit/get-tv-request-episode-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.getEditTvRequestEpisodeDetails,
  siteController.tvController.getEditTvRequestEpisodeDetails,
);

tvRouter.get(
  "/edit/get-tv-request-season-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.editGetTvRequestSeasonDetails,
  siteController.tvController.editGetTvRequestSeasonDetails,
);

tvRouter.get(
  "/tmdb-refresh/get-season-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.tmdbRefreshGetSeasonDetails,
  siteController.tvController.tmdbRefreshGetSeasonDetails,
);

tvRouter.post(
  "/tmdb-refresh/episode-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.tmdbRefreshEpisodeRequestList,
  siteController.tvController.tmdbRefreshEpisodeRequestList,
);

tvRouter.get(
  "/tmdb-refresh/get-episode-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.tmdbRefreshGetEpisodeDetails,
  siteController.tvController.tmdbRefreshGetEpisodeDetails,
);

tvRouter.post(
  "/tmdb-refresh/season-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.tvValidation.tmdbRefreshSeasonRequestList,
  siteController.tvController.tmdbRefreshSeasonRequestList,
);

export { tvRouter };
