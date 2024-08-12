import { celebrate, Joi } from "celebrate";
export const seasonRequestList = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
  }),
});
