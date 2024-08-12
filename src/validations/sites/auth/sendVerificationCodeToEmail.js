import { celebrate, Joi } from "celebrate";
export const sendVerificationCodeToEmail = celebrate({
  body: Joi.object({
    email: Joi.string().required().email(),
  }),
});
