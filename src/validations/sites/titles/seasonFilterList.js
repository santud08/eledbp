import { celebrate, Joi } from "celebrate";
export const seasonFilterList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
    type: Joi.string().allow("", null).valid("tv", "webtoons"),
  }),
});
