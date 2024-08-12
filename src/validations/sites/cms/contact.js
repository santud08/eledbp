import { celebrate, Joi } from "celebrate";
export const contact = celebrate({
  body: Joi.object({
    email: Joi.string().required().email(),
    name: Joi.string().required(),
    type: Joi.string().required().valid("general", "change_information", "add_tags"),
    message: Joi.string().required(),
  }),
});
