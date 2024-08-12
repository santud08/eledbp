import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const homeRouter = Router();

homeRouter.get(
  "/top-news",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.topNews,
);

homeRouter.get(
  "/born-today",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.bornToday,
);

homeRouter.get(
  "/trendings",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.trendings,
);

homeRouter.get(
  "/hot-videos",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.hotVideos,
);

homeRouter.get(
  "/upcomings",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.comingSoon,
);

homeRouter.get(
  "/latest-trailers",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.latestTrailers,
);

homeRouter.get(
  "/real-time-feeds",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.realTimeFeeds,
);

homeRouter.get(
  "/popular-shows",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.popularShows,
);

homeRouter.get(
  "/new-releases",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.homeValidation.homePage,
  siteController.homeController.newRelease,
);

export { homeRouter };
