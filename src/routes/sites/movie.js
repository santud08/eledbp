import { Router } from "express";
import { siteController } from "../../controllers/index.js";
import {
  validateApiKey,
  validateAccessToken,
  accessTokenIfAny,
  userAccessControl,
} from "../../middleware/index.js";
import { siteValidation } from "../../validations/index.js";

const movieRouter = Router();

movieRouter.post(
  "/add-movie-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("movie", "", "add"),
  siteValidation.movieValidation.addMoviePrimaryDetails,
  siteController.movieController.addMoviePrimaryDetails,
);

movieRouter.get(
  "/movie/details/:id",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.movieValidation.movieDetails,
  siteController.movieController.movieDetails,
);

movieRouter.get(
  "/get-movie-primary-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.movieValidation.getMoviePrimaryDetails,
  siteController.movieController.getMoviePrimaryDetails,
);

movieRouter.post(
  "/edit/movie-primary-details",
  validateApiKey,
  validateAccessToken,
  userAccessControl("movie", "body.title_id", "edit"),
  siteValidation.movieValidation.editMoviePrimaryDetails,
  siteController.movieController.editMoviePrimaryDetails,
);

movieRouter.get(
  "/edit/get-movie-primary-details",
  validateApiKey,
  accessTokenIfAny,
  siteValidation.movieValidation.editGetMoviePrimaryDetails,
  siteController.movieController.editGetMoviePrimaryDetails,
);

export { movieRouter };
