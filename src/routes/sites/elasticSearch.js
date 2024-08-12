import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, validateAccessToken } from "../../middleware/index.js";
const elasticRouter = Router();

elasticRouter.post(
  "/es/add-document/movie",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esMovieDocument,
);

elasticRouter.post(
  "/es/add-document/people",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esPeopleDocument,
);

elasticRouter.post(
  "/es/add-document/tv",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esTvDocument,
);

elasticRouter.get(
  "/es/show/index-names",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esGetIndexNames,
);

elasticRouter.get(
  "/es/show/index-data",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esGetIndexData,
);

elasticRouter.post(
  "/es/add-document/tag",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esTagDocument,
);

elasticRouter.post(
  "/es/delete/index",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esDeleteIndex,
);

elasticRouter.post(
  "/es/create/index",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esCreateIndex,
);

elasticRouter.post(
  "/es/modify-document",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.modifyDocument,
);

elasticRouter.post(
  "/es/add-document/company",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esCompanyDocument,
);

elasticRouter.post(
  "/es/add-document/webtoons",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esWebtoonsDocument,
);

elasticRouter.post(
  "/es/add-document/award",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esAwardDocument,
);

elasticRouter.post(
  "/es/add-document/video",
  validateApiKey,
  validateAccessToken,
  siteController.elasticController.esVideoDocument,
);

export { elasticRouter };
