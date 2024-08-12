import { celebrate, Joi } from "celebrate";
export const tmdbRefreshGetSeasonDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    language: Joi.string().required(),
    season_no: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    season_id: Joi.number().optional().allow("", null),
  }),
});
