import { celebrate, Joi } from "celebrate";

export const webtoonsEpisodeRequestList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    draft_season_id: Joi.number().required(),
    site_language: Joi.string().required(),
    search_text: Joi.string().allow(null).allow("").optional(),
  }),
});
