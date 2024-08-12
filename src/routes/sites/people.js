import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import {
  validateApiKey,
  validateAccessToken,
  peopleImageUpload,
  accessTokenIfAny,
  userAccessControl,
} from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const peopleRouter = Router();

peopleRouter.post(
  "/add-people-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "", "add"),
  customFileHelper.customFileUpload(peopleImageUpload.single("image")),
  siteValidation.peopleValidation.addPeoplePrimaryDetails,
  siteController.peopleController.addPeoplePrimaryDetails,
);

peopleRouter.get(
  "/gender-list",
  validateApiKey,
  validateAccessToken,
  siteController.peopleController.genderList,
);

peopleRouter.get(
  "/show-people-primary-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.peopleValidation.showPeoplePrimaryDetails,
  siteController.peopleController.showPeoplePrimaryDetails,
);

peopleRouter.post(
  "/add-people-media-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "", "add"),
  siteValidation.peopleValidation.addPeopleMediaDetails,
  siteController.peopleController.addPeopleMediaDetails,
);

peopleRouter.post(
  "/people-media-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.peopleValidation.peopleMediaRequestList,
  siteController.peopleController.peopleMediaRequestList,
);

peopleRouter.post(
  "/upload-people-media-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "", "add"),
  customFileHelper.customFileUpload(peopleImageUpload.array("images", 5)),
  siteValidation.peopleValidation.uploadPeopleMediaImage,
  siteController.peopleController.uploadPeopleMediaImage,
);

peopleRouter.post(
  "/upload-people-background-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "", "add"),
  customFileHelper.customFileUpload(peopleImageUpload.single("image")),
  siteValidation.peopleValidation.uploadPeopleBackgroundImage,
  siteController.peopleController.uploadPeopleBackgroundImage,
);

//not used - start//
peopleRouter.get(
  "/title-search-by-list",
  validateApiKey,
  validateAccessToken,
  siteController.peopleController.titleSearchByList,
);
//not used - end//

peopleRouter.post(
  "/submit-all-save-people",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "", "add"),
  siteValidation.peopleValidation.submitAllSavePeople,
  siteController.peopleController.submitAllSavePeople,
);

peopleRouter.post(
  "/popular-people",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.peopleValidation.popularPeopleList,
  siteController.peopleController.popularPeopleList,
);

peopleRouter.get(
  "/details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.peopleValidation.peopleDetails,
  siteController.peopleController.peopleDetails,
);

peopleRouter.post(
  "/work-list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.peopleValidation.workList,
  siteController.peopleController.workList,
);

peopleRouter.get(
  "/related-articles",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.peopleValidation.relatedArticle,
  siteController.peopleController.relatedArticle,
);

peopleRouter.get(
  "/known-for/list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.peopleValidation.knownForList,
  siteController.peopleController.knownForList,
);

peopleRouter.post(
  "/media",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.peopleValidation.mediaDetails,
  siteController.peopleController.mediaDetails,
);

peopleRouter.post(
  "/edit/edit-people-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "people_id", "edit", "formdata"),
  customFileHelper.customFileUpload(peopleImageUpload.single("image")),
  siteValidation.peopleValidation.editPeoplePrimaryDetails,
  siteController.peopleController.editPeoplePrimaryDetails,
);

peopleRouter.post(
  "/edit/edit-people-media-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "body.people_id", "edit"),
  siteValidation.peopleValidation.editPeopleMediaDetails,
  siteController.peopleController.editPeopleMediaDetails,
);

peopleRouter.get(
  "/edit/show-people-primary-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.peopleValidation.editShowPeoplePrimaryDetails,
  siteController.peopleController.editShowPeoplePrimaryDetails,
);

peopleRouter.post(
  "/edit/people-media-request-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.peopleValidation.editPeopleMediaRequestList,
  siteController.peopleController.editPeopleMediaRequestList,
);

peopleRouter.post(
  "/edit/submit-all-save-people",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "body.people_id", "edit"),
  siteValidation.peopleValidation.editSubmitAllSavePeople,
  siteController.peopleController.editSubmitAllSavePeople,
);

peopleRouter.get(
  "/tmdb-refresh/show-people-primary-details",
  validateApiKey,
  validateAccessToken,
  siteValidation.peopleValidation.tmdbRefreshPrimaryDetails,
  siteController.peopleController.tmdbRefreshPrimaryDetails,
);

peopleRouter.post(
  "/tmdb-refresh/media-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.peopleValidation.tmdbRefreshMediaList,
  siteController.peopleController.tmdbRefreshMediaList,
);

peopleRouter.post(
  "/edit/upload-people-media-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "people_id", "edit", "formdata"),
  customFileHelper.customFileUpload(peopleImageUpload.array("images", 5)),
  siteValidation.peopleValidation.editUploadPeopleMediaImage,
  siteController.peopleController.editUploadPeopleMediaImage,
);

peopleRouter.post(
  "/edit/upload-people-background-image",
  validateApiKey,
  validateAccessToken,
  userAccessControl("people", "people_id", "edit", "formdata"),
  customFileHelper.customFileUpload(peopleImageUpload.single("image")),
  siteValidation.peopleValidation.editUploadPeopleBackgroundImage,
  siteController.peopleController.editUploadPeopleBackgroundImage,
);

export { peopleRouter };
