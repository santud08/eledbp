import { celebrate, Joi } from "celebrate";

export const getTvRequestEpisodeDetails = celebrate({
  query: Joi.object({
    language: Joi.string().required(),
    episode_id: Joi.number().optional().allow("", null),
    tmdb_id: Joi.number().optional().allow("", null),
    episode_number: Joi.number().optional().allow("", null),
    season_no: Joi.number().optional().allow("", null),
  }),
  params: Joi.object({
    id: Joi.number().required(),
  }),
});
