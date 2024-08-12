import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const tagRouter = Router();

tagRouter.get(
  "/title/main-category-list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tagValidation.mainCategoryList,
  siteController.tagController.mainCategoryList,
);

tagRouter.get(
  "/title/sub-category-list/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tagValidation.subCategoryList,
  siteController.tagController.subCategoryList,
);

tagRouter.get(
  "/title/tag-search/:main_catid/:sub_catid",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tagValidation.tagSearchList,
  siteController.tagController.tagSearchList,
);

tagRouter.get(
  "/title/filter/tag-search",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.tagValidation.tagFilterSearchList,
  siteController.tagController.tagFilterSearchList,
);

export { tagRouter };
