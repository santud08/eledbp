import { celebrate, Joi } from "celebrate";
export const userLogin = celebrate({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});
