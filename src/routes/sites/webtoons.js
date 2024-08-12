import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import {
  validateApiKey,
  validateAccessToken,
  accessTokenIfAny,
  titleImageUpload,
  userAccessControl,
  characterImageUpload,
} from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const webtoonsRouter = Router();

webtoonsRouter.get(
  "/weekdays-list",
  validateApiKey,
  validateAccessToken,
  siteController.webtoonsController.weekdaysList,
);

webtoonsRouter.post(
  "/add-webtoons-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "", "add"),
  siteValidation.webtoonsValidation.addWebtoonsPrimaryDetails,
  siteController.webtoonsController.addWebtoonsPrimaryDetails,
);

webtoonsRouter.get(
  "/get-webtoons-primary-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.webtoonsValidation.getWebtoonsPrimaryDetails,
  siteController.webtoonsController.getWebtoonsPrimaryDetails,
);

webtoonsRouter.post(
  "/webtoons-add-season-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "", "add"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.webtoonsValidation.addWebtoonSeasonDetails,
  siteController.webtoonsController.addWebtoonSeasonDetails,
);

webtoonsRouter.get(
  "/get-webtoons-request-season-details/:id",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.getWebtoonsRequestSeasonDetails,
  siteController.webtoonsController.getWebtoonsRequestSeasonDetails,
);

webtoonsRouter.get(
  "/webtoons-season-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.webtoonsSeasonRequestList,
  siteController.webtoonsController.webtoonsSeasonRequestList,
);

webtoonsRouter.post(
  "/webtoons-save-episode-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "", "add"),
  siteValidation.webtoonsValidation.webtoonsSaveEpisodeDetails,
  siteController.webtoonsController.webtoonsSaveEpisodeDetails,
);

webtoonsRouter.post(
  "/webtoons-episode-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.webtoonsEpisodeRequestList,
  siteController.webtoonsController.webtoonsEpisodeRequestList,
);

webtoonsRouter.get(
  "/get-webtoons-request-episode-details/:id",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.getWebtoonsEpisodeDetails,
  siteController.webtoonsController.getWebtoonsEpisodeDetails,
);

webtoonsRouter.post(
  "/webtoons-add-media-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "", "add"),
  siteValidation.webtoonsValidation.webtoonsAddMediaDetails,
  siteController.webtoonsController.webtoonsAddMediaDetails,
);

webtoonsRouter.post(
  "/webtoons-media-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.webtoonsMediaRequestList,
  siteController.webtoonsController.webtoonsMediaRequestList,
);

webtoonsRouter.post(
  "/webtoons-add-credit-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "", "add"),
  siteValidation.webtoonsValidation.webtoonsAddCreditDetails,
  siteController.webtoonsController.webtoonsAddCreditDetails,
);

webtoonsRouter.post(
  "/webtoons-cast-crew-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.webtoonsCastCrewReqList,
  siteController.webtoonsController.webtoonsCastCrewReqList,
);

webtoonsRouter.post(
  "/webtoons-create-new-character",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "", "add"),
  customFileHelper.customFileUpload(characterImageUpload.single("image")),
  siteValidation.webtoonsValidation.createNewCharacter,
  siteController.webtoonsController.createNewCharacter,
);

webtoonsRouter.get(
  "/webtoons/details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.webtoonsDetailsValidation.webtoonsDetails,
  siteController.webtoonsDetailsController.webtoonsDetails,
);

webtoonsRouter.get(
  "/webtoons/season/details/:id/:season_id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.webtoonsDetailsValidation.webtoonsSeasonDetails,
  siteController.webtoonsDetailsController.webtoonsSeasonDetails,
);

webtoonsRouter.post(
  "/webtoons/character-crew-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.webtoonsDetailsValidation.webtoonsCharacterCrewDetails,
  siteController.webtoonsDetailsController.webtoonsCharacterCrewDetails,
);

webtoonsRouter.get(
  "/edit/get-webtoons-primary-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.webtoonsValidation.editGetWtPrimaryDetails,
  siteController.webtoonsController.editGetWtPrimaryDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "body.title_id", "edit"),
  siteValidation.webtoonsValidation.editWtPrimaryDetails,
  siteController.webtoonsController.editWtPrimaryDetails,
);

webtoonsRouter.get(
  "/edit/get-webtoons-request-season-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.editGetWtRequestSeasonDetails,
  siteController.webtoonsController.editGetWtRequestSeasonDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-season-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "title_id", "edit", "formdata"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.webtoonsValidation.editWtSeasonDetails,
  siteController.webtoonsController.editWtSeasonDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-episode-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.editWtEpisodeRequestList,
  siteController.webtoonsController.editWtEpisodeRequestList,
);

webtoonsRouter.get(
  "/edit/get-webtoons-request-episode-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.getEditWtRequestEpisodeDetails,
  siteController.webtoonsController.getEditWtRequestEpisodeDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-save-episode-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "body.title_id", "edit"),
  siteValidation.webtoonsValidation.editWtSaveEpisodeDetails,
  siteController.webtoonsController.editWtSaveEpisodeDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-media-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.editWtMediaRequestList,
  siteController.webtoonsController.editWtMediaRequestList,
);

webtoonsRouter.post(
  "/edit/webtoons-media-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "body.title_id", "edit"),
  siteValidation.webtoonsValidation.editWtMediaDetails,
  siteController.webtoonsController.editWtMediaDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-cast-crew-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.webtoonsValidation.editWtCastCrewRequestList,
  siteController.webtoonsController.editWtCastCrewRequestList,
);

webtoonsRouter.post(
  "/edit/webtoons-credit-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "body.title_id", "edit"),
  siteValidation.webtoonsValidation.editCreditDetails,
  siteController.webtoonsController.editCreditDetails,
);

webtoonsRouter.post(
  "/edit/webtoons-create-new-character",
  validateApiKey,
  validateAccessToken,
  userAccessControl("webtoons", "title_id", "edit", "formdata"),
  customFileHelper.customFileUpload(characterImageUpload.single("image")),
  siteValidation.webtoonsValidation.editCreateNewCharacter,
  siteController.webtoonsController.editCreateNewCharacter,
);

export { webtoonsRouter };
