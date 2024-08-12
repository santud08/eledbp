import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import {
  validateApiKey,
  validateAccessToken,
  accessTokenIfAny,
  titleImageUpload,
  peopleImageUpload,
  userAccessControl,
} from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const titleRouter = Router();

titleRouter.get(
  "/title-status-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.titleStatusList,
  siteController.titleController.titleStatusList,
);

titleRouter.get(
  "/title-search-by-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.titleSearchByList,
  siteController.titleController.titleSearchByList,
);

titleRouter.get(
  "/title-search-for-connections",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.titleSearchForConnections,
  siteController.titleController.titleSearchForConnections,
);

titleRouter.get(
  "/certification-list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.certificationList,
  siteController.titleController.certificationList,
);

titleRouter.get(
  "/original-work-type-list",
  validateApiKey,
  validateAccessToken,
  siteController.titleController.originalWorkTypeList,
);

titleRouter.get(
  "/ott-service-provider-list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.ottServiceProvider,
  siteController.titleController.ottServiceProviderList,
);

titleRouter.post(
  "/add-media-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  siteValidation.titleValidation.addMediaDetails,
  siteController.titleController.addMediaDetails,
);

titleRouter.post(
  "/credit-people-search-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.creditPeopleSearchList,
  siteController.titleController.creditPeopleSearchList,
);

titleRouter.post(
  "/add-credit-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  siteValidation.titleValidation.addCreditDetails,
  siteController.titleController.addCreditDetails,
);

titleRouter.post(
  "/upload-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  customFileHelper.customFileUpload(titleImageUpload.array("images", 5)),
  siteValidation.titleValidation.uploadImage,
  siteController.titleController.uploadImage,
);

titleRouter.post(
  "/upload-poster-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.titleValidation.uploadPosterImage,
  siteController.titleController.uploadPosterImage,
);

titleRouter.post(
  "/add-episode-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.titleValidation.addEpisodeDetails,
  siteController.titleController.addEpisodeDetails,
);

titleRouter.post(
  "/cast-crew-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.castCrewDetails,
  siteController.titleController.castCrewDetails,
);

titleRouter.post(
  "/cast-crew-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.castCrewRequestList,
  siteController.titleController.castCrewRequestList,
);

titleRouter.get(
  "/job-title-list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.jobTitleList,
  siteController.titleController.jobTitleList,
);

titleRouter.get(
  "/details/series-list/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.seriesList,
  siteController.titleController.seriesList,
);

titleRouter.get(
  "/details/connection-list/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.detailsConnectionList,
  siteController.titleController.connectionList,
);

titleRouter.get(
  "/details/recommendation-list/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.recommendationList,
  siteController.titleController.recommendationList,
);

titleRouter.get(
  "/details/tag-list/:id/:main_catid",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.tagList,
  siteController.titleController.tagList,
);

titleRouter.get(
  "/details/tag-category-list/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.titleValidation.tagCategoryList,
  siteController.titleController.tagCategoryList,
);

titleRouter.post(
  "/episode/season-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.seasonFilterList,
  siteController.titleController.seasonFilterList,
);

titleRouter.post(
  "/save-tag-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  siteValidation.titleValidation.saveTagDetails,
  siteController.titleController.saveTagDetails,
);

titleRouter.post(
  "/tag-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.tagRequestList,
  siteController.titleController.tagRequestList,
);

titleRouter.post(
  "/create-new-credit",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  customFileHelper.customFileUpload(peopleImageUpload.single("image")),
  siteValidation.titleValidation.createNewCredit,
  siteController.titleController.createNewCredit,
);

titleRouter.post(
  "/upload-background-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.titleValidation.uploadBackgroundImage,
  siteController.titleController.uploadBackgroundImage,
);

titleRouter.post(
  "/media-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.mediaRequestList,
  siteController.titleController.mediaRequestList,
);

