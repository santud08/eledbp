import { celebrate, Joi } from "celebrate";
export const tmdbRefreshPrimaryDetails = celebrate({
  query: Joi.object({
    people_id: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    site_language: Joi.string().required(),
  }),
});
