import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import {
  validateApiKey,
  validateAccessToken,
  accessTokenIfAny,
  communityImageUpload,
} from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";
import { customFileHelper } from "../../helpers/index.js";

const communityRouter = Router();

communityRouter.post(
  "/community-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.communityValidation.communityDetails,
  siteController.communityController.communityDetails,
);

communityRouter.post(
  "/community-like",
  validateApiKey,
  validateAccessToken,
  siteValidation.communityValidation.communityLike,
  siteController.communityController.communityLike,
);

communityRouter.post(
  "/community-message-send",
  validateApiKey,
  validateAccessToken,
  customFileHelper.customFileUpload(communityImageUpload.single("image")),
  siteValidation.communityValidation.communityMessageSend,
  siteController.communityController.communityMessageSend,
);

communityRouter.post(
  "/community-message-reply",
  validateApiKey,
  validateAccessToken,
  customFileHelper.customFileUpload(communityImageUpload.single("image")),
  siteValidation.communityValidation.communityMessageReply,
  siteController.communityController.communityMessageReply,
);

communityRouter.post(
  "/community-famous-lines",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.communityValidation.communityFamousLine,
  siteController.communityController.communityFamousLine,
);

export { communityRouter };
