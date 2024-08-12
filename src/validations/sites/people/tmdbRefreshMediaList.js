import { celebrate, Joi } from "celebrate";
export const tmdbRefreshMediaList = celebrate({
  body: Joi.object({
    people_id: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    site_language: Joi.string().required(),
    media_type: Joi.string().required().valid("video", "image"),
  }),
});
