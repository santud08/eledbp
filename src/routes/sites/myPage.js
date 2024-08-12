import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, validateAccessToken, userImageUpload } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const myPageRouter = Router();

myPageRouter.post(
  "/communication-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.myPageValidation.communicationList,
  siteController.myPageController.communicationList,
);

myPageRouter.post(
  "/communication-delete",
  validateApiKey,
  validateAccessToken,
  siteValidation.myPageValidation.communicationDelete,
  siteController.myPageController.communicationDelete,
);

myPageRouter.post(
  "/favourite-list",
  validateApiKey,
  validateAccessToken,
  siteValidation.myPageValidation.favouriteList,
  siteController.myPageController.favouriteList,
);

myPageRouter.get(
  "/get-user-settings",
  validateApiKey,
  validateAccessToken,
  siteController.myPageController.userSettings,
);

myPageRouter.post(
  "/user-withdrawal",
  validateApiKey,
  validateAccessToken,
  siteValidation.myPageValidation.userWithdrawal,
  siteController.myPageController.userWithdrawal,
);

myPageRouter.post(
  "/user-change-password",
  validateApiKey,
  validateAccessToken,
  siteValidation.myPageValidation.userChangePassword,
  siteController.myPageController.userChangePassword,
);

myPageRouter.get(
  "/menu-user-information",
  validateApiKey,
  validateAccessToken,
  siteController.myPageController.userInformation,
);

myPageRouter.post(
  "/save-user-details",
  validateApiKey,
  validateAccessToken,
  customFileHelper.customFileUpload(userImageUpload.single("profile_image")),
  siteValidation.myPageValidation.saveUserDetails,
  siteController.myPageController.saveUserDetails,
);

export { myPageRouter };
