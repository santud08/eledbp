import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import { validateApiKey, accessTokenIfAny } from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const listRouter = Router();

listRouter.post(
  "/popular-movies",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.popularMovieDetails,
  siteController.listsController.popularMovieDetails,
);

listRouter.get(
  "/genre-list",
  validateApiKey,
  accessTokenIfAny,
  siteController.listsController.genreList,
);

listRouter.post(
  "/newest-movies",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.movieNewest,
  siteController.listsController.movieNewest,
);

listRouter.post(
  "/newest-tv-shows",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.tvNewest,
  siteController.listsController.tvNewest,
);

listRouter.post(
  "/popular-tv-shows",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.popularTvDetails,
  siteController.listsController.popularTvDetails,
);

listRouter.post(
  "/upcoming-movies",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.upcomingMovieDetails,
  siteController.listsController.upcomingMovieDetails,
);

listRouter.post(
  "/upcoming-tv-shows",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.upcomingTvDetails,
  siteController.listsController.upcomingTvDetails,
);

listRouter.post(
  "/top-rated-movies",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.topRatedMovieDetails,
  siteController.listsController.topRatedMovieDetails,
);

listRouter.post(
  "/top-rated-tv-shows",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.topRatedTvDetails,
  siteController.listsController.topRatedTvDetails,
);

listRouter.post(
  "/popular-webtoons",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.popularWebtoons,
  siteController.listsController.popularWebtoons,
);

listRouter.post(
  "/newest-webtoons",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.newestWebtoons,
  siteController.listsController.newestWebtoons,
);

listRouter.post(
  "/ongoing-webtoons",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.onGoingWebtoons,
  siteController.listsController.onGoingWebtoons,
);

listRouter.post(
  "/completed-webtoons",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.completedWebtoons,
  siteController.listsController.completedWebtoons,
);

listRouter.get(
  "/awards",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.awardList,
  siteController.listsController.awardList,
);

listRouter.get(
  "/videos",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.listsValidation.videoList,
  siteController.listsController.videoList,
);

export { listRouter };
