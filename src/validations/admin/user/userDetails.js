import { celebrate, Joi } from "celebrate";

export const userDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});
