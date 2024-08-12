import { celebrate, Joi } from "celebrate";
export const userWithdrawal = celebrate({
  body: Joi.object({
    user_id: Joi.number().required(),
    reason: Joi.string().optional().allow("", null),
  }),
});
