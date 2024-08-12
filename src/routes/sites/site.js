import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny, validateAccessToken } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const siteRouter = Router();

siteRouter.post(
  "/contact-us",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.cmsValidation.contact,
  siteController.cmsController.contact,
);

siteRouter.get("/contact-us/type-list", validateApiKey, siteController.cmsController.type);

siteRouter.get("/:page", validateApiKey, siteController.cmsController.cms);

siteRouter.get(
  "/download/file",
  siteValidation.downloadValidation.fileDownload,
  siteController.downloadController.fileDownload,
);

siteRouter.post(
  "/user-activity",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.logValidation.logUserActivity,
  siteController.logController.logUserActivity,
);

siteRouter.get("/country/list", validateApiKey, siteController.countryController.countryList);

siteRouter.get(
  "/filter/country/list",
  validateApiKey,
  siteValidation.countryValidation.registeredCountryList,
  siteController.countryController.registeredCountryList,
);

//not used - start//
siteRouter.post(
  "/city/list",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.cityValidation.cityList,
  siteController.cityController.cityList,
);
//not used- end//

//this use for developer purpose - start//
siteRouter.post("/migrate/jobs", validateApiKey, siteController.titleController.migrateJobs);

siteRouter.post(
  "/migrate/countries",
  validateApiKey,
  siteController.titleController.migrateCountries,
);

siteRouter.post("/tmdb/search", validateApiKey, siteController.tmdbController.searchTitle);

siteRouter.post(
  "/tmdb/title/details",
  validateApiKey,
  siteController.tmdbController.getTitleDetails,
);

siteRouter.post("/kobis/search", validateApiKey, siteController.kobisController.searchTitle);

siteRouter.post(
  "/kobis/title/details",
  validateApiKey,
  siteController.kobisController.getTitleDetails,
);

siteRouter.post("/zapzee/details", validateApiKey, siteController.zapzeeController.getNewsFeed);

siteRouter.post(
  "/zapzee/details/file/manually",
  validateApiKey,
  siteController.zapzeeController.getNewsFeedManually,
);

siteRouter.post(
  "/zapzee/update/details/file/manually",
  validateApiKey,
  siteController.zapzeeController.updateNewsFeedManually,
);

siteRouter.post(
  "/tmdb/title/images/details",
  validateApiKey,
  siteController.tmdbController.getTitleImageDetails,
);

siteRouter.post(
  "/tmdb/title/videos/details",
  validateApiKey,
  siteController.tmdbController.getTitleVideoDetails,
);

siteRouter.post(
  "/tmdb/title/credits",
  validateApiKey,
  siteController.tmdbController.getTitleCredits,
);

siteRouter.post(
  "/tmdb/title/keywords",
  validateApiKey,
  siteController.tmdbController.getTitleKeywords,
);

siteRouter.post(
  "/update-external-video-details",
  validateApiKey,
  validateAccessToken,
  siteController.videoController.updateExternalVideoDetails,
);

//this use for developer purpose - end//

export { siteRouter };
