import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, validateAccessToken, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const searchRouter = Router();

searchRouter.get(
  "/search-suggestion",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.searchValidation.searchSuggestion,
  siteController.searchController.searchSuggestion,
);

searchRouter.post(
  "/search-title-to-add",
  validateApiKey,
  validateAccessToken,
  siteValidation.searchValidation.searchTitle,
  siteController.searchController.searchTitle,
);

searchRouter.post(
  "/search-results",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.searchValidation.searchResults,
  siteController.searchController.searchResults,
);

searchRouter.post(
  "/tag-details",
  validateApiKey,
  siteValidation.searchValidation.tagDetails,
  siteController.searchController.tagDetails,
);

searchRouter.post(
  "/company-details",
  validateApiKey,
  siteValidation.searchValidation.companyDetails,
  siteController.searchController.companyDetails,
);

searchRouter.post(
  "/search-people-to-add",
  validateApiKey,
  validateAccessToken,
  siteValidation.searchValidation.searchPeople,
  siteController.searchController.searchPeople,
);

export { searchRouter };
