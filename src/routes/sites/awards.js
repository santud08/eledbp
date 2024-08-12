import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const awardsRouter = Router();

awardsRouter.get(
  "/details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.awardValidation.awardDetails,
  siteController.awardController.awardDetails,
);

awardsRouter.get(
  "/nominee-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.awardValidation.awardNomineeDetails,
  siteController.awardController.awardNomineeDetails,
);

awardsRouter.get(
  "/:type/details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.awardValidation.awardItemsDetails,
  siteController.awardController.awardItemsDetails,
);

export { awardsRouter };
