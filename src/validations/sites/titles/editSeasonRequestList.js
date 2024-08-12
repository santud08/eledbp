import { celebrate, Joi } from "celebrate";
export const editSeasonRequestList = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
  }),
});
