import { celebrate, Joi } from "celebrate";
export const checkEmail = celebrate({
  body: Joi.object({
    email: Joi.string().required().email(),
  }),
});
