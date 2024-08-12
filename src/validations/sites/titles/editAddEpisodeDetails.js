import { celebrate, Joi } from "celebrate";
export const editAddEpisodeDetails = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    draft_season_id: Joi.number().optional().allow("", null),
    draft_episode_id: Joi.number().optional().allow("", null),
    season_id: Joi.number().optional().allow("", null),
    episode_id: Joi.number().optional().allow("", null),
    episode_no: Joi.number().required(),
    episode_title: Joi.string().required(),
    date: Joi.date().allow(null).allow("").optional(),
    overview: Joi.string().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    url: Joi.string().allow(null).allow("").optional(),
    type: Joi.string().allow("", null).valid("tv", "webtoons"),
    image: Joi.string().optional().allow("", null),
  }),
});
