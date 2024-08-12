import { celebrate, Joi } from "celebrate";
export const uploadPeopleMediaImage = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    images: Joi.string().optional().allow("", null),
  }),
});
