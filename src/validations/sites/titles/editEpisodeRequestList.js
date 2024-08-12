import { celebrate, Joi } from "celebrate";
export const editEpisodeRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().allow(null).allow("").optional(),
    draft_season_id: Joi.number().optional().allow("", null),
    season_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    search_text: Joi.string().allow(null).allow("").optional(),
  }),
});
