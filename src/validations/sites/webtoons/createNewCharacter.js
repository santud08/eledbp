import { celebrate, Joi } from "celebrate";

export const createNewCharacter = celebrate({
  body: Joi.object({
    draft_request_id: Joi.number().required(),
    site_language: Joi.string().required(),
    credit_type: Joi.string().required().valid("character"),
    description: Joi.string().optional().allow("", null),
    character_name: Joi.string().required(),
    is_guest: Joi.number().required(),
    image: Joi.string().optional().allow("", null),
  }),
});
