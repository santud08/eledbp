import { celebrate, Joi } from "celebrate";
export const tmdbRefreshSeasonRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    site_language: Joi.string().required(),
  }),
});
