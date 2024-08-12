import { celebrate, Joi } from "celebrate";

export const checkVerificationCode = celebrate({
  body: Joi.object({
    email: Joi.string().email().required(),
    verification_code: Joi.string().required(),
  }),
});
