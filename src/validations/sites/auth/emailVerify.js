import { celebrate, Joi } from "celebrate";
export const emailVerify = celebrate({
  body: Joi.object({
    email: Joi.string().required().email(),
    type: Joi.string().optional().valid("", "resend").allow(null).allow(""),
  }),
});
