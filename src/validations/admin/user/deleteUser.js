import { celebrate, Joi } from "celebrate";

export const deleteUser = celebrate({
  body: Joi.object({
    id: Joi.number().required(),
  }),
});
