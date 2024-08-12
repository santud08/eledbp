import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, validateAccessToken, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const userRouter = Router();

userRouter.post(
  "/save-user-theme",
  validateApiKey,
  validateAccessToken,
  siteValidation.userValidation.saveUserTheme,
  siteController.userController.saveUserTheme,
);

userRouter.post(
  "/shared",
  validateApiKey,
  validateAccessToken,
  siteValidation.userValidation.sharedDetails,
  siteController.userController.sharedDetails,
);

userRouter.post(
  "/add-favourite",
  validateApiKey,
  validateAccessToken,
  siteValidation.userValidation.favouriteAdd,
  siteController.userController.favouriteAdd,
);

userRouter.post(
  "/add-rating",
  validateApiKey,
  validateAccessToken,
  siteValidation.userValidation.ratingAdd,
  siteController.userController.ratingAdd,
);

userRouter.post(
  "/update-view",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.userValidation.updateView,
  siteController.userController.updateView,
);

export { userRouter };
