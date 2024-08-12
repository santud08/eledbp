import { celebrate, Joi } from "celebrate";
export const tmdbRefreshGetEpisodeDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    tmdb_id: Joi.number().required(),
    season_no: Joi.number().required(),
    season_id: Joi.number().allow(null).allow("").optional(),
    episode_number: Joi.number().required(),
    episode_id: Joi.number().allow(null).allow("").optional(),
    language: Joi.string().required(),
  }),
});
