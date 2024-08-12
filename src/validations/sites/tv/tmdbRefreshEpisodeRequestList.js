import { celebrate, Joi } from "celebrate";
export const tmdbRefreshEpisodeRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    season_no: Joi.number().required(),
    season_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    search_text: Joi.string().allow(null).allow("").optional(),
  }),
});
