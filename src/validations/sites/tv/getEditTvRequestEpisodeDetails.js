import { celebrate, Joi } from "celebrate";
export const getEditTvRequestEpisodeDetails = celebrate({
  query: Joi.object({
    title_id: Joi.number().required(),
    request_id: Joi.number().allow(null).allow("").optional(),
    season_id: Joi.number().allow(null).allow("").optional(),
    draft_season_id: Joi.number().allow(null).allow("").optional(),
    episode_number: Joi.number().allow(null).allow("").optional(),
    episode_id: Joi.number().allow(null).allow("").optional(),
    draft_episode_id: Joi.number().allow(null).allow("").optional(),
    language: Joi.string().allow(null).allow("").optional(),
  }),
});
