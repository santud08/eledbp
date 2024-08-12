import { celebrate, Joi } from "celebrate";
export const tagRequestList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().optional().allow(""),
    site_language: Joi.string().required(),
  }),
});
