import { celebrate, Joi } from "celebrate";
export const tmdbRefreshGetMediaDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    title_type: Joi.string().required().valid("movie", "tv"),
    site_language: Joi.string().required(),
    media_type: Joi.string().required().valid("video", "image", "poster"),
    season_id: Joi.number().allow(null).allow("").optional(),
    season_no: Joi.number()
      .required()
      .when("title_type", {
        is: Joi.string().valid("tv"),
        then: Joi.number().required(),
      })
      .concat(
        Joi.number()
          .optional()
          .when("title_type", {
            is: Joi.string().valid("movie"),
            then: Joi.number().allow(null).allow("").optional(),
          }),
      ),
  }),
});
