import { celebrate, Joi } from "celebrate";

export const webtoonsCastCrewReqList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
    credit_type: Joi.string().required().valid("character", "crew"),
    season_id: Joi.number().required(),
  }),
});
