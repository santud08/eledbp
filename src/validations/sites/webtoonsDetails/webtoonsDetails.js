import { celebrate, Joi } from "celebrate";

export const webtoonsDetails = celebrate({
  params: Joi.object({
    id: Joi.number().required(),
  }),
});