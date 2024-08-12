import { celebrate, Joi } from "celebrate";

export const editWtCastCrewRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    credit_type: Joi.string().required().valid("character", "crew"),
    season_id: Joi.number().allow(null).allow("").optional(),
    draft_season_id: Joi.number().allow(null).allow("").optional(),
  }),
});