titleRouter.post(
  "/submit-all-save-title",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "", "add"),
  siteValidation.titleValidation.submitAllSaveTitle,
  siteController.titleController.submitAllSaveTitle,
);

titleRouter.get(
  "/tv-network-list",
  validateApiKey,
  validateAccessToken,
  siteController.titleController.tvNetworkList,
);

titleRouter.post(
  "/edit/media-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.editMediaRequestList,
  siteController.titleController.editMediaRequestList,
);

titleRouter.post(
  "/edit/media-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.editMediaDetails,
  siteController.titleController.editMediaDetails,
);

titleRouter.post(
  "/edit/credit-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.editCreditDetails,
  siteController.titleController.editCreditDetails,
);

titleRouter.post(
  "/edit/cast-crew-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.editCastCrewRequestList,
  siteController.titleController.editCastCrewRequestList,
);

titleRouter.post(
  "/edit/save-tag-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.editTagDetails,
  siteController.titleController.editTagDetails,
);

titleRouter.post(
  "/edit/tag-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.editTagRequestList,
  siteController.titleController.editTagRequestList,
);

titleRouter.post(
  "/edit/season-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.editSeasonRequestList,
  siteController.titleController.editSeasonRequestList,
);

titleRouter.post(
  "/edit/episode-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.editEpisodeRequestList,
  siteController.titleController.editEpisodeRequestList,
);

titleRouter.post(
  "/edit/submit-all-save-title",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.editSubmitAllSaveTitle,
  siteController.titleController.editSubmitAllSaveTitle,
);

titleRouter.post(
  "/edit/save-episode-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.editSaveEpisodeDetails,
  siteController.titleController.editSaveEpisodeDetails,
);

titleRouter.post(
  "/edit/season-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.titleValidation.editSeasonFilterList,
  siteController.titleController.editSeasonFilterList,
);

titleRouter.post(
  "/edit/edit-episode-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.titleValidation.editAddEpisodeDetails,
  siteController.titleController.editAddEpisodeDetails,
);

titleRouter.post(
  "/edit/upload-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "title_id", "edit", "formdata"),
  customFileHelper.customFileUpload(titleImageUpload.array("images", 5)),
  siteValidation.titleValidation.editUploadImage,
  siteController.titleController.editUploadImage,
);

titleRouter.post(
  "/edit/upload-poster-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "body.title_id", "edit"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.titleValidation.editUploadPosterImage,
  siteController.titleController.editUploadPosterImage,
);

titleRouter.post(
  "/edit/upload-background-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "title_id", "edit", "formdata"),
  customFileHelper.customFileUpload(titleImageUpload.single("image")),
  siteValidation.titleValidation.editUploadBackgroundImage,
  siteController.titleController.editUploadBackgroundImage,
);

titleRouter.post(
  "/edit/create-new-credit",
  validateApiKey,
  validateAccessToken,
  userAccessControl("title", "title_id", "edit", "formdata"),
  customFileHelper.customFileUpload(peopleImageUpload.single("image")),
  siteValidation.titleValidation.editCreateNewCredit,
  siteController.titleController.editCreateNewCredit,
);

titleRouter.get(
  "/tmdb-refresh/get-primary-details",
  validateApiKey,
  validateAccessToken,
  //userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.tmdbRefreshGetPrimaryDetails,
  siteController.titleController.tmdbRefreshGetPrimaryDetails,
);

titleRouter.post(
  "/tmdb-refresh/get-media-details",
  validateApiKey,
  validateAccessToken,
  //userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.tmdbRefreshGetMediaDetails,
  siteController.titleController.tmdbRefreshGetMediaDetails,
);

titleRouter.post(
  "/tmdb-refresh/get-credit-details",
  validateApiKey,
  validateAccessToken,
  //userAccessControl("title", "body.title_id", "edit"),
  siteValidation.titleValidation.tmdbRefreshGetCreditDetails,
  siteController.titleController.tmdbRefreshGetCreditDetails,
);

export { titleRouter };
