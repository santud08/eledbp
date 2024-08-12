import { celebrate, Joi } from "celebrate";

export const saveUserDetails = celebrate({
  body: Joi.object({
    user_id: Joi.number().required(),
    user_name: Joi.string().required(),
    user_email: Joi.string().email().required(),
    is_delete_image: Joi.string().required().valid("y", "n"),
    user_default_language: Joi.string().required().valid("en", "ko"),
    profile_image: Joi.string().optional().allow("", null),
  }),
});
