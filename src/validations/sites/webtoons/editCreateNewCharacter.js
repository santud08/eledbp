import { celebrate, Joi } from "celebrate";

export const editCreateNewCharacter = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    credit_type: Joi.string().required().valid("character"),
    description: Joi.string().optional().allow("", null),
    character_name: Joi.string().required(),
    is_guest: Joi.number().required(),
    image: Joi.string().optional().allow("", null),
  }),
});
