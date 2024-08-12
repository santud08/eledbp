import { celebrate, Joi } from "celebrate";
export const tmdbRefreshGetPrimaryDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    site_language: Joi.string().required(),
    tmdb_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv"),
  }),
});
