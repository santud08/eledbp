import { celebrate, Joi } from "celebrate";

export const editWtMediaRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    media_type: Joi.string().required().valid("video", "image", "poster"),
    season_no: Joi.number().allow(null).allow("").optional(),
    season_id: Joi.number().allow(null).allow("").optional(),
    draft_season_id: Joi.number().allow(null).allow("").optional(),
  }),
});
