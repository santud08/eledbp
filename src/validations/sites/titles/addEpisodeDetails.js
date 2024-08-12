import { celebrate, Joi } from "celebrate";
export const addEpisodeDetails = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    draft_season_id: Joi.number().required(),
    episode_no: Joi.number().required(),
    episode_title: Joi.string().required(),
    date: Joi.date().allow(null).allow("").optional(),
    overview: Joi.string().allow(null).allow("").optional(),
    url: Joi.string().allow(null).allow("").optional(),
    site_language: Joi.string().required(),
    type: Joi.string().allow("", null).valid("tv", "webtoons"),
    image: Joi.string().optional().allow("", null),
  }),
});
