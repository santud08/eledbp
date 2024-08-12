import { celebrate, Joi } from "celebrate";
export const uploadPeopleBackgroundImage = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    image: Joi.string().optional().allow("", null),
  }),
});
