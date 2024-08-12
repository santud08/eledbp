import { celebrate, Joi } from "celebrate";
export const uploadBackgroundImage = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
    image: Joi.string().optional().allow("", null),
  }),
});
