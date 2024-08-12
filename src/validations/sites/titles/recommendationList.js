import { celebrate, Joi } from "celebrate";

export const recommendationList = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});
